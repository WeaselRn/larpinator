import { LeaderboardClient } from "@/components/leaderboard-client";
import { MemeImage } from "@/components/meme-image";
import { getLeaderboard } from "@/lib/leaderboard";
import { MEME_ASSETS } from "@/lib/reactions";

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
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="chip">🏆 leaderboard</span>
          <h1 className="title-display mt-4 text-5xl sm:text-6xl">
            MAIN CHARACTER <span className="text-hot">LEADERBOARD</span>
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Ranked by stored LARP scores. Updates the moment any activity lands. Higher = more
            main character energy. Yes, #1 is the biggest LARPer alive. No cap.
          </p>
        </div>
        <MemeImage
          src={MEME_ASSETS.absoluteLarp}
          alt="Absolute larp"
          className="h-36 w-auto shrink-0 -rotate-2 rounded-2xl border border-edge sm:h-44"
        />
      </div>
      <LeaderboardClient initialRows={rows} initialError={error} />
    </div>
  );
}
