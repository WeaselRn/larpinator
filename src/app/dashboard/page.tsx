import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CategoryBars } from "@/components/category-bars";
import { DbNotice } from "@/components/db-notice";
import { HistoryGraph, type HistoryPoint } from "@/components/history-graph";
import { DownloadCardButton, LarpCard } from "@/components/larp-card";
import { ShareButton } from "@/components/share-button";
import { TierBadge } from "@/components/tier-badge";
import { ACHIEVEMENT_DEFS, getUserAchievements } from "@/lib/achievements";
import { ANALYSIS_META } from "@/lib/categories";
import { timeAgo } from "@/lib/format";
import { ensureProfile, fetchLatestAnalyses } from "@/lib/profile";
import { getSupabaseAdmin } from "@/lib/supabase";
import { scoreColor } from "@/lib/ui";
import type { Achievement, Profile, ScoreType } from "@/lib/types";

const ACTIVITY_TYPES: ScoreType[] = ["cv", "github", "music", "combined", "quiz", "daily", "battle"];

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  let profile: Profile | null = null;
  let latest: Awaited<ReturnType<typeof fetchLatestAnalyses>> = {};
  let achievements: (Achievement & { earned_at: string })[] = [];
  let history: HistoryPoint[] = [];
  let loadError: string | null = null;

  try {
    profile = await ensureProfile();
    if (profile) {
      const supabase = getSupabaseAdmin();
      const [latestData, achievementData, historyResult] = await Promise.all([
        fetchLatestAnalyses(profile.id),
        getUserAchievements(profile.id),
        supabase
          .from("analyses")
          .select("score, type, created_at")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: true })
          .limit(200),
      ]);
      latest = latestData;
      achievements = achievementData;
      history = (historyResult.data ?? []).map((row) => ({
        score: Number(row.score),
        type: row.type,
        created_at: row.created_at,
      }));
    }
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Failed to load profile.";
  }

  if (loadError || !profile) {
    return <DbNotice message={loadError ?? undefined} />;
  }

  const earnedKeys = new Set(achievements.map((a) => a.key));
  const stats = Object.entries(profile.category_scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const cardStats = Object.entries(profile.category_scores)
    .slice(0, 4)
    .map(([key, value]) => ({ label: key.replace(/_/g, " "), value }));

  const cardData = {
    username: profile.username,
    avatarUrl: profile.avatar_url,
    score: profile.overall_larp_score,
    tier: profile.larp_tier,
    stats: cardStats,
    achievement: achievements[0] ? { icon: achievements[0].icon, name: achievements[0].name } : null,
    xp: profile.xp,
  };

  const doneCount = ACTIVITY_TYPES.filter((t) => latest[t]).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Header */}
      <div className="panel relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-hot/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          {profile.avatar_url ? (
            <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl ring-2 ring-hot/50">
              <Image
                src={profile.avatar_url}
                alt={profile.username}
                fill
                className="object-cover"
                sizes="80px"
              />
            </span>
          ) : (
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-panel-2 text-4xl ring-2 ring-hot/50">
              🧢
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] tracking-widest text-muted uppercase">my larp</p>
            <h1 className="title-display text-4xl break-all sm:text-5xl">
              {profile.username.toUpperCase()}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <TierBadge score={profile.overall_larp_score} />
              <span className="chip">⚡ {profile.xp} XP</span>
              <span className="chip">🔥 {profile.streak} day streak</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 sm:items-end">
            <span
              className="title-display text-6xl leading-none"
              style={{
                color: scoreColor(profile.overall_larp_score),
                textShadow: `0 0 34px ${scoreColor(profile.overall_larp_score)}66`,
              }}
            >
              {Math.round(profile.overall_larp_score)}
            </span>
            <span className="font-mono text-xs text-muted">
              overall larp · {doneCount}/7 activities
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Stats */}
        <div className="flex flex-col gap-6">
          {stats.length > 0 ? (
            <CategoryBars categories={Object.fromEntries(stats)} />
          ) : (
            <div className="panel flex flex-col items-center gap-2 p-8 text-center">
              <span className="text-4xl">🫥</span>
              <p className="font-bold">No stats yet.</p>
              <p className="text-sm text-muted">
                Complete an analysis to start building your LARP profile.
              </p>
              <Link href="/analyze" className="btn-hot mt-2">
                Analyze something
              </Link>
            </div>
          )}

          {/* Activity */}
          <div className="panel p-5 sm:p-6">
            <h3 className="title-display mb-4 text-xl">ACTIVITY</h3>
            <ul className="flex flex-col divide-y divide-edge/60">
              {ACTIVITY_TYPES.map((type) => {
                const entry = latest[type];
                return (
                  <li key={type} className="flex items-center gap-3 py-3">
                    <span className="text-xl">{ANALYSIS_META[type].emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{ANALYSIS_META[type].label}</p>
                      <p className="font-mono text-[10px] text-muted">
                        {entry ? timeAgo(entry.created_at) : "not attempted"}
                      </p>
                    </div>
                    {entry ? (
                      <span
                        className="font-mono text-lg font-bold"
                        style={{ color: scoreColor(entry.score) }}
                      >
                        {Math.round(entry.score)}
                      </span>
                    ) : (
                      <Link
                        href={ANALYSIS_META[type].href}
                        className="font-mono text-xs text-hot hover:underline"
                      >
                        do it →
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <HistoryGraph points={history} />

          {/* Achievements */}
          <div className="panel p-5 sm:p-6">
            <h3 className="title-display mb-4 text-xl">ACHIEVEMENTS</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ACHIEVEMENT_DEFS.map((def) => {
                const earned = earnedKeys.has(def.key);
                return (
                  <div
                    key={def.key}
                    className={`panel-2 flex items-center gap-3 p-3 ${
                      earned ? "border-amber/50" : "opacity-45"
                    }`}
                  >
                    <span className="text-2xl">{earned ? def.icon : "🔒"}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{def.name}</p>
                      <p className="font-mono text-[9px] leading-tight text-muted">
                        {def.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* LARP Card */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <LarpCard data={cardData} />
        <div className="panel flex flex-col justify-center gap-4 p-6">
          <h3 className="title-display text-2xl">SHARE THE DAMAGE</h3>
          <p className="text-sm text-muted">
            Your LARP card is the receipt. Share it, download it, frame it. Someone has to know
            how hard you&apos;re LARPing.
          </p>
          <div className="flex flex-wrap gap-3">
            <ShareButton
              url={`/card/${profile.username}`}
              text={`I'm a certified ${profile.larp_tier} on LARPINATOR (${Math.round(profile.overall_larp_score)}/100). Get LARPed:`}
              label="Share my card"
              className="btn-hot"
            />
            <DownloadCardButton data={cardData} className="btn-ghost" />
            <Link href={`/card/${profile.username}`} className="btn-ghost">
              👀 View public card
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/history" className="btn-ghost">
          📜 Full history
        </Link>
        <Link href="/analyze" className="btn-ghost">
          🔬 New analysis
        </Link>
        <Link href="/leaderboard" className="btn-ghost">
          🏆 Leaderboard
        </Link>
      </div>
    </div>
  );
}
