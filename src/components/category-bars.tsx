import { categoryEmoji, categoryLabel } from "@/lib/categories";
import { MEME_ASSETS } from "@/lib/reactions";
import { scoreBarStyle, scoreColor } from "@/lib/ui";
import { MemeImage } from "./meme-image";

export function CategoryBars({
  categories,
  order,
}: {
  categories: Record<string, number>;
  order?: string[];
}) {
  const keys = order ?? Object.keys(categories);

  return (
    <div className="panel p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="title-display text-xl">THE BREAKDOWN</h3>
          <span className="font-mono text-[10px] tracking-widest text-muted uppercase">
            higher = more larp
          </span>
        </div>
        <MemeImage
          src={MEME_ASSETS.whyLarp}
          alt="Why larp?"
          className="h-20 w-auto shrink-0 rounded-xl border border-edge"
        />
      </div>
      <div className="flex flex-col gap-4">
        {keys.map((key) => {
          const value = categories[key];
          if (typeof value !== "number") return null;
          const color = scoreColor(value);
          return (
            <div key={key}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-semibold">
                  {categoryEmoji(key)} {categoryLabel(key)}
                </span>
                <span className="font-mono font-bold" style={{ color }}>
                  {Math.round(value)}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-ink-2">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={scoreBarStyle(value)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
