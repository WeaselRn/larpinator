import Link from "next/link";
import { ANALYSIS_CATEGORIES, ANALYSIS_META } from "@/lib/categories";
import type { Achievement, LarpAnalysisResult, Profile, ScoreType } from "@/lib/types";
import { scoreColor } from "@/lib/ui";
import { tierForScore } from "@/lib/tiers";
import { AudioReaction } from "./audio-reaction";
import { CategoryBars } from "./category-bars";
import { FindingsList } from "./findings-list";
import { ImprovementsList } from "./improvements-list";
import { MemeReaction } from "./meme-reaction";
import { RoastBox } from "./roast-box";
import { ScoreReveal } from "./score-reveal";
import { ShareButton } from "./share-button";
import { TierBadge } from "./tier-badge";

export function AchievementBanner({ achievements }: { achievements: Achievement[] }) {
  if (achievements.length === 0) return null;
  return (
    <div className="animate-pop rounded-2xl border border-amber/50 bg-gradient-to-r from-amber/15 via-panel to-panel p-4 sm:p-5">
      <p className="font-mono text-xs tracking-widest text-amber uppercase">
        Achievement{achievements.length > 1 ? "s" : ""} unlocked
      </p>
      <div className="mt-2 flex flex-wrap gap-4">
        {achievements.map((achievement) => (
          <div key={achievement.id} className="flex items-center gap-2">
            <span className="text-2xl">{achievement.icon}</span>
            <div>
              <p className="text-sm font-bold">{achievement.name}</p>
              <p className="font-mono text-[10px] text-muted">{achievement.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileUpdateCard({ profile }: { profile: Profile }) {
  const color = scoreColor(profile.overall_larp_score);
  const tier = tierForScore(profile.overall_larp_score);
  return (
    <div className="panel flex items-center justify-between gap-4 p-5">
      <div>
        <p className="font-mono text-[10px] tracking-widest text-muted uppercase">
          Overall LARP updated
        </p>
        <p className="title-display text-3xl" style={{ color }}>
          {Math.round(profile.overall_larp_score)}
          <span className="text-base text-muted"> /100</span>
        </p>
        <p className="font-mono text-xs" style={{ color }}>
          {tier.emoji} {tier.name}
        </p>
      </div>
      <Link href="/dashboard" className="btn-ghost">
        🪪 View profile
      </Link>
    </div>
  );
}

export function AnalysisResult({
  type,
  result,
  profile,
  newAchievements = [],
}: {
  type: ScoreType;
  result: LarpAnalysisResult;
  profile: Profile;
  newAchievements?: Achievement[];
}) {
  const meta = ANALYSIS_META[type];

  return (
    <div className="animate-rise flex flex-col gap-6">
      <div className="panel relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-hot/10 blur-3xl" />
        <div className="relative flex flex-col items-center gap-5">
          <span className="chip">
            {meta.emoji} {meta.label}
          </span>
          <ScoreReveal score={result.overall_score} />
          <TierBadge score={result.overall_score} size="lg" />
          <div className="flex flex-wrap items-center justify-center gap-2">
            <AudioReaction label="Run it back" />
            <ShareButton
              url={`/card/${profile.username}`}
              text={`I scored ${Math.round(result.overall_score)}/100 on ${meta.label} on LARPINATOR. Get LARPed:`}
              label="Share receipt"
              className="btn-hot"
            />
          </div>
        </div>
      </div>

      <AchievementBanner achievements={newAchievements} />

      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryBars categories={result.categories} order={ANALYSIS_CATEGORIES[type]} />
        <div className="flex flex-col gap-6">
          <MemeReaction score={result.overall_score} />
          <ProfileUpdateCard profile={profile} />
        </div>
      </div>

      <RoastBox roast={result.roast} />
      <FindingsList findings={result.findings} />
      <ImprovementsList improvements={result.improvements} />
    </div>
  );
}
