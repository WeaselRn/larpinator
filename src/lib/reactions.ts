/** Meme assets in public/assets/memes (see memes.md for placement notes). */
export const MEME_ASSETS = {
  godOfLarp: "/assets/memes/god-of-larp.gif",
  larpGod: "/assets/memes/larpgod.webp",
  absoluteLarp: "/assets/memes/absolutelarp.jpg",
  lookThere: "/assets/memes/look%20there.jpg",
  lookLarp: "/assets/memes/looklarp.gif",
  lowCortisol: "/assets/memes/low%20cortisol.gif",
  noLimit: "/assets/memes/nolimit.gif",
  son: "/assets/memes/son.webp",
  whyLarp: "/assets/memes/whylarp.webp",
  thirtyYears: "/assets/memes/30years.webp",
} as const;

export interface ScoreMeme {
  min: number;
  label: string;
  emoji: string;
  src: string;
}

/**
 * Score-reaction memes (memes.md):
 *  - below 40        → low cortisol
 *  - 40–80           → son
 *  - above 80        → larpgod
 *  - above 90        → god of larp
 */
export const SCORE_MEMES: ScoreMeme[] = [
  { min: 91, label: "GOD OF LARP", emoji: "☢️", src: MEME_ASSETS.godOfLarp },
  { min: 81, label: "Certified LARP GOD", emoji: "👑", src: MEME_ASSETS.larpGod },
  { min: 40, label: "Son…", emoji: "🤨", src: MEME_ASSETS.son },
  { min: 0, label: "Low cortisol detected", emoji: "🧘", src: MEME_ASSETS.lowCortisol },
];

export function reactionForScore(score: number): ScoreMeme {
  return SCORE_MEMES.find((meme) => score >= meme.min) ?? SCORE_MEMES[SCORE_MEMES.length - 1];
}

/**
 * Sound pool — one of these plays randomly while browsing, when an activity
 * starts, and when a score is revealed. Managed by AudioManagerProvider.
 */
export const AUDIO_TRACKS = ["/assets/audio/faaah.mp3", "/assets/audio/tuco-get-out.mp3"];
