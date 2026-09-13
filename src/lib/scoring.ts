import type { ScoreType } from "./types";

/**
 * Central scoring configuration.
 * Only types listed here feed the user's overall LARP score.
 * Weights are normalized over the types the user has actually completed.
 */
export const SCORE_WEIGHTS: Partial<Record<ScoreType, number>> = {
  cv: 25,
  github: 25,
  music: 15,
  quiz: 10,
  daily: 10,
  battle: 15,
};

export const XP_REWARDS: Partial<Record<ScoreType, number>> = {
  cv: 100,
  github: 100,
  music: 80,
  combined: 60,
  quiz: 50,
  daily: 60,
  battle: 70,
};

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Overall LARP score = weighted average of the latest score per completed
 * analysis type, normalized over the weights that are actually present.
 */
export function computeOverallScore(
  latestScores: Partial<Record<ScoreType, number | null | undefined>>,
): { overall: number; usedTypes: ScoreType[]; usedWeight: number } {
  let weighted = 0;
  let totalWeight = 0;
  const usedTypes: ScoreType[] = [];

  for (const [type, weight] of Object.entries(SCORE_WEIGHTS) as [ScoreType, number][]) {
    const score = latestScores[type];
    if (typeof score === "number" && Number.isFinite(score)) {
      weighted += clampScore(score) * weight;
      totalWeight += weight;
      usedTypes.push(type);
    }
  }

  if (totalWeight === 0) {
    return { overall: 0, usedTypes, usedWeight: 0 };
  }

  return { overall: round1(weighted / totalWeight), usedTypes, usedWeight: totalWeight };
}

/**
 * Category scores cached on the profile: weighted average per category across
 * the latest analysis of each type (weighted by the same central weights).
 */
export function computeCategoryScores(
  latest: Partial<Record<ScoreType, { score: number; category_scores: Record<string, number> | null }>>,
): Record<string, number> {
  const result: Record<string, number> = {};
  const categories = new Set<string>();

  for (const entry of Object.values(latest)) {
    if (!entry?.category_scores) continue;
    for (const key of Object.keys(entry.category_scores)) {
      categories.add(key);
    }
  }

  for (const key of categories) {
    let weighted = 0;
    let totalWeight = 0;
    for (const [type, weight] of Object.entries(SCORE_WEIGHTS) as [ScoreType, number][]) {
      const entry = latest[type];
      const value = entry?.category_scores?.[key];
      if (typeof value === "number" && Number.isFinite(value)) {
        weighted += clampScore(value) * weight;
        totalWeight += weight;
      }
    }
    if (totalWeight > 0) {
      result[key] = round1(weighted / totalWeight);
    }
  }

  return result;
}

export function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}
