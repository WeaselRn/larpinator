"use client";

import Link from "next/link";
import { AnalysisLoader } from "@/components/analysis-loader";
import { AnalysisResult } from "@/components/analysis-result";
import { ErrorPanel } from "@/components/error-panel";
import { useAnalysis } from "@/hooks/use-analysis";
import { ANALYSIS_META } from "@/lib/categories";
import type { AnalysisResponse, ScoreType } from "@/lib/types";
import { scoreColor } from "@/lib/ui";
import { timeAgo } from "@/lib/format";

export function CombinedClient({
  sources,
  dbError,
}: {
  sources: { type: ScoreType; score: number; created_at: string }[];
  dbError: string | null;
}) {
  const { loading, error, result, run, reset } = useAnalysis<AnalysisResponse>();
  const enough = sources.length >= 2;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <span className="chip">🧬 combined analysis</span>
        <h1 className="title-display mt-4 text-5xl">
          CROSS-<span className="text-hot">EXAMINE</span> YOURSELF
        </h1>
        <p className="mt-3 text-muted">
          We combine everything you&apos;ve submitted and hunt for contradictions. CV says
          full-stack engineer, GitHub says 2 commits this year, music says 93% Taylor Swift.
        </p>
      </div>

      {dbError && <ErrorPanel message={dbError} />}

      {!loading && !result && !dbError && (
        <div className="panel flex flex-col gap-5 p-6">
          <h2 className="title-display text-xl">YOUR EVIDENCE</h2>
          {sources.length === 0 ? (
            <p className="text-sm text-muted">
              Nothing submitted yet. Go get roasted first — at least 2 analyses are needed.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {sources.map((source) => (
                <li
                  key={source.type}
                  className="panel-2 flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span>{ANALYSIS_META[source.type].emoji}</span>
                    {ANALYSIS_META[source.type].label}
                    <span className="font-mono text-[10px] text-muted">
                      {timeAgo(source.created_at)}
                    </span>
                  </span>
                  <span
                    className="font-mono text-lg font-bold"
                    style={{ color: scoreColor(source.score) }}
                  >
                    {Math.round(source.score)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {sources.length === 1 && (
            <p className="font-mono text-xs text-amber">
              One more analysis needed before the cross-examination makes sense.
            </p>
          )}

          <button
            type="button"
            disabled={!enough}
            onClick={() =>
              run(() =>
                fetch("/api/analyze", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ type: "combined" }),
                }),
              )
            }
            className="btn-hot !py-3.5 text-base"
          >
            🧬 Find the contradictions
          </button>
          {!enough && (
            <p className="font-mono text-[10px] text-muted">
              Need at least 2 completed analyses.{" "}
              <Link href="/analyze" className="text-hot hover:underline">
                Collect evidence →
              </Link>
            </p>
          )}
        </div>
      )}

      {loading && <AnalysisLoader title="CROSS-EXAMINING YOU" />}

      {error && (
        <div className="flex flex-col gap-4">
          <ErrorPanel message={error} />
          <button type="button" onClick={reset} className="btn-ghost self-start">
            ← Back
          </button>
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-6">
          <AnalysisResult
            type="combined"
            result={result.result}
            profile={result.profile}
            newAchievements={result.newAchievements}
          />
          <button type="button" onClick={reset} className="btn-ghost self-start">
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}
