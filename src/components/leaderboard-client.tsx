"use client";

import { useState } from "react";
import { TierBadge } from "@/components/tier-badge";
import { BOARDS, boardDef, type BoardKey, type LeaderboardRow } from "@/lib/leaderboard";
import { scoreColor } from "@/lib/ui";

export function LeaderboardClient({
  initialRows,
  initialError,
}: {
  initialRows: LeaderboardRow[];
  initialError: string | null;
}) {
  const [board, setBoard] = useState<BoardKey>("global");
  const [rows, setRows] = useState<LeaderboardRow[]>(initialRows);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  const select = async (key: BoardKey) => {
    if (key === board && !error) return;
    setBoard(key);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/leaderboard?board=${key}&limit=25`);
      const data = (await response.json()) as { rows?: LeaderboardRow[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Failed to load leaderboard.");
      setRows(data.rows ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leaderboard.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const def = boardDef(board);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {BOARDS.map((b) => (
          <button
            key={b.key}
            type="button"
            onClick={() => select(b.key)}
            className={b.key === board ? "btn-hot !px-3.5 !py-2 text-xs" : "btn-ghost !px-3.5 !py-2 text-xs"}
          >
            {b.emoji} {b.label}
          </button>
        ))}
      </div>

      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-edge/70 px-5 py-4">
          <div>
            <h2 className="title-display text-2xl">
              {def.emoji} {def.label}
            </h2>
            <p className="font-mono text-xs text-muted">{def.blurb}</p>
          </div>
          {loading && <span className="animate-blink font-mono text-xs text-hot">loading…</span>}
        </div>

        {error ? (
          <div className="p-6 text-sm text-muted">
            {error}
            <p className="mt-1 font-mono text-[10px]">
              If this says the table doesn&apos;t exist, run the Supabase migrations first.
            </p>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <span className="text-4xl">🫥</span>
            <p className="font-bold">Nobody qualifies yet.</p>
            <p className="text-sm text-muted">Be the pioneer. Set the LARP bar.</p>
          </div>
        ) : (
          <ul className="divide-y divide-edge/60">
            {rows.map((row) => (
              <li key={`${board}-${row.id}`} className="flex items-center gap-4 px-5 py-3.5">
                <span
                  className={`title-display w-10 text-center text-xl ${
                    row.rank === 1 ? "text-amber" : row.rank <= 3 ? "text-white" : "text-muted"
                  }`}
                >
                  {row.rank === 1 ? "👑" : `#${row.rank}`}
                </span>
                {row.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.avatar_url}
                    alt={row.username}
                    className="h-10 w-10 rounded-xl object-cover ring-2 ring-edge"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-panel-2">
                    🧢
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <a
                    href={`/card/${row.username}`}
                    className="block truncate font-bold hover:text-hot"
                  >
                    {row.username}
                  </a>
                  <TierBadge score={row.value} size="sm" />
                </div>
                <span className="text-right">
                  <span
                    className="title-display block text-2xl leading-none"
                    style={{ color: scoreColor(row.value) }}
                  >
                    {Math.round(row.value)}
                  </span>
                  {def.unit && (
                    <span className="font-mono text-[10px] text-muted uppercase">{def.unit}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
