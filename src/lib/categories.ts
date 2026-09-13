import type { ScoreType } from "./types";

export const CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  buzzword: { label: "Buzzword LARP", emoji: "🧢" },
  fakeness: { label: "Fakeness", emoji: "🎭" },
  experience_inflation: { label: "Experience Inflation", emoji: "📈" },
  cringe: { label: "Cringe", emoji: "🤡" },
  aura: { label: "Aura", emoji: "⚡" },
  substance: { label: "Substance", emoji: "🛠️" },
  evidence: { label: "Evidence", emoji: "🔍" },
  activity: { label: "Commit Activity", emoji: "📊" },
  taste: { label: "Music Taste", emoji: "🎧" },
  pretentiousness: { label: "Pretentiousness", emoji: "🕶️" },
  personality_larp: { label: "Personality LARP", emoji: "🎭" },
  main_character: { label: "Main Character Energy", emoji: "🌟" },
  npc_energy: { label: "NPC Energy", emoji: "🗿" },
  emotional_damage: { label: "Emotional Damage", emoji: "💀" },
  evasion: { label: "Evasion", emoji: "🕳️" },
  consistency: { label: "Consistency", emoji: "🧩" },
};

export const ANALYSIS_CATEGORIES: Record<ScoreType, string[]> = {
  cv: ["buzzword", "fakeness", "experience_inflation", "cringe", "aura", "substance", "evidence"],
  github: ["buzzword", "fakeness", "cringe", "aura", "substance", "evidence", "activity"],
  music: ["taste", "pretentiousness", "personality_larp", "main_character", "npc_energy", "emotional_damage", "aura"],
  combined: ["buzzword", "fakeness", "cringe", "aura", "substance", "consistency"],
  daily: ["evasion", "buzzword", "cringe", "aura", "substance"],
  battle: ["buzzword", "fakeness", "cringe", "aura", "substance"],
  quiz: [],
};

export const ANALYSIS_META: Record<ScoreType, { label: string; emoji: string; blurb: string; href: string }> = {
  cv: {
    label: "CV Analysis",
    emoji: "📄",
    blurb: "Upload your resume. Let's see what HR sees vs what reality sees.",
    href: "/analyze/cv",
  },
  github: {
    label: "GitHub Analysis",
    emoji: "💻",
    blurb: "Your README describes a distributed AI platform. Your repo has 4 files.",
    href: "/analyze/github",
  },
  music: {
    label: "Music Analysis",
    emoji: "🎧",
    blurb: "Your playlist says underground. Your top artist says otherwise.",
    href: "/analyze/music",
  },
  combined: {
    label: "Combined Analysis",
    emoji: "🧬",
    blurb: "Cross-examine everything you've submitted. Find the contradictions.",
    href: "/analyze/combined",
  },
  quiz: {
    label: "LARP Quiz",
    emoji: "🧠",
    blurb: "Confidence vs correctness. The gap is where the LARP lives.",
    href: "/quiz",
  },
  daily: {
    label: "Daily LARP",
    emoji: "🎯",
    blurb: "One cursed challenge every day. Keep the streak alive.",
    href: "/daily",
  },
  battle: {
    label: "LARP Battle",
    emoji: "⚔️",
    blurb: "Two CVs enter. One LARPer leaves with an excuse.",
    href: "/battle",
  },
};

export function categoryLabel(key: string): string {
  return CATEGORY_META[key]?.label ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function categoryEmoji(key: string): string {
  return CATEGORY_META[key]?.emoji ?? "❓";
}
