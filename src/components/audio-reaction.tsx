"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Plays a reaction sound. Silently disappears when the asset file is missing
 * (drop files into /public/assets/audio). Autoplay may be blocked by the
 * browser — that is handled gracefully.
 */
export function AudioReaction({
  src,
  autoPlay = false,
  label = "Play sound",
}: {
  src: string;
  autoPlay?: boolean;
  label?: string;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    if (autoPlay && ref.current) {
      ref.current.play().catch(() => {
        /* autoplay blocked — fine */
      });
    }
  }, [autoPlay, src]);

  if (!available) return null;

  return (
    <span className="inline-flex items-center gap-2">
      <audio ref={ref} src={src} preload="none" onError={() => setAvailable(false)} />
      <button
        type="button"
        className="btn-ghost !px-3 !py-1.5 text-xs"
        onClick={() => {
          ref.current?.play().catch(() => {});
        }}
      >
        🔊 {label}
      </button>
    </span>
  );
}
