"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AnalysisLoader } from "@/components/analysis-loader";
import { AnalysisResult } from "@/components/analysis-result";
import { ErrorPanel } from "@/components/error-panel";
import { useAnalysis } from "@/hooks/use-analysis";
import type { AnalysisResponse } from "@/lib/types";

type Mode = "pdf" | "image" | "text";

export default function CvAnalysisPage() {
  const [mode, setMode] = useState<Mode>("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const { loading, error, result, run, reset } = useAnalysis<AnalysisResponse>();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setLocalError(null);

    if (mode === "text") {
      if (text.trim().length < 80) {
        setLocalError("That's not a resume, that's a tweet. Paste at least a few lines, bestie.");
        return;
      }
    } else if (!file) {
      setLocalError(`Choose a ${mode === "pdf" ? "PDF" : "image"} file first.`);
      return;
    }

    const form = new FormData();
    form.append("type", "cv");
    if (mode === "text") {
      form.append("text", text);
    } else if (file) {
      form.append("file", file);
    }

    run(() => fetch("/api/analyze", { method: "POST", body: form }));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <span className="chip">📄 cv vibe check</span>
        <h1 className="title-display mt-4 text-5xl">
          UPLOAD YOUR <span className="text-hot">RESUME</span>
        </h1>
        <p className="mt-3 text-muted">
          Let&apos;s see what HR sees vs what reality sees. PDF, image, or raw text. The buzzwords will be counted.
        </p>
      </div>

      {!loading && !result && (
        <form onSubmit={submit} className="panel flex flex-col gap-5 p-6">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: "pdf", label: "📎 Upload PDF" },
                { key: "image", label: "🖼️ Upload image" },
                { key: "text", label: "⌨️ Paste text" },
              ] as { key: Mode; label: string }[]
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setMode(tab.key);
                  setFile(null);
                  setLocalError(null);
                }}
                className={mode === tab.key ? "btn-hot" : "btn-ghost"}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {mode === "text" ? (
            <div>
              <label className="label" htmlFor="cv-text">
                Resume text
              </label>
              <textarea
                id="cv-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={12}
                placeholder="Paste your resume here… every buzzword will be counted, no cap."
                className="input resize-y font-mono text-xs leading-relaxed"
              />
              <p className="mt-1.5 text-right font-mono text-[10px] text-muted">
                {text.length} chars
              </p>
            </div>
          ) : (
            <div>
              <label className="label" htmlFor="cv-file">
                {mode === "pdf" ? "PDF file (max 10MB)" : "Image file (max 8MB)"}
              </label>
              <input
                id="cv-file"
                type="file"
                accept={mode === "pdf" ? "application/pdf" : "image/png,image/jpeg,image/webp"}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="input file:mr-3 file:rounded-lg file:border-0 file:bg-hot file:px-3 file:py-1.5 file:font-mono file:text-xs file:font-bold file:text-ink"
              />
              {file && (
                <p className="mt-1.5 font-mono text-[10px] text-muted">
                  selected: {file.name} ({(file.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>
          )}

          {localError && <ErrorPanel message={localError} />}

          <button type="submit" className="btn-hot !py-3.5 text-base">
            🔥 Cook my resume
          </button>
          <p className="font-mono text-[10px] text-muted">
            Uploaded files are processed in memory and never stored permanently.
          </p>
        </form>
      )}

      {loading && <AnalysisLoader title="READING YOUR RESUME" />}

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
            type="cv"
            result={result.result}
            profile={result.profile}
            newAchievements={result.newAchievements}
          />
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={reset} className="btn-ghost">
              ← Analyze another CV
            </button>
            <Link href="/analyze/combined" className="btn-grape">
              🧬 Run cross-vibe audit
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
