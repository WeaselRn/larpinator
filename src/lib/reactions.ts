export interface Reaction {
  key: string;
  max: number;
  label: string;
  emoji: string;
  meme: string;
  audio: string;
}

/**
 * Meme/audio reaction mapping. Drop the real files into
 * public/assets/memes and public/assets/audio with these exact names —
 * components fall back to emoji/text if a file is missing.
 */
export const REACTIONS: Reaction[] = [
  {
    key: "wholesome",
    max: 20,
    label: "Suspiciously wholesome",
    emoji: "🧘",
    meme: "/assets/memes/wholesome.png",
    audio: "/assets/audio/wholesome.mp3",
  },
  {
    key: "suspicious",
    max: 50,
    label: "Suspicious...",
    emoji: "🤨",
    meme: "/assets/memes/suspicious.png",
    audio: "/assets/audio/suspicious.mp3",
  },
  {
    key: "concerned",
    max: 75,
    label: "We're concerned",
    emoji: "😬",
    meme: "/assets/memes/concerned.png",
    audio: "/assets/audio/concerned.mp3",
  },
  {
    key: "brutal",
    max: 90,
    label: "Brutal",
    emoji: "💀",
    meme: "/assets/memes/brutal.png",
    audio: "/assets/audio/brutal.mp3",
  },
  {
    key: "catastrophic",
    max: 100,
    label: "Catastrophic LARP",
    emoji: "☢️",
    meme: "/assets/memes/catastrophic.png",
    audio: "/assets/audio/catastrophic.mp3",
  },
];

export function reactionForScore(score: number): Reaction {
  return REACTIONS.find((r) => score <= r.max) ?? REACTIONS[REACTIONS.length - 1];
}

export const AUDIO_CUES = {
  loading: "/assets/audio/loading.mp3",
  reveal: "/assets/audio/reveal.mp3",
  tier: "/assets/audio/tier.mp3",
  battle: "/assets/audio/battle.mp3",
} as const;
