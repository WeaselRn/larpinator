export interface Tier {
  key: string;
  name: string;
  emoji: string;
  min: number;
  max: number;
  className: string;
}

export const TIERS: Tier[] = [
  { key: "npc", name: "NPC", emoji: "🧘", min: 0, max: 20, className: "text-cyan" },
  { key: "casual", name: "Casual LARPer", emoji: "🟢", min: 21, max: 40, className: "text-lime" },
  { key: "certified", name: "Certified LARPer", emoji: "🟡", min: 41, max: 60, className: "text-amber" },
  { key: "advanced", name: "Advanced LARPer", emoji: "🟠", min: 61, max: 75, className: "text-orange-400" },
  { key: "lord", name: "LARP LORD", emoji: "🔴", min: 76, max: 90, className: "text-blood" },
  { key: "overlord", name: "LARP OVERLORD", emoji: "☠️", min: 91, max: 99, className: "text-grape" },
  { key: "god", name: "LARP GOD", emoji: "👑", min: 100, max: 100, className: "text-hot glow-hot" },
];

export function tierForScore(score: number): Tier {
  const clamped = Math.max(0, Math.min(100, score));
  return TIERS.find((t) => clamped >= t.min && clamped <= t.max) ?? TIERS[0];
}

export function tierNameForScore(score: number): string {
  return tierForScore(score).name;
}
