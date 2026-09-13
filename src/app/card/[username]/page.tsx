import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DbNotice } from "@/components/db-notice";
import { DownloadCardButton, LarpCard } from "@/components/larp-card";
import { ShareButton } from "@/components/share-button";
import { TierBadge } from "@/components/tier-badge";
import { getUserAchievements } from "@/lib/achievements";
import { categoryEmoji, categoryLabel } from "@/lib/categories";
import { formatDate } from "@/lib/format";
import { getProfileByUsername } from "@/lib/profile";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  try {
    const profile = await getProfileByUsername(username);
    if (!profile) return { title: "LARP card not found — LARPINATOR" };
    const score = Math.round(profile.overall_larp_score);
    return {
      title: `${profile.username} — ${score}/100 ${profile.larp_tier} — LARPINATOR`,
      description: `${profile.username} is a certified ${profile.larp_tier} (${score}/100) on LARPINATOR, the internet's bullshit detector.`,
    };
  } catch {
    return { title: "LARPINATOR" };
  }
}

export default async function CardPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  let profile;
  let achievements: Awaited<ReturnType<typeof getUserAchievements>> = [];
  let dbError: string | null = null;

  try {
    profile = await getProfileByUsername(username);
    if (profile) {
      achievements = await getUserAchievements(profile.id);
    }
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Failed to load card.";
  }

  if (dbError) return <DbNotice message={dbError} />;
  if (!profile) notFound();

  const statEntries = Object.entries(profile.category_scores).slice(0, 4);
  const stats = statEntries.map(([key, value]) => ({ label: key.replace(/_/g, " "), value }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 text-center">
        <span className="chip">🪪 public larp card</span>
        <h1 className="title-display mt-4 text-4xl sm:text-5xl">
          {profile.username.toUpperCase()} IS A <span className="text-hot">LARP CARD</span>
        </h1>
        <p className="mt-2 font-mono text-xs text-muted">
          member since {formatDate(profile.created_at)}
        </p>
      </div>

      <LarpCard
        data={{
          username: profile.username,
          avatarUrl: profile.avatar_url,
          score: profile.overall_larp_score,
          tier: profile.larp_tier,
          stats,
          achievement: achievements[0]
            ? { icon: achievements[0].icon, name: achievements[0].name }
            : null,
          xp: profile.xp,
        }}
      />

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <ShareButton
          url={`/card/${profile.username}`}
          text={`${profile.username} is a ${profile.larp_tier} (${Math.round(profile.overall_larp_score)}/100) on LARPINATOR. Get LARPed:`}
          label="Share this card"
          className="btn-hot"
        />
        <DownloadCardButton
          data={{
            username: profile.username,
            avatarUrl: profile.avatar_url,
            score: profile.overall_larp_score,
            tier: profile.larp_tier,
            stats,
            achievement: achievements[0]
              ? { icon: achievements[0].icon, name: achievements[0].name }
              : null,
            xp: profile.xp,
          }}
          className="btn-ghost"
        />
        <Link href="/analyze" className="btn-ghost">
          🔥 Get LARPed too
        </Link>
      </div>

      <div className="panel mt-8 p-5 sm:p-6">
        <h2 className="title-display mb-4 text-xl">KEY STATS</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="panel-2 p-3 text-center">
            <p className="title-display text-3xl">{Math.round(profile.overall_larp_score)}</p>
            <p className="font-mono text-[10px] tracking-wider text-muted uppercase">larp score</p>
          </div>
          <div className="panel-2 p-3 text-center">
            <p className="title-display text-3xl">{profile.xp}</p>
            <p className="font-mono text-[10px] tracking-wider text-muted uppercase">xp</p>
          </div>
          <div className="panel-2 p-3 text-center">
            <p className="title-display text-3xl">{profile.streak}</p>
            <p className="font-mono text-[10px] tracking-wider text-muted uppercase">streak</p>
          </div>
          <div className="panel-2 flex flex-col items-center justify-center gap-1 p-3 text-center">
            <TierBadge score={profile.overall_larp_score} size="sm" />
            <p className="font-mono text-[10px] tracking-wider text-muted uppercase">tier</p>
          </div>
        </div>
      </div>

      {achievements.length > 0 && (
        <div className="panel mt-6 p-5 sm:p-6">
          <h2 className="title-display mb-4 text-xl">ACHIEVEMENTS</h2>
          <div className="flex flex-wrap gap-3">
            {achievements.map((achievement) => (
              <span
                key={achievement.id}
                className="panel-2 flex items-center gap-2 px-3 py-2 text-sm"
              >
                <span className="text-lg">{achievement.icon}</span>
                {achievement.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {statEntries.length > 0 && (
        <p className="mt-6 text-center font-mono text-[10px] text-muted">
          {statEntries
            .map(([key, value]) => `${categoryEmoji(key)} ${categoryLabel(key)} ${Math.round(value)}`)
            .join(" · ")}
        </p>
      )}
    </div>
  );
}
