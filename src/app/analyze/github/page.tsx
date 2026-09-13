"use client";

import { useState, type FormEvent } from "react";
import { AnalysisLoader } from "@/components/analysis-loader";
import { AnalysisResult } from "@/components/analysis-result";
import { ErrorPanel } from "@/components/error-panel";
import { useAnalysis } from "@/hooks/use-analysis";
import type { AnalysisResponse } from "@/lib/types";

export default function GithubAnalysisPage() {
  const [username, setUsername] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const { loading, error, result, run, reset } = useAnalysis<AnalysisResponse>();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    if (!username.trim()) {
      setLocalError("Enter a GitHub username or profile URL.");
      return;
    }
    run(() =>
      fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "github", username }),
      }),
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <span className="chip">💻 github analysis</span>
        <h1 className="title-display mt-4 text-5xl">
          AUDIT YOUR <span className="text-hot">GITHUB</span>
        </h1>
        <p className="mt-3 text-muted">
          We read your profile, your repos, your READMEs, and your commit history. The gap between
          the description and the code is where the LARP lives.
        </p>
      </div>

      {!loading && !result && (
        <form onSubmit={submit} className="panel flex flex-col gap-5 p-6">
          <div>
            <label className="label" htmlFor="github-username">
              GitHub username or profile URL
            </label>
            <input
              id="github-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. torvalds or https://github.com/torvalds"
              className="input font-mono"
              autoComplete="off"
            />
          </div>

          {localError && <ErrorPanel message={localError} />}

          <button type="submit" className="btn-hot !py-3.5 text-base">
            🔥 Roast my GitHub
          </button>
          <p className="font-mono text-[10px] text-muted">
            Public data only, collected server-side via the GitHub API. Deep-scans your top ~10
            original repos — not every fork of that tutorial you forgot about.
          </p>
        </form>
      )}

      {loading && <AnalysisLoader title="STALKING YOUR COMMITS" />}

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
            type="github"
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
