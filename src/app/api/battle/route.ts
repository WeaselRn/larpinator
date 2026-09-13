import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { AiValidationError } from "@/lib/ai-schemas";
import { runBattleAnalysis } from "@/lib/analyzers";
import { errorMessage, jsonError, jsonOk } from "@/lib/api";
import { extractPdfText } from "@/lib/pdf";
import { ensureProfile } from "@/lib/profile";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_PDF_BYTES = 10 * 1024 * 1024;

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

async function fileToText(file: File, player: string): Promise<string> {
  if (!isPdfFile(file)) {
    throw new Error(`${player}: only .pdf files are accepted for CV upload.`);
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new Error(`${player}: that PDF is over 10MB. Even your lore has limits.`);
  }
  const { text } = await extractPdfText(await file.arrayBuffer(), file.name);
  return text;
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return jsonError("Sign in to get LARPed, bestie.", 401);
  }

  try {
    const profile = await ensureProfile();
    if (!profile) return jsonError("Sign in to get LARPed, bestie.", 401);

    let playerOneText = "";
    let playerTwoText = "";
    let playerTwoName: string | undefined;

    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      playerOneText = String(form.get("playerOneText") ?? "").trim();
      playerTwoText = String(form.get("playerTwoText") ?? "").trim();
      playerTwoName = String(form.get("playerTwoName") ?? "").trim() || undefined;

      const playerOneFile = form.get("playerOneFile");
      if (playerOneFile instanceof File && playerOneFile.size > 0) {
        playerOneText = (await fileToText(playerOneFile, "Player A")).trim();
      }

      const playerTwoFile = form.get("playerTwoFile");
      if (playerTwoFile instanceof File && playerTwoFile.size > 0) {
        playerTwoText = (await fileToText(playerTwoFile, "Player B")).trim();
      }
    } else {
      const body = (await request.json().catch(() => null)) as
        | { playerOneText?: string; playerTwoText?: string; playerTwoName?: string }
        | null;
      playerOneText = (body?.playerOneText ?? "").trim();
      playerTwoText = (body?.playerTwoText ?? "").trim();
      playerTwoName = body?.playerTwoName;
    }

    if (!playerOneText || !playerTwoText) {
      return jsonError("Both players need a submission. This isn't a one-person show.", 400);
    }

    const outcome = await runBattleAnalysis(profile, {
      playerOneText,
      playerTwoText,
      playerTwoName,
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
