import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { recordActivity } from "@/lib/activity";
import { errorMessage, jsonError, jsonOk } from "@/lib/api";
import { ensureProfile } from "@/lib/profile";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 30;

const submitSchema = z.object({
  category: z.string().max(60).optional(),
  mode: z.enum(["random", "daily"]).optional(),
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        selectedIndex: z.number().int().min(-1).max(20),
        confidence: z.number().min(0).max(100),
        timeMs: z.number().min(0).max(600_000).optional(),
      }),
    )
    .min(1)
    .max(20),
});

interface QuizQuestionRow {
  id: string;
  category: string;
  question: string;
  options: string[];
  correct_index: number;
}

function buildRoast(accuracy: number, avgConfidence: number): string {
  const gap = avgConfidence - accuracy;
  if (accuracy === 100) {
    return "Perfect score. Either you're genuinely smart or you cheated — and cheaters don't score this well.";
  }
  if (gap >= 40) {
    return `${Math.round(avgConfidence)}% confidence, ${Math.round(accuracy)}% correctness. That's not self-assurance, that's fan fiction. 💀`;
  }
  if (gap >= 20) {
    return "You were certain about things you were wrong about. Classic LARP behaviour: confidence first, facts whenever.";
  }
  if (gap <= -25) {
    return "You knew more than you believed. Imposter syndrome — the most honest form of LARPing.";
  }
  if (accuracy < 40) {
    return "Answering with vibes and hoping for the best. Respect the confidence, pity the accuracy.";
  }
  return "Decently calibrated. You're larping less than the average NPC — but where's the fun in that?";
}

function buildImprovements(accuracy: number, avgConfidence: number): string[] {
  const items: string[] = [];
  const gap = avgConfidence - accuracy;

  if (gap > 15) {
    items.push("🧠 Actually improve: pause before the confidence slider. Certainty is not a personality trait.");
  } else if (gap < -15) {
    items.push("🧠 Actually improve: trust yourself. You're better at this than you think.");
  } else {
    items.push("🧠 Actually improve: keep that calibration. It's rare and mildly concerning.");
  }

  items.push(
    "🪄 LARP harder: answer instantly, never double-check, and refer to your 'intuition' as a methodology.",
    "🧠 Actually improve: read every option before answering. 'All of the above' is not a strategy.",
  );

  if (accuracy < 50) {
    items.push("🪄 LARP harder: claim you 'only missed the easy ones on purpose' to test the quiz.");
  } else {
    items.push("🪄 LARP harder: mention your quiz score unprompted in conversation. It's basically a degree.");
  }

  return items.slice(0, 5);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return jsonError("Unauthorized", 401);

  try {
    const profile = await ensureProfile();
    if (!profile) return jsonError("Unauthorized", 401);

    const parsed = submitSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonError("Invalid quiz submission.", 400);
    }

    const { answers, category, mode } = parsed.data;
    const supabase = getSupabaseAdmin();

    const ids = answers.map((a) => a.questionId);
    const { data: questionRows, error } = await supabase
      .from("quiz_questions")
      .select("id, category, question, options, correct_index")
      .in("id", ids);

    if (error) throw new Error(error.message);
    const questions = new Map((questionRows ?? []).map((q) => [q.id as string, q as QuizQuestionRow]));

    if (questions.size === 0) {
      return jsonError("Quiz questions not found. Try restarting the quiz.", 400);
    }

    let correctCount = 0;
    let confidenceSum = 0;
    let larpSum = 0;
    let streak = 0;
    let bestStreak = 0;

    const perQuestion = answers.map((answer) => {
      const question = questions.get(answer.questionId);
      const correct = question ? answer.selectedIndex === question.correct_index : false;
      const confidence = correct ? answer.confidence : answer.selectedIndex === -1 ? 0 : answer.confidence;

      if (correct) {
        correctCount++;
        streak++;
        bestStreak = Math.max(bestStreak, streak);
      } else {
        streak = 0;
      }

      confidenceSum += confidence;
      larpSum += confidence * (correct ? 0 : 1);

      return {
        questionId: answer.questionId,
        question: question?.question ?? "",
        options: question?.options ?? [],
        correctIndex: question?.correct_index ?? -1,
        selectedIndex: answer.selectedIndex,
        correct,
        confidence: answer.confidence,
        timeMs: answer.timeMs ?? null,
      };
    });

    const total = answers.length;
    const quizScore = Math.round((correctCount / total) * 100);
    const avgConfidence = confidenceSum / total;
    const larpScore = Math.round(larpSum / total);

    const roast = buildRoast(quizScore, avgConfidence);
    const improvements = buildImprovements(quizScore, avgConfidence);

    await supabase.from("quiz_attempts").insert({
      user_id: profile.id,
      score: quizScore,
      larp_score: larpScore,
      category: category ?? "mixed",
      details: { mode: mode ?? "random", per_question: perQuestion, best_streak: bestStreak },
    });

    const { profile: updated, newAchievements } = await recordActivity({
      profileId: profile.id,
      type: "quiz",
      score: larpScore,
      categoryScores: {},
      roast,
      improvements,
      findings: [],
      rawResult: {
        quiz_score: quizScore,
        avg_confidence: Math.round(avgConfidence),
        correct: correctCount,
        total,
        best_streak: bestStreak,
        category: category ?? "mixed",
      },
      xp: 50 + correctCount * 5,
    });

    return jsonOk({
      quiz_score: quizScore,
      larp_score: larpScore,
      correct: correctCount,
      total,
      avg_confidence: Math.round(avgConfidence),
      best_streak: bestStreak,
      roast,
      improvements,
      per_question: perQuestion,
      profile: updated,
      new_achievements: newAchievements,
    });
  } catch (err) {
    return jsonError(errorMessage(err), 500);
  }
}
