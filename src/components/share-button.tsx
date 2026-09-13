"use client";

import { useState } from "react";

export function ShareButton({
  url,
  text,
  label = "Share",
  className = "btn-ghost",
}: {
  url: string;
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const absolute = url.startsWith("http") ? url : `${window.location.origin}${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "LARPINATOR", text, url: absolute });
        return;
      } catch {
        /* user cancelled or unsupported — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${absolute}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <button type="button" onClick={share} className={className}>
      {copied ? "✅ Copied!" : `🔗 ${label}`}
    </button>
  );
}
