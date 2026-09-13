import { MEME_ASSETS } from "@/lib/reactions";
import { MemeImage } from "./meme-image";

export function ImprovementsList({ improvements }: { improvements: string[] }) {
  if (improvements.length === 0) return null;

  return (
    <div className="panel p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="title-display text-xl">LEVEL-UP GUIDE</h3>
          <p className="font-mono text-xs text-muted">
            How to LARP harder — and how to actually get better.
          </p>
        </div>
        <MemeImage
          src={MEME_ASSETS.thirtyYears}
          alt="30 years of larp"
          className="h-20 w-auto shrink-0 rounded-xl border border-edge"
        />
      </div>
      <ul className="flex flex-col gap-3">
        {improvements.map((item, i) => (
          <li key={i} className="panel-2 flex gap-3 p-3.5 text-sm leading-relaxed">
            <span className="mt-0.5">{item.startsWith("🪄") ? "🪄" : item.startsWith("🧠") ? "🧠" : "•"}</span>
            <span>{item.replace(/^🪄\s*LARP harder:\s*/i, "").replace(/^🧠\s*Actually improve:\s*/i, "")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
