export interface Reaction {
  key: string;
  max: number;
  label: string;
  emoji: string;
  meme: string;
}

/**
 * Meme reaction mapping. Drop the real files into public/assets/memes with
 * these exact names — components fall back to emoji/text if a file is missing.
 */
export const REACTIONS: Reaction[] = [
  {
    key: "wholesome",
    max: 20,
    label: "Suspiciously wholesome",
    emoji: "🧘",
    meme: "/assets/memes/wholesome.png",
  },
  {
    key: "suspicious",
    max: 50,
    label: "Suspicious...",
    emoji: "🤨",
    meme: "/assets/memes/suspicious.png",
  },
  {
    key: "concerned",
    max: 75,
    label: "We're concerned",
    emoji: "😬",
    meme: "/assets/memes/concerned.png",
  },
  {
    key: "brutal",
    max: 90,
    label: "Brutal",
    emoji: "💀",
    meme: "/assets/memes/brutal.png",
  },
  {
    key: "catastrophic",
    max: 100,
    label: "Catastrophic LARP",
    emoji: "☢️",
    meme: "/assets/memes/catastrophic.png",
  },
];

export function reactionForScore(score: number): Reaction {
  return REACTIONS.find((r) => score <= r.max) ?? REACTIONS[REACTIONS.length - 1];
}

/**
 * Sound pool — one of these plays randomly while browsing, when an activity
 * starts, and when a score is revealed. Managed by AudioManagerProvider.
 */
export const AUDIO_TRACKS = ["/assets/audio/faaah.mp3", "/assets/audio/tuco-get-out.mp3"];
