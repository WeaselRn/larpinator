import type { ScoreType } from "./types";

export const CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  buzzword: { label: "Buzzword Farming", emoji: "🧢" },
  fakeness: { label: "Delulu", emoji: "🎭" },
  experience_inflation: { label: "Resume Bloat", emoji: "📈" },
  cringe: { label: "The Ick", emoji: "🤡" },
  aura: { label: "Aura", emoji: "⚡" },
  substance: { label: "Substance Check", emoji: "🛠️" },
  evidence: { label: "Proof?", emoji: "🔍" },
  activity: { label: "Git Grind", emoji: "📊" },
  taste: { label: "Taste Check", emoji: "🎧" },
  pretentiousness: { label: "Pretentious Core", emoji: "🕶️" },
  personality_larp: { label: "Personality Hire", emoji: "🎭" },
  main_character: { label: "Main Character", emoji: "🌟" },
  npc_energy: { label: "NPC Vibes", emoji: "🗿" },
  emotional_damage: { label: "Emotional Damage", emoji: "💀" },
  evasion: { label: "Rule Dodging", emoji: "🕳️" },
  consistency: { label: "Vibe Consistency", emoji: "🧩" },
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
    label: "CV Vibe Check",
    emoji: "📄",
    blurb: "Upload your resume. Let's see if it passes the vibe check or if it's giving main character energy.",
    href: "/analyze/cv",
  },
  github: {
    label: "GitHub Aura Audit",
    emoji: "💻",
    blurb: "Your README says distributed AI platform. Your repo has 4 files. The gap is giving delulu.",
    href: "/analyze/github",
  },
  music: {
    label: "Music Taste Exposed",
    emoji: "🎧",
    blurb: "Your playlist says underground. Your top artist says otherwise. No cap, we're reading your scrobbles.",
    href: "/analyze/music",
  },
  combined: {
    label: "Cross-Vibe Audit",
    emoji: "🧬",
    blurb: "We combine everything you've submitted and hunt for contradictions. The lore must line up.",
    href: "/analyze/combined",
  },
  quiz: {
    label: "LARP Quiz",
    emoji: "🧠",
    blurb: "Confidence vs correctness. The gap is where the LARP lives. Fr fr.",
    href: "/quiz",
  },
  daily: {
    label: "Daily LARP",
    emoji: "🎯",
    blurb: "One cursed challenge every day. Keep the streak alive or touch grass.",
    href: "/daily",
  },
  battle: {
    label: "LARP Battle",
    emoji: "⚔️",
    blurb: "Two CVs enter. The least delulu one leaves with the crown.",
    href: "/battle",
  },
};

export function categoryLabel(key: string): string {
  return CATEGORY_META[key]?.label ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function categoryEmoji(key: string): string {
  return CATEGORY_META[key]?.emoji ?? "❓";
}
