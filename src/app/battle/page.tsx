"use client";

import { useState, type FormEvent } from "react";
import { AnalysisLoader } from "@/components/analysis-loader";
import { BattleResultView, type BattleResponse } from "@/components/battle-result";
import { ErrorPanel } from "@/components/error-panel";
import { useAnalysis } from "@/hooks/use-analysis";

const MAX_PDF_BYTES = 10 * 1024 * 1024;

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function fileError(file: File | null, player: string): string | null {
  if (!file) return null;
  if (!isPdfFile(file)) return `${player}: only .pdf files are accepted, bestie.`;
  if (file.size > MAX_PDF_BYTES) return `${player}: that PDF is over 10MB. Even your lore has limits.`;
  return null;
}

export default function BattlePage() {
  const [playerTwoName, setPlayerTwoName] = useState("");
  const [playerOneText, setPlayerOneText] = useState("");
  const [playerTwoText, setPlayerTwoText] = useState("");
  const [playerOneFile, setPlayerOneFile] = useState<File | null>(null);
  const [playerTwoFile, setPlayerTwoFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const { loading, error, result, run, reset } = useAnalysis<BattleResponse>();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setLocalError(null);

    const playerOneProblem = fileError(playerOneFile, "Player A");
    const playerTwoProblem = fileError(playerTwoFile, "Player B");
    if (playerOneProblem || playerTwoProblem) {
      setLocalError(playerOneProblem ?? playerTwoProblem);
      return;
    }

    const playerOneHasText = playerOneText.trim().length >= 60;
    const playerTwoHasText = playerTwoText.trim().length >= 60;
    if (!playerOneHasText && !playerOneFile) {
      setLocalError("Player A needs at least 60 characters of text or a CV PDF.");
      return;
    }
    if (!playerTwoHasText && !playerTwoFile) {
      setLocalError("Player B needs at least 60 characters of text or a CV PDF.");
      return;
    }

    if (playerOneFile || playerTwoFile) {
      const form = new FormData();
      form.append("playerOneText", playerOneText);
      form.append("playerTwoText", playerTwoText);
      if (playerTwoName) form.append("playerTwoName", playerTwoName);
      if (playerOneFile) form.append("playerOneFile", playerOneFile);
      if (playerTwoFile) form.append("playerTwoFile", playerTwoFile);
      run(() => fetch("/api/battle", { method: "POST", body: form }));
      return;
    }

    run(() =>
      fetch("/api/battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerOneText, playerTwoText, playerTwoName }),
      }),
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8">
        <span className="chip">⚔️ larp battle</span>
        <h1 className="title-display mt-4 text-5xl">
          TWO PROFILES <span className="text-hot">ENTER</span>
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Paste two CVs/profiles. We score both side by side and deliver a brutal verdict. Lower
          LARP wins — the least delulu person takes the crown.
        </p>
      </div>

      {!loading && !result && (
        <form onSubmit={submit} className="flex flex-col gap-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="panel flex flex-col gap-3 p-5">
              <p className="title-display text-xl text-hot">PLAYER A — YOU</p>
              <label className="label" htmlFor="player-one">
                Your CV / profile material
              </label>
              <textarea
                id="player-one"
                value={playerOneText}
                onChange={(e) => setPlayerOneText(e.target.value)}
                rows={10}
                maxLength={8000}
                placeholder="Paste your CV, LinkedIn bio, or project summary…"
                className="input resize-y font-mono text-xs leading-relaxed"
              />
              <p className="text-right font-mono text-[10px] text-muted">
                {playerOneText.length}/8000
              </p>
              <div className="rounded-xl border border-dashed border-edge bg-ink-2 px-3 py-3">
                <label className="label !mb-1" htmlFor="player-one-file">
                  📎 Or upload CV PDF <span className="text-muted">(.pdf only, max 10MB)</span>
                </label>
                <input
                  id="player-one-file"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => setPlayerOneFile(e.target.files?.[0] ?? null)}
                  className="input file:mr-3 file:rounded-lg file:border-0 file:bg-hot file:px-3 file:py-1.5 file:font-mono file:text-xs file:font-bold file:text-ink"
                />
                {playerOneFile && (
                  <p className="mt-1.5 font-mono text-[10px] text-muted">
                    selected: {playerOneFile.name} ({(playerOneFile.size / 1024).toFixed(0)} KB)
                  </p>
                )}
              </div>
            </div>

            <div className="panel flex flex-col gap-3 p-5">
              <p className="title-display text-xl text-grape">PLAYER B — CHALLENGER</p>
              <div>
                <label className="label" htmlFor="player-two-name">
                  Challenger name (optional)
                </label>
                <input
                  id="player-two-name"
                  value={playerTwoName}
                  onChange={(e) => setPlayerTwoName(e.target.value)}
                  placeholder="e.g. Your coworker who 'does a bit of everything'"
                  className="input"
                  maxLength={40}
                />
              </div>
              <label className="label" htmlFor="player-two">
                Their CV / profile material
              </label>
              <textarea
                id="player-two"
                value={playerTwoText}
                onChange={(e) => setPlayerTwoText(e.target.value)}
                rows={7}
                maxLength={8000}
                placeholder="Paste their CV, bio, or your favorite quote of theirs…"
                className="input resize-y font-mono text-xs leading-relaxed"
              />
              <p className="text-right font-mono text-[10px] text-muted">
                {playerTwoText.length}/8000
              </p>
              <div className="rounded-xl border border-dashed border-edge bg-ink-2 px-3 py-3">
                <label className="label !mb-1" htmlFor="player-two-file">
                  📎 Or upload their CV PDF <span className="text-muted">(.pdf only, max 10MB)</span>
                </label>
                <input
                  id="player-two-file"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => setPlayerTwoFile(e.target.files?.[0] ?? null)}
                  className="input file:mr-3 file:rounded-lg file:border-0 file:bg-hot file:px-3 file:py-1.5 file:font-mono file:text-xs file:font-bold file:text-ink"
                />
                {playerTwoFile && (
                  <p className="mt-1.5 font-mono text-[10px] text-muted">
                    selected: {playerTwoFile.name} ({(playerTwoFile.size / 1024).toFixed(0)} KB)
                  </p>
                )}
              </div>
            </div>
          </div>

          {localError && <ErrorPanel message={localError} />}

          <button type="submit" className="btn-hot !py-3.5 text-base">
            ⚔️ Start the battle
          </button>
          <p className="font-mono text-[10px] text-muted">
            Only Player A needs a LARPINATOR account — Player B is just collateral. Uploaded PDFs
            are processed in memory and never stored.
          </p>
        </form>
      )}

      {loading && <AnalysisLoader title="SUMMONING THE BATTLE" />}

      {error && (
        <div className="flex flex-col gap-4">
          <ErrorPanel message={error} />
          <button type="button" onClick={reset} className="btn-ghost self-start">
            ← Back
          </button>
        </div>
      )}

      {result && <BattleResultView data={result} />}
    </div>
  );
}
