import { getSupabaseAdmin } from "./supabase";
import type { Achievement, LatestAnalysisSummary, Profile } from "./types";

export interface AchievementContext {
  profile: Profile;
  latest: Record<string, LatestAnalysisSummary>;
  battleWins: number;
  analysisCount: number;
}

interface AchievementDef {
  key: string;
  name: string;
  description: string;
  icon: string;
  check: (ctx: AchievementContext) => boolean;
}

function maxCategory(ctx: AchievementContext, category: string): number {
  let max = 0;
  for (const summary of Object.values(ctx.latest)) {
    const value = summary.category_scores?.[category];
    if (typeof value === "number" && value > max) max = value;
  }
  return max;
}

/**
 * Achievement rules live here (centralized). Icons/names are mirrored into
 * the `achievements` table by the seed migration.
 */
export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    key: "buzzword_merchant",
    name: "Buzzword Merchant",
    icon: "🧢",
    description: "Scored 90+ on Buzzword LARP in a single analysis.",
    check: (ctx) => maxCategory(ctx, "buzzword") >= 90,
  },
  {
    key: "certified_cringe",
    name: "Certified Cringe",
    icon: "🤡",
    description: "Scored 90+ on Cringe in a single analysis.",
    check: (ctx) => maxCategory(ctx, "cringe") >= 90,
  },
  {
    key: "delusion_maxxing",
    name: "Delusion Maxxing",
    icon: "💀",
    description: "Scored 90+ on Fakeness in a single analysis.",
    check: (ctx) => maxCategory(ctx, "fakeness") >= 90,
  },
  {
    key: "aura_farmer",
    name: "Aura Farmer",
    icon: "⚡",
    description: "Scored 90+ on Aura in a single analysis.",
    check: (ctx) => maxCategory(ctx, "aura") >= 90,
  },
  {
    key: "no_larp_detected",
    name: "No LARP Detected",
    icon: "🧘",
    description: "Held an overall LARP score of 20 or below with at least one completed analysis.",
    check: (ctx) => ctx.analysisCount > 0 && ctx.profile.overall_larp_score <= 20,
  },
  {
    key: "larp_slayer",
    name: "LARP Slayer",
    icon: "⚔️",
    description: "Won 3 LARP battles.",
    check: (ctx) => ctx.battleWins >= 3,
  },
  {
    key: "larp_god",
    name: "LARP GOD",
    icon: "👑",
    description: "Reached an overall LARP score of 100.",
    check: (ctx) => ctx.profile.overall_larp_score >= 100,
  },
];

export async function getBattleWins(profileId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count } = await supabase
    .from("battles")
    .select("id", { count: "exact", head: true })
    .eq("winner_id", profileId);
  return count ?? 0;
}

export async function countAnalyses(profileId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count } = await supabase
    .from("analyses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profileId);
  return count ?? 0;
}

/** Awards any newly-qualified achievements. Returns only the new ones. */
export async function evaluateAchievements(ctx: AchievementContext): Promise<Achievement[]> {
  const qualifying = ACHIEVEMENT_DEFS.filter((def) => {
    try {
      return def.check(ctx);
    } catch {
      return false;
    }
  });
  if (qualifying.length === 0) return [];

  const supabase = getSupabaseAdmin();
  const keys = qualifying.map((d) => d.key);

  const { data: rows } = await supabase
    .from("achievements")
    .select("id, key, name, description, icon")
    .in("key", keys);
  if (!rows || rows.length === 0) return [];

  const { data: owned } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", ctx.profile.id);
  const ownedIds = new Set((owned ?? []).map((r) => r.achievement_id));

  const toAward = rows.filter((r) => !ownedIds.has(r.id));
  if (toAward.length === 0) return [];

  const { error } = await supabase.from("user_achievements").upsert(
    toAward.map((r) => ({ user_id: ctx.profile.id, achievement_id: r.id })),
    { onConflict: "user_id,achievement_id", ignoreDuplicates: true },
  );
  if (error) return [];

  return toAward.map((r) => ({
    id: r.id,
    key: r.key,
    name: r.name,
    description: r.description,
    icon: r.icon,
  }));
}

export async function getUserAchievements(
  profileId: string,
): Promise<(Achievement & { earned_at: string })[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("user_achievements")
    .select("earned_at, achievements (id, key, name, description, icon)")
    .eq("user_id", profileId)
    .order("earned_at", { ascending: false });

  return (data ?? []).flatMap((row) => {
    const achievement = row.achievements as unknown as Achievement | null;
    if (!achievement) return [];
    return [{ ...achievement, earned_at: row.earned_at }];
  });
}
