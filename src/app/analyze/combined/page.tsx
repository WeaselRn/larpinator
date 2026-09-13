import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { fetchLatestAnalyses, ensureProfile } from "@/lib/profile";
import type { ScoreType } from "@/lib/types";
import { CombinedClient } from "./combined-client";

const SOURCE_TYPES: ScoreType[] = ["cv", "github", "music", "quiz", "daily", "battle"];

export default async function CombinedAnalysisPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  let sources: { type: ScoreType; score: number; created_at: string }[] = [];
  let dbError: string | null = null;

  try {
    const profile = await ensureProfile();
    if (profile) {
      const latest = await fetchLatestAnalyses(profile.id);
      sources = SOURCE_TYPES.filter((type) => latest[type]).map((type) => ({
        type,
        score: latest[type].score,
        created_at: latest[type].created_at,
      }));
    }
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Could not load your analyses.";
  }

  return <CombinedClient sources={sources} dbError={dbError} />;
}
