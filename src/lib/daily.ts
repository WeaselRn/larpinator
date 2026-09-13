import { getSupabaseAdmin } from "./supabase";
import type { Profile } from "./types";

export interface DailyChallenge {
  id: string;
  prompt: string;
  dayIndex: number;
}

export interface DailyAttemptSummary {
  id: string;
  larp_score: number;
  roast: string;
  response: string;
  created_at: string;
}

/** Deterministic rotation: everyone gets the same challenge on the same UTC day. */
export async function getTodayChallenge(date = new Date()): Promise<DailyChallenge | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("daily_larps")
    .select("id, prompt, sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return null;

  const dayIndex = Math.floor(date.getTime() / 86_400_000);
  const row = data[dayIndex % data.length];
  return { id: row.id, prompt: row.prompt, dayIndex };
}

export interface DailyOverview {
  challenge: DailyChallenge;
  attempts: DailyAttemptSummary[];
  best: number;
  rank: number | null;
}

/** Today's challenge + the user's attempts and rank for it. */
export async function getDailyOverview(profile: Profile): Promise<DailyOverview | null> {
  const challenge = await getTodayChallenge();
  if (!challenge) return null;

  const supabase = getSupabaseAdmin();
  const { data: attempts } = await supabase
    .from("daily_larp_attempts")
    .select("id, larp_score, roast, response, created_at")
    .eq("user_id", profile.id)
    .eq("daily_larp_id", challenge.id)
    .order("created_at", { ascending: false });

  const mapped: DailyAttemptSummary[] = (attempts ?? []).map((a) => ({
    id: a.id,
    larp_score: Number(a.larp_score),
    roast: a.roast,
    response: a.response,
    created_at: a.created_at,
  }));

  const best = mapped.reduce((max, a) => Math.max(max, a.larp_score), 0);
  const rank = mapped.length > 0 ? await getDailyRank(challenge.id, profile.id, best) : null;

  return { challenge, attempts: mapped, best, rank };
}

/** Rank of a user's best score for a given daily challenge (1 = highest LARP). */
export async function getDailyRank(challengeId: string, profileId: string, myScore: number): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("daily_larp_attempts")
    .select("user_id, larp_score")
    .eq("daily_larp_id", challengeId);

  const bestByUser = new Map<string, number>();
  for (const row of data ?? []) {
    const score = Number(row.larp_score);
    const current = bestByUser.get(row.user_id);
    if (current === undefined || score > current) bestByUser.set(row.user_id, score);
  }
  bestByUser.set(profileId, Math.max(myScore, bestByUser.get(profileId) ?? 0));

  let rank = 1;
  for (const [userId, score] of bestByUser) {
    if (userId !== profileId && score > myScore) rank++;
  }
  return rank;
}
