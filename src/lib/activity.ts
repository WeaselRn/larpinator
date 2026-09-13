import { getSupabaseAdmin } from "./supabase";
import { XP_REWARDS, clampScore } from "./scoring";
import { refreshProfileScore } from "./profile";
import { countAnalyses, evaluateAchievements, getBattleWins } from "./achievements";
import type { Achievement, Finding, LatestAnalysisSummary, Profile, ScoreType } from "./types";

export interface RecordActivityInput {
  profileId: string;
  type: ScoreType;
  score: number;
  categoryScores?: Record<string, number>;
  roast: string;
  improvements?: string[];
  findings?: Finding[];
  rawResult?: unknown;
  xp?: number;
  /** Extra columns merged into the profile update (e.g. streak fields). */
  extraProfileUpdates?: Record<string, unknown>;
}

export interface RecordActivityResult {
  profile: Profile;
  latest: Record<string, LatestAnalysisSummary>;
  newAchievements: Achievement[];
}

/**
 * The single write-path for every completed activity: persists the analysis,
 * awards XP, recalculates the overall score/tier, and evaluates achievements.
 * Individual analyzers must not write to profiles directly.
 */
export async function recordActivity(input: RecordActivityInput): Promise<RecordActivityResult> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("analyses").insert({
    user_id: input.profileId,
    type: input.type,
    score: clampScore(input.score),
    category_scores: input.categoryScores ?? {},
    roast: input.roast ?? "",
    improvements: input.improvements ?? [],
    findings: input.findings ?? [],
    raw_result: input.rawResult ?? null,
  });

  if (error) throw new Error(`Could not save analysis: ${error.message}`);

  const xp = input.xp ?? XP_REWARDS[input.type] ?? 0;
  const { data: current } = await supabase
    .from("profiles")
    .select("xp")
    .eq("id", input.profileId)
    .single();

  const { profile, latest } = await refreshProfileScore(input.profileId, {
    xp: (current?.xp ?? 0) + xp,
    ...(input.extraProfileUpdates ?? {}),
  });

  const [battleWins, analysisCount] = await Promise.all([
    getBattleWins(profile.id),
    countAnalyses(profile.id),
  ]);

  const newAchievements = await evaluateAchievements({
    profile,
    latest,
    battleWins,
    analysisCount,
  });

  return { profile, latest, newAchievements };
}
