"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AchievementBanner } from "@/components/analysis-result";
import { AnalysisLoader } from "@/components/analysis-loader";
import { ErrorPanel } from "@/components/error-panel";
import { RoastBox } from "@/components/roast-box";
import { ScoreReveal } from "@/components/score-reveal";
import { ShareButton } from "@/components/share-button";
import { TierBadge } from "@/components/tier-badge";
import type { Achievement, Profile } from "@/lib/types";
import { scoreColor } from "@/lib/ui";

const CATEGORIES = [
  "mixed",
  "Tech",
  "Internet culture",
  "Science",
  "Gaming",
  "Music",
  "Indian culture",
  "Developer lore",
  "Random obscure topics",
  "Brainrot",
  "Completely useless knowledge",
];

interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
  difficulty: string | null;
}

interface PerQuestion {
  questionId: string;
  question: string;
  options: string[];
  correctIndex: number;
  selectedIndex: number;
  correct: boolean;
  confidence: number;
}

interface QuizResponse {
  quiz_score: number;
  larp_score: number;
  correct: number;
  total: number;
  avg_confidence: number;
  best_streak: number;
  roast: string;
  improvements: string[];
  per_question: PerQuestion[];
  profile: Profile;
  new_achievements: Achievement[];
}

type Phase = "setup" | "loading" | "playing" | "submitting" | "results";

/** Impure time source kept at module scope (event handlers call this, not render). */
const timestamp = () => Date.now();

export default function QuizPage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [category, setCategory] = useState("mixed");
  const [mode, setMode] = useState<"random" | "daily">("random");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confidence, setConfidence] = useState(60);
  const [answers, setAnswers] = useState<
    { questionId: string; selectedIndex: number; confidence: number; timeMs: number }[]
  >([]);
  const [result, setResult] = useState<QuizResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const questionStart = useRef<number>(0);

  useEffect(() => {
    if (phase !== "playing") return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const current = questions[index];
  const progress = useMemo(
    () => (questions.length > 0 ? ((index + 1) / questions.length) * 100 : 0),
    [index, questions.length],
  );

  const start = async () => {
    setPhase("loading");
    setError(null);
    setResult(null);
    setAnswers([]);
    setIndex(0);
    setSelected(null);
    setConfidence(60);
    setElapsed(0);
    try {
      const response = await fetch(`/api/quiz?category=${encodeURIComponent(category)}&mode=${mode}`);
      const data = (await response.json()) as { questions?: Question[]; error?: string };
      if (!response.ok || !data.questions) {
        throw new Error(data.error ?? "Could not load questions.");
      }
      setQuestions(data.questions);
      questionStart.current = timestamp();
      setPhase("playing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load questions.");
      setPhase("setup");
    }
  };

  const lockIn = () => {
    if (selected === null || !current) return;
    const nextAnswers = [
      ...answers,
      {
        questionId: current.id,
        selectedIndex: selected,
        confidence,
        timeMs: timestamp() - questionStart.current,
      },
    ];
    setAnswers(nextAnswers);

    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setSelected(null);
      setConfidence(60);
      questionStart.current = timestamp();
    } else {
      void submit(nextAnswers);
    }
  };

  const submit = async (
    finalAnswers: { questionId: string; selectedIndex: number; confidence: number; timeMs: number }[],
  ) => {
    setPhase("submitting");
    setError(null);
    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, mode, answers: finalAnswers }),
      });
      const data = (await response.json()) as QuizResponse & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Quiz submission failed.");
      setResult(data);
      setPhase("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Quiz submission failed.");
      setPhase("setup");
    }
  };

  const restart = () => {
    setPhase("setup");
    setResult(null);
    setQuestions([]);
    setAnswers([]);
    setIndex(0);
  };

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <span className="chip">🧠 larp quiz</span>
        <h1 className="title-display mt-4 text-5xl">
          CONFIDENCE <span className="text-hot">vs</span> CORRECTNESS
        </h1>
        <p className="mt-3 text-muted">
          The quiz doesn&apos;t just measure what you know — it measures how sure you were. The gap
          is where the LARP lives.
        </p>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorPanel message={error} />
        </div>
      )}

      {phase === "setup" && (
        <div className="panel flex flex-col gap-5 p-6">
          <div>
            <label className="label" htmlFor="quiz-category">
              Category
            </label>
            <select
              id="quiz-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === "mixed" ? "🎲 Mixed (all categories)" : c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="label">Question set</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMode("random")}
                className={mode === "random" ? "btn-hot" : "btn-ghost"}
              >
                🎲 Random 10
              </button>
              <button
                type="button"
                onClick={() => setMode("daily")}
                className={mode === "daily" ? "btn-hot" : "btn-ghost"}
              >
                📅 Daily set (same for everyone)
              </button>
            </div>
          </div>

          <button type="button" onClick={start} className="btn-hot !py-3.5 text-base">
            🧠 Start quiz
          </button>
          <p className="font-mono text-[10px] text-muted">
            10 questions. Pick an answer, set your confidence, lock it in. No takebacks.
          </p>
        </div>
      )}

      {phase === "loading" && <AnalysisLoader title="SHUFFLING QUESTIONS" />}
      {phase === "submitting" && <AnalysisLoader title="GRADING YOUR CONFIDENCE" />}

      {phase === "playing" && current && (
        <div className="panel flex flex-col gap-5 p-6">
          <div className="flex items-center justify-between font-mono text-xs text-muted">
            <span>
              Q{index + 1}/{questions.length} · {current.category}
              {current.difficulty ? ` · ${current.difficulty}` : ""}
            </span>
            <span>
              ⏱️ {minutes}:{String(seconds).padStart(2, "0")}
            </span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-ink-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-hot to-grape transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <h2 className="text-xl leading-snug font-bold">{current.question}</h2>

          <div className="flex flex-col gap-2.5">
            {current.options.map((option, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelected(i)}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                  selected === i
                    ? "border-hot bg-hot/15 font-bold"
                    : "border-edge bg-ink-2 hover:border-hot/50"
                }`}
              >
                <span className="mr-2 font-mono text-xs text-muted">
                  {String.fromCharCode(65 + i)}
                </span>
                {option}
              </button>
            ))}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="label !mb-0">Confidence</span>
              <span
                className="font-mono text-sm font-bold"
                style={{ color: scoreColor(confidence) }}
              >
                {confidence}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full accent-[#ff2d78]"
            />
            <div className="flex justify-between font-mono text-[10px] text-muted">
              <span>vibes only</span>
              <span>100% sure (famous last words)</span>
            </div>
          </div>

          <button
            type="button"
            onClick={lockIn}
            disabled={selected === null}
            className="btn-hot !py-3.5 text-base"
          >
            🔒 Lock it in
          </button>
        </div>
      )}

      {phase === "results" && result && (
        <div className="animate-rise flex flex-col gap-6">
          <div className="panel flex flex-col items-center gap-4 p-6 sm:p-8">
            <span className="chip">🧠 quiz complete</span>
            <ScoreReveal score={result.larp_score} label="QUIZ LARP SCORE" />
            <TierBadge score={result.larp_score} size="lg" />
            <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-xs text-muted">
              <span className="chip">✅ {result.correct}/{result.total} correct</span>
              <span className="chip">🎯 {result.quiz_score}% accuracy</span>
              <span className="chip">😤 {result.avg_confidence}% avg confidence</span>
              <span className="chip">🔥 best streak {result.best_streak}</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <ShareButton
                url={`/card/${result.profile.username}`}
                text={`I scored ${result.larp_score}/100 on the LARPINATOR quiz (${result.correct}/${result.total} correct, ${result.avg_confidence}% confident). Get LARPed:`}
                label="Share the damage"
                className="btn-hot"
              />
              <button type="button" onClick={restart} className="btn-ghost">
                🔁 Run it back
              </button>
              <Link href="/dashboard" className="btn-ghost">
                🪪 My LARP
              </Link>
            </div>
          </div>

          <AchievementBanner achievements={result.new_achievements} />

          <RoastBox roast={result.roast} />

          <div className="panel p-5 sm:p-6">
            <h3 className="title-display mb-4 text-xl">ANSWER SHEET</h3>
            <ul className="flex flex-col gap-3">
              {result.per_question.map((q, i) => (
                <li key={q.questionId} className="panel-2 p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <p className="text-sm font-bold">
                      {i + 1}. {q.question}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                        q.correct ? "bg-lime/20 text-lime" : "bg-blood/20 text-blood"
                      }`}
                    >
                      {q.correct ? "CORRECT" : "WRONG"}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-muted">
                    your answer:{" "}
                    <span className={q.correct ? "text-lime" : "text-blood"}>
                      {q.selectedIndex >= 0 ? q.options[q.selectedIndex] : "(skipped)"}
                    </span>{" "}
                    · confidence {q.confidence}%
                  </p>
                  {!q.correct && q.correctIndex >= 0 && (
                    <p className="mt-1 font-mono text-xs text-muted">
                      correct: <span className="text-lime">{q.options[q.correctIndex]}</span>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="panel p-5 sm:p-6">
            <h3 className="title-display mb-3 text-xl">LEVEL-UP GUIDE</h3>
            <ul className="flex flex-col gap-2.5">
              {result.improvements.map((item, i) => (
                <li key={i} className="panel-2 p-3.5 text-sm">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
