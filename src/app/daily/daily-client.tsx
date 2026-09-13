"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AchievementBanner } from "@/components/analysis-result";
import { AnalysisLoader } from "@/components/analysis-loader";
import { CategoryBars } from "@/components/category-bars";
import { ErrorPanel } from "@/components/error-panel";
import { ImprovementsList } from "@/components/improvements-list";
import { MemeReaction } from "@/components/meme-reaction";
import { RoastBox } from "@/components/roast-box";
import { ScoreReveal } from "@/components/score-reveal";
import { ShareButton } from "@/components/share-button";
import { TierBadge } from "@/components/tier-badge";
import { ANALYSIS_CATEGORIES } from "@/lib/categories";
import type { Achievement, LarpAnalysisResult, Profile } from "@/lib/types";
import { scoreColor } from "@/lib/ui";
import { timeAgo } from "@/lib/format";

interface DailyAttempt {
  id: string;
  larp_score: number;
  roast: string;
  response: string;
  created_at: string;
}

interface DailyPostResult {
  result: LarpAnalysisResult;
  rank: number;
  streak: number;
  profile: Profile;
  new_achievements: Achievement[];
}

export function DailyClient({
  challenge,
  attempts,
  best,
  rank,
  streak,
}: {
  challenge: { id: string; prompt: string };
  attempts: DailyAttempt[];
  best: number;
  rank: number | null;
  streak: number;
}) {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DailyPostResult | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (response.trim().length < 5) {
      setError("Write at least a few words. Even a bad answer is content, bestie.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response }),
      });
      const data = (await res.json()) as DailyPostResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Daily submission failed.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Daily submission failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <span className="chip">🎯 daily larp</span>
        <h1 className="title-display mt-4 text-5xl">
          TODAY&apos;S <span className="text-hot">CHALLENGE</span>
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="chip">🔥 {streak} day streak</span>
          {attempts.length > 0 && (
            <>
              <span className="chip">🏅 best today {Math.round(best)}</span>
              {rank && <span className="chip">📊 rank #{rank} today</span>}
            </>
          )}
        </div>
      </div>

      <div className="panel mb-6 border-hot/40 p-6 sm:p-8">
        <p className="font-mono text-xs tracking-widest text-hot uppercase">the challenge</p>
        <p className="title-display mt-2 text-2xl leading-snug sm:text-3xl">{challenge.prompt}</p>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorPanel message={error} />
        </div>
      )}

      {loading && <AnalysisLoader title="JUDGING YOUR ANSWER" />}

      {!loading && !result && (
        <form onSubmit={submit} className="panel flex flex-col gap-5 p-6">
          <div>
            <label className="label" htmlFor="daily-response">
              Your answer
            </label>
            <textarea
              id="daily-response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={7}
              maxLength={2000}
              placeholder="No pressure. But also: all the pressure."
              className="input resize-y"
            />
            <p className="mt-1.5 text-right font-mono text-[10px] text-muted">
              {response.length}/2000
            </p>
          </div>
          <button type="submit" className="btn-hot !py-3.5 text-base">
            🎯 Submit to the judge
          </button>
          <p className="font-mono text-[10px] text-muted">
            Multiple attempts allowed — your best score of the day is what counts on the board.
          </p>
        </form>
      )}

      {result && (
        <div className="animate-rise flex flex-col gap-6">
          <div className="panel flex flex-col items-center gap-4 p-6 sm:p-8">
            <span className="chip">🎯 daily larp</span>
            <ScoreReveal score={result.result.overall_score} label="DAILY LARP LEVEL" />
            <TierBadge score={result.result.overall_score} size="lg" />
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="chip">📊 rank #{result.rank} today</span>
              <span className="chip">🔥 {result.streak} day streak</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <ShareButton
                url={`/card/${result.profile.username}`}
                text={`Daily LARP: ${Math.round(result.result.overall_score)}/100 — "${challenge.prompt}" Get LARPed:`}
                label="Share today's damage"
                className="btn-hot"
              />
              <Link href="/dashboard" className="btn-ghost">
                🪪 My LARP
              </Link>
            </div>
          </div>

          <AchievementBanner achievements={result.new_achievements} />
          <RoastBox roast={result.result.roast} />
          <div className="grid gap-6 lg:grid-cols-2">
            <CategoryBars
              categories={result.result.categories}
              order={ANALYSIS_CATEGORIES.daily}
            />
            <MemeReaction score={result.result.overall_score} />
          </div>
          <ImprovementsList improvements={result.result.improvements} />
          <p className="text-center font-mono text-xs text-muted">
            New challenge tomorrow. The streak waits for no one. 🔥
          </p>
        </div>
      )}

      {attempts.length > 0 && (
        <div className="panel mt-8 p-5 sm:p-6">
          <h3 className="title-display mb-4 text-xl">TODAY&apos;S ATTEMPTS</h3>
          <ul className="flex flex-col gap-3">
            {attempts.map((attempt) => (
              <li key={attempt.id} className="panel-2 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="line-clamp-2 flex-1 text-sm text-muted">{attempt.response}</p>
                  <span
                    className="title-display shrink-0 text-2xl"
                    style={{ color: scoreColor(attempt.larp_score) }}
                  >
                    {Math.round(attempt.larp_score)}
                  </span>
                </div>
                <p className="mt-2 font-mono text-[10px] text-muted">
                  {timeAgo(attempt.created_at)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
