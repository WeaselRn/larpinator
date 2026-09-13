"use client";

import { useState } from "react";
import { reactionForScore } from "@/lib/reactions";

/**
 * Shows the score-appropriate meme. Falls back to the emoji placeholder when
 * the asset file isn't present yet (drop files into /public/assets/memes).
 */
export function MemeReaction({ score }: { score: number }) {
  const reaction = reactionForScore(score);
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-edge bg-panel">
      {failed ? (
        <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
          <span className="animate-float-slow text-6xl">{reaction.emoji}</span>
          <span className="font-mono text-xs tracking-widest text-muted uppercase">
            {reaction.label}
          </span>
          <span className="font-mono text-[10px] text-muted/50">
            meme slot: {reaction.meme.replace("/assets/memes/", "assets/memes/")}
          </span>
        </div>
      ) : (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={reaction.meme}
            alt={reaction.label}
            className="h-48 w-full object-cover sm:h-56"
            onError={() => setFailed(true)}
          />
          <span className="absolute bottom-2 left-3 font-mono text-[10px] tracking-widest text-white/70 uppercase">
            {reaction.label}
          </span>
        </div>
      )}
    </div>
  );
}
