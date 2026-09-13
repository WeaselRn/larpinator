"use client";

import { useEffect, useRef, useState } from "react";
import { scoreColor } from "@/lib/ui";
import { useAudioManager } from "./audio-manager";

export function ScoreReveal({ score, label = "LARP LEVEL" }: { score: number; label?: string }) {
  const [display, setDisplay] = useState(0);
  const frame = useRef<number | null>(null);
  const { playRandom } = useAudioManager();

  useEffect(() => {
    playRandom({ force: true });
  }, [playRandom]);

  useEffect(() => {
    const target = Math.round(score);
    const duration = 1200;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      }
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [score]);

  const color = scoreColor(score);

  return (
    <div className="flex flex-col items-center">
      <span className="font-mono text-xs tracking-[0.3em] text-muted uppercase">{label}</span>
      <div className="animate-pop flex items-end gap-1" key={score}>
        <span
          className="title-display text-[88px] leading-none sm:text-[120px]"
          style={{ color, textShadow: `0 0 42px ${color}88` }}
        >
          {display}
        </span>
        <span className="title-display mb-2 text-2xl text-muted sm:mb-3 sm:text-3xl">/100</span>
      </div>
    </div>
  );
}
