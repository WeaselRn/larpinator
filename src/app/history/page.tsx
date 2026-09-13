import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DbNotice } from "@/components/db-notice";
import { TierBadge } from "@/components/tier-badge";
import { ANALYSIS_META } from "@/lib/categories";
import { timeAgo } from "@/lib/format";
import { ensureProfile } from "@/lib/profile";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { ScoreType } from "@/lib/types";
import { scoreColor } from "@/lib/ui";

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "cv", label: "📄 CV" },
  { key: "github", label: "💻 GitHub" },
  { key: "music", label: "🎧 Music" },
  { key: "combined", label: "🧬 Combined" },
  { key: "quiz", label: "🧠 Quiz" },
  { key: "daily", label: "🎯 Daily" },
  { key: "battle", label: "⚔️ Battle" },
];

interface HistoryRow {
  id: string;
  type: ScoreType;
  score: number;
  roast: string;
  created_at: string;
  improvements: string[] | null;
  findings: unknown[] | null;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const params = await searchParams;
  const filter = params.type && params.type !== "all" ? params.type : null;

  let rows: HistoryRow[] = [];
  let loadError: string | null = null;

  try {
    const profile = await ensureProfile();
    if (profile) {
      const supabase = getSupabaseAdmin();
      let query = supabase
        .from("analyses")
        .select("id, type, score, roast, created_at, improvements, findings")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (filter) query = query.eq("type", filter);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      rows = (data ?? []).map((row) => ({
        ...row,
        score: Number(row.score),
      })) as HistoryRow[];
    }
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Failed to load history.";
  }

  if (loadError) return <DbNotice message={loadError} />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <span className="chip">📜 larp history</span>
        <h1 className="title-display mt-4 text-5xl">
          YOUR <span className="text-hot">RAP SHEET</span>
        </h1>
        <p className="mt-3 text-muted">Every roast, every score, permanently on the record. The receipts stay out.</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/history" : `/history?type=${f.key}`}
            className={
              (filter ?? "all") === f.key
                ? "btn-hot !px-3.5 !py-2 text-xs"
                : "btn-ghost !px-3.5 !py-2 text-xs"
            }
          >
            {f.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="panel flex flex-col items-center gap-2 p-12 text-center">
          <span className="text-4xl">🗿</span>
          <p className="font-bold">Nothing here yet.</p>
          <p className="text-sm text-muted">
            Your history is spotless. Suspiciously spotless. Fix that.
          </p>
          <Link href="/analyze" className="btn-hot mt-3">
            Get cooked
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((row) => {
            const meta = ANALYSIS_META[row.type];
            return (
              <li key={row.id} className="panel p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-2xl">{meta?.emoji ?? "❓"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{meta?.label ?? row.type}</p>
                    <p className="font-mono text-[10px] text-muted">
                      {timeAgo(row.created_at)}
                      {row.improvements && row.improvements.length > 0
                        ? ` · ${row.improvements.length} level-up tips`
                        : ""}
                      {row.findings && row.findings.length > 0
                        ? ` · ${row.findings.length} receipts`
                        : ""}
                    </p>
                  </div>
                  <TierBadge score={row.score} size="sm" />
                  <span
                    className="title-display text-3xl"
                    style={{ color: scoreColor(row.score) }}
                  >
                    {Math.round(row.score)}
                  </span>
                </div>
                {row.roast && (
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
                    🔥 {row.roast}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
