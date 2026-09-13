import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { AiValidationError } from "@/lib/ai-schemas";
import { runBattleAnalysis } from "@/lib/analyzers";
import { errorMessage, jsonError, jsonOk } from "@/lib/api";
import { ensureProfile } from "@/lib/profile";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const profile = await ensureProfile();
    if (!profile) return jsonError("Unauthorized", 401);

    const body = (await request.json().catch(() => null)) as
      | { playerOneText?: string; playerTwoText?: string; playerTwoName?: string }
      | null;

    if (!body?.playerOneText || !body?.playerTwoText) {
      return jsonError("Both players need a submission.", 400);
    }

    const outcome = await runBattleAnalysis(profile, {
      playerOneText: body.playerOneText,
      playerTwoText: body.playerTwoText,
      playerTwoName: body.playerTwoName,
    });

    return jsonOk(outcome);
  } catch (err) {
    if (err instanceof AiValidationError) {
      return jsonError(err.message, 502);
    }
    const message = errorMessage(err);
    return jsonError(message, message.includes("AI provider") ? 503 : 400);
  }
}
