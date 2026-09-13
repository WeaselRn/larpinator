import Link from "next/link";
import { MemeImage } from "@/components/meme-image";
import { ANALYSIS_META } from "@/lib/categories";
import { MEME_ASSETS } from "@/lib/reactions";

const ANALYZE_CARDS = (["cv", "github", "music", "combined"] as const).map((key) => ({
  key,
  ...ANALYSIS_META[key],
}));

const PLAY_LINKS = [
  { href: "/battle", emoji: "⚔️", label: "LARP Battle" },
  { href: "/quiz", emoji: "🧠", label: "LARP Quiz" },
  { href: "/daily", emoji: "🎯", label: "Daily LARP" },
];

export default function AnalyzeHubPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="chip">🔬 analysis hub</span>
          <h1 className="title-display mt-4 text-5xl sm:text-6xl">
            ANALYZE <span className="text-hot">SOMETHING</span>
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Every completed analysis feeds your overall LARP score, tier, profile, and leaderboard
            position. Choose your evidence.
          </p>
        </div>
        <MemeImage
          src={MEME_ASSETS.son}
          alt="Son..."
          className="h-36 w-auto shrink-0 rotate-2 rounded-2xl border border-edge sm:h-44"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {ANALYZE_CARDS.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="panel card-hover flex flex-col gap-3 p-6 hover:border-hot/60"
          >
            <span className="text-4xl">{card.emoji}</span>
            <span className="title-display text-2xl">{card.label}</span>
            <span className="text-sm text-muted">{card.blurb}</span>
            <span className="mt-auto font-mono text-xs text-hot">analyze →</span>
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="title-display mb-4 text-2xl text-muted">OR PLAY</h2>
        <div className="flex flex-wrap gap-3">
          {PLAY_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="btn-ghost !px-5 !py-3">
              {link.emoji} {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
