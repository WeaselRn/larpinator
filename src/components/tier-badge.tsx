import { tierForScore } from "@/lib/tiers";

export function TierBadge({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md" | "lg";
}) {
  const tier = tierForScore(score);
  const sizes = {
    sm: "text-xs px-2.5 py-1",
    md: "text-sm px-3.5 py-1.5",
    lg: "text-lg px-5 py-2.5",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-edge bg-panel-2 font-mono font-bold tracking-widest uppercase ${sizes[size]}`}
    >
      <span>{tier.emoji}</span>
      <span className={tier.className}>{tier.name}</span>
    </span>
  );
}
