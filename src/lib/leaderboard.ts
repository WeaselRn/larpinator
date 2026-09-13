import { getSupabaseAdmin } from "./supabase";

export type BoardKey =
  | "global"
  | "lowest"
  | "aura"
  | "cringe"
  | "buzzword"
  | "quiz"
  | "battle"
  | "daily"
  | "streak";

export interface BoardDef {
  key: BoardKey;
  label: string;
  emoji: string;
  blurb: string;
  unit?: string;
}

export const BOARDS: BoardDef[] = [
  { key: "global", label: "Global LARP", emoji: "🏆", blurb: "Highest overall LARP score" },
  { key: "lowest", label: "Least LARP", emoji: "🧘", blurb: "Suspiciously genuine people" },
  { key: "aura", label: "Highest Aura", emoji: "⚡", blurb: "Certified aura farmers" },
  { key: "cringe", label: "Most Cringe", emoji: "🤡", blurb: "We're not mad, we're impressed" },
  { key: "buzzword", label: "Buzzword Merchant", emoji: "🧢", blurb: "Synergy. Leverage. Scalable." },
  { key: "quiz", label: "Quiz Champions", emoji: "🧠", blurb: "Best quiz LARP scores" },
  { key: "battle", label: "Battle Champions", emoji: "⚔️", blurb: "Most battle wins", unit: "wins" },
  { key: "daily", label: "Daily LARP", emoji: "🎯", blurb: "Best daily challenge scores" },
  { key: "streak", label: "Longest Streak", emoji: "🔥", blurb: "Consecutive daily LARPs", unit: "days" },
];

export interface LeaderboardRow {
  rank: number;
  id: string;
  username: string;
  avatar_url: string | null;
  value: number;
  tier: string;
}

/**
 * Leaderboards derive entirely from stored user scores (profiles + activity
 * tables). Nothing here is manually maintained.
 */
export async function getLeaderboard(board: BoardKey, limit = 25): Promise<LeaderboardRow[]> {
  const supabase = getSupabaseAdmin();

  if (board === "global" || board === "lowest") {
    const { data, error } = await supabase
      .from("leaderboard_entries")
      .select("id, username, avatar_url, overall_larp_score, larp_tier")
      .order("overall_larp_score", { ascending: board === "lowest" })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row, i) => ({
      rank: i + 1,
      id: row.id,
      username: row.username,
      avatar_url: row.avatar_url,
      value: Number(row.overall_larp_score),
      tier: row.larp_tier,
    }));
  }

  if (board === "aura" || board === "cringe" || board === "buzzword") {
    const { data, error } = await supabase
      .from("leaderboard_entries")
      .select(`id, username, avatar_url, larp_tier, ${board}`)
      .gt(board, 0)
      .order(board, { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row, i) => ({
      rank: i + 1,
      id: row.id,
      username: row.username,
      avatar_url: row.avatar_url,
      value: Number((row as unknown as Record<string, unknown>)[board] ?? 0),
      tier: row.larp_tier,
    }));
  }

  if (board === "streak") {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, larp_tier, streak")
      .gt("streak", 0)
      .order("streak", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row, i) => ({
      rank: i + 1,
      id: row.id,
      username: row.username,
      avatar_url: row.avatar_url,
      value: Number(row.streak),
      tier: row.larp_tier,
    }));
  }

  const view =
    board === "quiz" ? "leaderboard_quiz" : board === "battle" ? "leaderboard_battle" : "leaderboard_daily";

  const { data, error } = await supabase
    .from(view)
    .select("id, username, avatar_url, larp_tier, value")
    .order("value", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  return (data ?? []).map((row, i) => ({
    rank: i + 1,
    id: row.id,
    username: row.username,
    avatar_url: row.avatar_url,
    value: Number(row.value),
    tier: row.larp_tier,
  }));
}

export function boardDef(key: BoardKey): BoardDef {
  return BOARDS.find((b) => b.key === key) ?? BOARDS[0];
}

export function isBoardKey(value: string | null | undefined): value is BoardKey {
  return BOARDS.some((b) => b.key === value);
}
