import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DbNotice } from "@/components/db-notice";
import { getDailyOverview, type DailyOverview } from "@/lib/daily";
import { ensureProfile } from "@/lib/profile";
import type { Profile } from "@/lib/types";
import { DailyClient } from "./daily-client";

export default async function DailyPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  let profile: Profile | null = null;
  let overview: DailyOverview | null = null;
  let loadError: string | null = null;

  try {
    profile = await ensureProfile();
    if (profile) {
      overview = await getDailyOverview(profile);
    }
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Failed to load the daily challenge.";
  }

  if (loadError) return <DbNotice message={loadError} />;
  if (!profile) redirect("/sign-in");
  if (!overview) {
    return <DbNotice message="No daily challenges seeded. Run supabase/migrations/002_seed.sql." />;
  }

  return (
    <DailyClient
      challenge={{ id: overview.challenge.id, prompt: overview.challenge.prompt }}
      attempts={overview.attempts}
      best={overview.best}
      rank={overview.rank}
      streak={profile.streak}
    />
  );
}
