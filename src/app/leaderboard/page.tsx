import { LeaderboardClient } from "@/components/leaderboard-client";
import { getLeaderboard } from "@/lib/leaderboard";

export default async function LeaderboardPage() {
  let rows: Awaited<ReturnType<typeof getLeaderboard>> = [];
  let error: string | null = null;

  try {
    rows = await getLeaderboard("global", 25);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load leaderboard.";
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <span className="chip">🏆 leaderboard</span>
        <h1 className="title-display mt-4 text-5xl sm:text-6xl">
          GLOBAL LARP <span className="text-hot">LEADERBOARD</span>
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Ranked by stored LARP scores. Updates the moment any activity lands. Higher = more
          LARP. Yes, that means #1 is the biggest LARPer alive.
        </p>
      </div>
      <LeaderboardClient initialRows={rows} initialError={error} />
    </div>
  );
}
