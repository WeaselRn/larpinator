import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { AiValidationError } from "@/lib/ai-schemas";
import { runDailyAnalysis } from "@/lib/analyzers";
import { errorMessage, jsonError, jsonOk } from "@/lib/api";
import { getDailyOverview, getDailyRank, getTodayChallenge } from "@/lib/daily";
import { todayKey, yesterdayKey } from "@/lib/format";
import { ensureProfile } from "@/lib/profile";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const { userId } = await auth();
  if (!userId) return jsonError("Sign in to get LARPed, bestie.", 401);

  try {
    const profile = await ensureProfile();
    if (!profile) return jsonError("Sign in to get LARPed, bestie.", 401);

    const overview = await getDailyOverview(profile);
    if (!overview) {
      return jsonError("No daily challenges seeded. Run the seed migration (002_seed.sql) so we can cook you.", 500);
    }

    return jsonOk({
      challenge: { id: overview.challenge.id, prompt: overview.challenge.prompt },
      attempts: overview.attempts,
      best: overview.best,
      rank: overview.rank,
      streak: profile.streak,
      completed_today: overview.attempts.length > 0,
    });
  } catch (err) {
    return jsonError(errorMessage(err), 500);
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return jsonError("Sign in to get LARPed, bestie.", 401);

  try {
    const profile = await ensureProfile();
    if (!profile) return jsonError("Sign in to get LARPed, bestie.", 401);

    const body = (await request.json().catch(() => null)) as { response?: string } | null;
    const response = (body?.response ?? "").trim();
    if (!response) {
      return jsonError("Write something first. Even a bad answer is content, bestie.", 400);
    }

    const challenge = await getTodayChallenge();
    if (!challenge) {
      return jsonError("No daily challenges seeded. Run the seed migration (002_seed.sql) so we can cook you.", 500);
    }

    const today = todayKey();
    const yesterday = yesterdayKey();
    let streak = profile.streak;
    if (profile.last_daily_date === today) {
      // already completed one today — streak unchanged
    } else if (profile.last_daily_date === yesterday) {
      streak += 1;
    } else {
      streak = 1;
    }

    const outcome = await runDailyAnalysis(profile, challenge.prompt, response, {
      streak,
      last_daily_date: today,
    });

    const supabase = getSupabaseAdmin();
    await supabase.from("daily_larp_attempts").insert({
      user_id: profile.id,
      daily_larp_id: challenge.id,
      response,
      larp_score: outcome.result.overall_score,
      roast: outcome.result.roast,
      findings: outcome.result.findings,
    });

    const rank = await getDailyRank(challenge.id, profile.id, outcome.result.overall_score);

    return jsonOk({
      result: outcome.result,
      rank,
      streak: outcome.profile.streak,
      profile: outcome.profile,
      new_achievements: outcome.newAchievements,
    });
  } catch (err) {
    if (err instanceof AiValidationError) {
      return jsonError(err.message, 502);
    }
    const message = errorMessage(err);
    return jsonError(message, message.includes("AI provider") ? 503 : 400);
  }
}
