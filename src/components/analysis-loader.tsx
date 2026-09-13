"use client";

import { useEffect, useState } from "react";
import { LOADING_LINES, randomLoadingLine } from "@/lib/loading-lines";

export function AnalysisLoader({ title = "ANALYZING" }: { title?: string }) {
  const [line, setLine] = useState(LOADING_LINES[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLine((prev) => randomLoadingLine(prev));
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="panel animate-rise flex flex-col items-center gap-6 p-10 text-center">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span className="absolute h-full w-full animate-ping rounded-full bg-hot/20" />
        <span className="absolute h-16 w-16 animate-pulse rounded-full bg-grape/30" />
        <span className="animate-float text-4xl">🧢</span>
      </div>
      <div>
        <h3 className="title-display text-2xl">
          {title} <span className="animate-blink text-hot">▮</span>
        </h3>
        <p className="mt-2 min-h-[1.5rem] font-mono text-sm text-muted">{line}</p>
      </div>
      <div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-ink-2">
        <div className="animate-marquee h-full w-1/2 rounded-full bg-gradient-to-r from-hot to-grape" />
      </div>
    </div>
  );
}
