import { z } from "zod";
import { ANALYSIS_CATEGORIES } from "./categories";
import { clampScore, round1 } from "./scoring";
import type { Finding, LarpAnalysisResult, ScoreType } from "./types";

export const findingSchema = z.object({
  title: z.string().min(1).max(140),
  evidence: z.string().min(1).max(700),
  roast: z.string().min(1).max(500),
});

export const larpResultSchema = z.object({
  overall_score: z.number().min(0).max(100),
  categories: z.record(z.string(), z.number().min(0).max(100)),
  findings: z.array(findingSchema).nullish().transform((v) => v ?? []),
  roast: z.string().min(1).max(1500),
  improvements: z
    .array(z.string().min(1).max(400))
    .nullish()
    .transform((v) => v ?? []),
});

export const battleResultSchema = z.object({
  player_one: z.object({
    overall_score: z.number().min(0).max(100),
    categories: z.record(z.string(), z.number().min(0).max(100)),
    roast: z.string().min(1).max(800),
  }),
  player_two: z.object({
    overall_score: z.number().min(0).max(100),
    categories: z.record(z.string(), z.number().min(0).max(100)),
    roast: z.string().min(1).max(800),
  }),
  verdict: z.string().min(1).max(1000),
  findings: z.array(findingSchema).nullish().transform((v) => v ?? []),
});

export class AiValidationError extends Error {
  constructor(message = "The AI returned an invalid response. Nothing was saved — try again.") {
    super(message);
    this.name = "AiValidationError";
  }
}

function normalizeCategories(
  categories: Record<string, number>,
  allowed: string[],
  fallback: number,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const key of allowed) {
    const value = categories[key];
    result[key] = typeof value === "number" && Number.isFinite(value) ? round1(clampScore(value)) : round1(clampScore(fallback));
  }
  return result;
}

/** Validate + normalize a raw AI LARP result for a given analysis type. */
export function parseLarpResult(raw: unknown, type: ScoreType): LarpAnalysisResult {
  const parsed = larpResultSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AiValidationError();
  }

  const allowed = ANALYSIS_CATEGORIES[type];
  const overall = round1(clampScore(parsed.data.overall_score));

  return {
    overall_score: overall,
    categories: allowed.length > 0 ? normalizeCategories(parsed.data.categories, allowed, overall) : {},
    findings: parsed.data.findings.map((f) => ({
      title: f.title.trim(),
      evidence: f.evidence.trim(),
      roast: f.roast.trim(),
    })) as Finding[],
    roast: parsed.data.roast.trim(),
    improvements: parsed.data.improvements.map((s) => s.trim()),
  };
}

export interface BattlePlayerResult {
  overall_score: number;
  categories: Record<string, number>;
  roast: string;
}

export interface BattleResult {
  playerOne: BattlePlayerResult;
  playerTwo: BattlePlayerResult;
  verdict: string;
  findings: Finding[];
}

export function parseBattleResult(raw: unknown): BattleResult {
  const parsed = battleResultSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AiValidationError();
  }

  const allowed = ANALYSIS_CATEGORIES.battle;

  const mapPlayer = (p: { overall_score: number; categories: Record<string, number>; roast: string }): BattlePlayerResult => {
    const overall = round1(clampScore(p.overall_score));
    return {
      overall_score: overall,
      categories: normalizeCategories(p.categories, allowed, overall),
      roast: p.roast.trim(),
    };
  };

  return {
    playerOne: mapPlayer(parsed.data.player_one),
    playerTwo: mapPlayer(parsed.data.player_two),
    verdict: parsed.data.verdict.trim(),
    findings: parsed.data.findings.map((f) => ({
      title: f.title.trim(),
      evidence: f.evidence.trim(),
      roast: f.roast.trim(),
    })) as Finding[],
  };
}
