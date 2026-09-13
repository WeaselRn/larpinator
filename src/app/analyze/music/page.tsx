"use client";

import { useState, type FormEvent } from "react";
import { AnalysisLoader } from "@/components/analysis-loader";
import { AnalysisResult } from "@/components/analysis-result";
import { ErrorPanel } from "@/components/error-panel";
import { useAnalysis } from "@/hooks/use-analysis";
import type { AnalysisResponse } from "@/lib/types";

export default function MusicAnalysisPage() {
  const [username, setUsername] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const { loading, error, result, run, reset } = useAnalysis<AnalysisResponse>();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    if (!username.trim()) {
      setLocalError("Enter your Last.fm username.");
      return;
    }
    run(() =>
      fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "music", username }),
      }),
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <span className="chip">🎧 music analysis</span>
        <h1 className="title-display mt-4 text-5xl">
          EXPOSE YOUR <span className="text-hot">MUSIC TASTE</span>
        </h1>
        <p className="mt-3 text-muted">
          Your playlist says mysterious underground artist. Your top artist says Taylor Swift.
          We&apos;ll read your Last.fm scrobbles and find out which one is real.
        </p>
      </div>

      {!loading && !result && (
        <form onSubmit={submit} className="panel flex flex-col gap-5 p-6">
          <div>
            <label className="label" htmlFor="lastfm-username">
              Last.fm username or profile URL
            </label>
            <input
              id="lastfm-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. ruebin or https://www.last.fm/user/ruebin"
              className="input font-mono"
              autoComplete="off"
            />
          </div>

          {localError && <ErrorPanel message={localError} />}

          <button type="submit" className="btn-hot !py-3.5 text-base">
            🔥 Roast my music taste
          </button>
          <p className="font-mono text-[10px] text-muted">
            No Last.fm account? You&apos;re either 45 or a liar. Either way, no scrobbles, no
            roast.
          </p>
        </form>
      )}

      {loading && <AnalysisLoader title="JUDGING YOUR PLAYLIST" />}

      {error && (
        <div className="flex flex-col gap-4">
          <ErrorPanel message={error} />
          <button type="button" onClick={reset} className="btn-ghost self-start">
            ← Try again
          </button>
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-6">
          <AnalysisResult
            type="music"
            result={result.result}
            profile={result.profile}
            newAchievements={result.newAchievements}
          />
          <button type="button" onClick={reset} className="btn-ghost self-start">
            ← Analyze another profile
          </button>
        </div>
      )}
    </div>
  );
}
