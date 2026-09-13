"use client";

import { useEffect } from "react";
import { useAudioManager } from "./audio-manager";

/** Manual replay button for the score-reveal sound. */
export function AudioReaction({
  label = "Run it back",
  autoPlay = false,
}: {
  label?: string;
  autoPlay?: boolean;
}) {
  const { playRandom } = useAudioManager();

  useEffect(() => {
    if (autoPlay) {
      playRandom({ force: true });
    }
  }, [autoPlay, playRandom]);

  return (
    <button
      type="button"
      className="btn-ghost !px-3 !py-1.5 text-xs"
      onClick={() => playRandom({ force: true })}
    >
      🔊 {label}
    </button>
  );
}
