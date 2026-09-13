import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { MemeImage } from "@/components/meme-image";
import { TierBadge } from "@/components/tier-badge";
import { getLeaderboard, type LeaderboardRow } from "@/lib/leaderboard";
import { MEME_ASSETS } from "@/lib/reactions";
import { scoreColor } from "@/lib/ui";

const QUICK_ACTIONS = [
  {
    href: "/analyze/cv",
    emoji: "📄",
    title: "Analyze CV",
    blurb: "Let's see what HR sees vs what reality sees.",
  },
  {
    href: "/analyze/github",
    emoji: "💻",
    title: "Analyze GitHub",
    blurb: "Your README says distributed AI platform. Your repo says 4 files.",
  },
  {
    href: "/analyze/music",
    emoji: "🎧",
    title: "Analyze Music",
    blurb: "Your playlist says underground. Your top artist says otherwise.",
  },
  {
    href: "/battle",
    emoji: "⚔️",
    title: "LARP Battle",
    blurb: "Two CVs enter. One leaves with excuses.",
  },
  {
    href: "/quiz",
    emoji: "🧠",
    title: "LARP Quiz",
    blurb: "Confidence vs correctness. Watch the gap.",
  },
  {
    href: "/daily",
    emoji: "🎯",
    title: "Daily LARP",
    blurb: "One cursed challenge per day. Keep the streak alive.",
  },
];

const STEPS = [
  { emoji: "📥", title: "Submit", blurb: "CV, GitHub, music — pick your poison." },
  { emoji: "🔥", title: "Get roasted", blurb: "The AI finds the gap between claims and evidence." },
  { emoji: "📊", title: "Get scored", blurb: "Categories, tier, and an overall LARP score." },
  { emoji: "👑", title: "Become a legend", blurb: "Climb the leaderboard. Earn achievements. Share the card." },
];

const TICKER = [
  "BUZZWORDS",
  "CRINGE",
  "AURA",
  "FAKENESS",
  "MAIN CHARACTER ENERGY",
  "EXPERIENCE INFLATION",
  "EMOTIONAL DAMAGE",
  "NPC ENERGY",
];

export default async function HomePage() {
  let featured: LeaderboardRow[] = [];
  try {
    featured = await getLeaderboard("global", 5);
  } catch {
    featured = [];
  }

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section className="relative flex flex-col items-center py-16 text-center sm:py-24">
        <span className="chip animate-rise">🕵️ the internet&apos;s bullshit detector</span>
        <h1 className="title-display animate-rise mt-6 text-6xl leading-[0.95] sm:text-8xl md:text-9xl">
          LARP
          <span className="text-hot glow-hot">INATOR</span>
        </h1>
        <p className="animate-rise mt-5 max-w-xl text-lg text-muted sm:text-xl">
          How hard are you LARPing? Submit your CV, your GitHub, your music taste. Get roasted,
          scored, and ranked. Then do it again.
        </p>
        <div className="animate-rise mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/analyze" className="btn-hot !px-7 !py-3.5 text-base">
            GET LARPed →
          </Link>
          <Link href="/leaderboard" className="btn-ghost !px-7 !py-3.5 text-base">
            🏆 View Leaderboard
          </Link>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
          {["🧢", "🎭", "📈", "🤡", "⚡", "🛠️", "🔍", "💀"].map((emoji, i) => (
            <span
              key={i}
              className="animate-float text-3xl sm:text-4xl"
              style={{ animationDelay: `${i * 0.35}s` }}
            >
              {emoji}
            </span>
          ))}
        </div>

        <MemeImage
          src={MEME_ASSETS.noLimit}
          alt="No limit"
          className="mt-12 w-full max-w-4xl rounded-3xl border border-edge shadow-2xl shadow-hot/10"
        />
      </section>

      {/* Ticker */}
      <div className="relative overflow-hidden rounded-2xl border border-edge bg-panel py-3">
        <div className="animate-marquee flex w-max gap-8">
          {[...TICKER, ...TICKER].map((item, i) => (
            <span key={i} className="font-mono text-sm tracking-[0.25em] text-muted">
              {item} <span className="text-hot">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <section className="mt-16">
        <h2 className="title-display mb-6 text-3xl sm:text-4xl">
          PICK YOUR <span className="text-hot">POISON</span>
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="panel card-hover flex flex-col gap-2 p-5 hover:border-hot/60"
            >
              <span className="text-3xl">{action.emoji}</span>
              <span className="title-display text-xl">{action.title}</span>
              <span className="text-sm text-muted">{action.blurb}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured LARPers */}
      <section className="mt-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="title-display text-3xl sm:text-4xl">
            FEATURED <span className="text-grape">LARPers</span>
          </h2>
          <Link href="/leaderboard" className="font-mono text-xs text-muted hover:text-hot">
            full leaderboard →
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="panel flex flex-col items-center gap-2 p-10 text-center">
            <span className="text-4xl">🫥</span>
            <p className="font-bold">The leaderboard is suspiciously empty.</p>
            <p className="text-sm text-muted">
              Be the first LARPer. Or the least. Someone has to set the bar.
            </p>
            <Link href="/analyze" className="btn-hot mt-3">
              Claim #1
            </Link>
          </div>
        ) : (
          <div className="panel divide-y divide-edge/60">
            {featured.map((row) => (
              <div key={row.id} className="flex items-center gap-4 p-4">
                <span className="title-display w-10 text-center text-xl text-muted">
                  #{row.rank}
                </span>
                {row.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.avatar_url}
                    alt={row.username}
                    className="h-10 w-10 rounded-xl object-cover ring-2 ring-edge"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-panel-2">
                    🧢
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{row.username}</p>
                  <TierBadge score={row.value} size="sm" />
                </div>
                <span
                  className="title-display text-3xl"
                  style={{ color: scoreColor(row.value) }}
                >
                  {Math.round(row.value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="mt-16">
        <h2 className="title-display mb-6 text-3xl sm:text-4xl">
          HOW IT <span className="text-lime">WORKS</span>
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={step.title} className="panel relative p-5">
              <span className="absolute top-4 right-4 font-mono text-xs text-muted">
                0{i + 1}
              </span>
              <span className="text-3xl">{step.emoji}</span>
              <h3 className="title-display mt-2 text-lg">{step.title}</h3>
              <p className="mt-1 text-sm text-muted">{step.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="panel mt-16 mb-4 flex flex-col items-center gap-4 p-10 text-center">
        <h2 className="title-display text-3xl sm:text-5xl">
          EVERY ANALYSIS FEEDS YOUR <span className="text-hot">LARP PROFILE</span>
        </h2>
        <p className="max-w-2xl text-muted">
          CV, GitHub, music, quiz, daily challenges, battles — all of it rolls into one score, one
          tier, one leaderboard. Higher score = more LARP. That&apos;s the whole point.
        </p>
        <Show when="signed-out">
          <Link href="/sign-up" className="btn-hot !px-7 !py-3.5 text-base">
            Start LARPing →
          </Link>
        </Show>
        <Show when="signed-in">
          <Link href="/analyze" className="btn-hot !px-7 !py-3.5 text-base">
            Analyze something →
          </Link>
        </Show>
      </section>
    </div>
  );
}
