"use client";

import { useState } from "react";

/**
 * Decorative meme image that disappears silently when the asset file is
 * missing (assets live in public/assets/memes — see memes.md).
 */
export function MemeImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />
  );
}
