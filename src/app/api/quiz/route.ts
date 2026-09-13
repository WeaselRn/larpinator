import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { errorMessage, jsonError, jsonOk } from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export interface QuizQuestionPublic {
  id: string;
  category: string;
  question: string;
  options: string[];
  difficulty: string | null;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return jsonError("Sign in to get LARPed, bestie.", 401);

  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const mode = url.searchParams.get("mode") === "daily" ? "daily" : "random";
    const count = Math.min(Math.max(Number(url.searchParams.get("count") ?? 10) || 10, 3), 20);

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("quiz_questions")
      .select("id, category, question, options, difficulty")
      .eq("active", true);

    if (category && category !== "mixed") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const all = (data ?? []) as QuizQuestionPublic[];
    if (all.length === 0) {
      return jsonError("No quiz questions found. Run the seed migration (002_seed.sql) so we can test your confidence.", 500);
    }

    const dayIndex = Math.floor(Date.now() / 86_400_000);
    const rng = mode === "daily" ? mulberry32(dayIndex * 7919) : Math.random;
    const questions = shuffle(all, rng).slice(0, count);

    return jsonOk({ mode, category: category ?? "mixed", questions });
  } catch (err) {
    return jsonError(errorMessage(err), 500);
  }
}
