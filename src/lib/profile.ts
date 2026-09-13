import { currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "./supabase";
import { computeCategoryScores, computeOverallScore } from "./scoring";
import { tierNameForScore } from "./tiers";
import type { LatestAnalysisSummary, Profile, ScoreType } from "./types";

type ClerkUserLike = {
  id: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  primaryEmailAddress?: { emailAddress?: string | null } | null;
};

function usernameFromClerk(user: ClerkUserLike): string {
  const raw =
    user.username ||
    [user.firstName, user.lastName].filter(Boolean).join("") ||
    user.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    `larper_${user.id.slice(-6)}`;

  const clean = raw
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);

  return clean || `larper_${Math.floor(Math.random() * 1_000_000)}`;
}

/**
 * Returns the profile for the currently signed-in Clerk user, creating it on
 * first visit. Never trusts a client-supplied user id.
 */
export async function ensureProfile(): Promise<Profile | null> {
  const user = await currentUser();
  if (!user) return null;

  const supabase = getSupabaseAdmin();
  const { data: existing, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(`Supabase error: ${error.message}`);

  if (existing) {
    const avatar = user.imageUrl ?? null;
    if (avatar && existing.avatar_url !== avatar) {
      const { data: updated } = await supabase
        .from("profiles")
        .update({ avatar_url: avatar, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (updated) return updated as Profile;
    }
    return existing as Profile;
  }

  const base = usernameFromClerk(user);
  let username = base;
  for (let i = 0; i < 6; i++) {
    const { data: clash } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
    if (!clash) break;
    username = `${base}_${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({ clerk_user_id: user.id, username, avatar_url: user.imageUrl ?? null })
    .select("*")
    .single();

  if (insertError) {
    const { data: retry } = await supabase
      .from("profiles")
      .insert({
        clerk_user_id: user.id,
        username: `${base}_${Date.now().toString(36).slice(-4)}`,
        avatar_url: user.imageUrl ?? null,
      })
      .select("*")
      .single();
    if (retry) return retry as Profile;
    throw new Error(`Could not create profile: ${insertError.message}`);
  }

  return created as Profile;
}

export async function getProfileById(profileId: string): Promise<Profile | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("profiles").select("*").eq("id", profileId).maybeSingle();
  return (data as Profile) ?? null;
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", username)
    .maybeSingle();
  return (data as Profile) ?? null;
}

/** Latest analysis per type for a user — the source data for scoring. */
export async function fetchLatestAnalyses(
  profileId: string,
): Promise<Record<string, LatestAnalysisSummary>> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("analyses")
    .select("type, score, category_scores, roast, created_at")
    .eq("user_id", profileId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(`Supabase error: ${error.message}`);

  const latest: Record<string, LatestAnalysisSummary> = {};
  for (const row of data ?? []) {
    if (!latest[row.type]) {
      latest[row.type] = {
        type: row.type,
        score: Number(row.score),
        category_scores: (row.category_scores as Record<string, number>) ?? {},
        roast: row.roast ?? "",
        created_at: row.created_at,
      };
    }
  }
  return latest;
}

/**
 * Recomputes the cached overall score, tier and category scores from the
 * latest analyses and writes them to the profile. `extra` allows callers to
 * merge additional updates (xp, streak) into the same write.
 */
export async function refreshProfileScore(
  profileId: string,
  extra?: Record<string, unknown>,
): Promise<{ profile: Profile; latest: Record<string, LatestAnalysisSummary> }> {
  const latest = await fetchLatestAnalyses(profileId);

  const scores: Partial<Record<ScoreType, number>> = {};
  for (const [type, summary] of Object.entries(latest)) {
    scores[type as ScoreType] = summary.score;
  }

  const { overall } = computeOverallScore(scores);
  const categories = computeCategoryScores(latest);
  const tier = tierNameForScore(overall);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      overall_larp_score: overall,
      larp_tier: tier,
      category_scores: categories,
      updated_at: new Date().toISOString(),
      ...extra,
    })
    .eq("id", profileId)
    .select("*")
    .single();

  if (error) throw new Error(`Supabase error: ${error.message}`);
  return { profile: data as Profile, latest };
}
