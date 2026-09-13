export function scoreColor(score: number): string {
  if (score <= 20) return "#3ee6ff";
  if (score <= 40) return "#c8f542";
  if (score <= 60) return "#ffc93c";
  if (score <= 75) return "#fb923c";
  if (score <= 90) return "#ff4545";
  return "#ff2d78";
}

export function scoreBarStyle(score: number): { width: string; background: string } {
  const clamped = Math.max(0, Math.min(100, score));
  const color = scoreColor(clamped);
  return {
    width: `${clamped}%`,
    background: `linear-gradient(90deg, ${color}55, ${color})`,
  };
}
