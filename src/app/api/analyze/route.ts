import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { AiValidationError } from "@/lib/ai-schemas";
import {
  runCombinedAnalysis,
  runCvAnalysis,
  runGithubAnalysis,
  runMusicAnalysis,
} from "@/lib/analyzers";
import { errorMessage, jsonError, jsonOk } from "@/lib/api";
import { GitHubNotFoundError } from "@/lib/github";
import { LastfmNotFoundError } from "@/lib/lastfm";
import { ensureProfile } from "@/lib/profile";

export const runtime = "nodejs";
export const maxDuration = 60;

function statusForError(message: string): number {
  if (message.includes("AI provider")) return 503;
  if (message.includes("not reachable")) return 503;
  return 400;
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return jsonError("Sign in to get LARPed, bestie.", 401);
  }

  try {
    const profile = await ensureProfile();
    if (!profile) {
      return jsonError("Sign in to get LARPed, bestie.", 401);
    }

    const contentType = request.headers.get("content-type") ?? "";
    let type: string | null = null;
    let text: string | undefined;
    let username: string | undefined;
    let file: File | undefined;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      type = form.get("type")?.toString() ?? null;
      text = form.get("text")?.toString() || undefined;
      username = form.get("username")?.toString() || undefined;
      const uploaded = form.get("file");
      if (uploaded instanceof File && uploaded.size > 0) {
        file = uploaded;
      }
    } else {
      const body = (await request.json().catch(() => null)) as
        | { type?: string; text?: string; username?: string }
        | null;
      type = body?.type ?? null;
      text = body?.text;
      username = body?.username;
    }

    switch (type) {
      case "cv": {
        const outcome = await runCvAnalysis(profile, { text, file });
        return jsonOk(outcome);
      }
      case "github": {
        if (!username) return jsonError("GitHub username is required. We need a target, bestie.", 400);
        const outcome = await runGithubAnalysis(profile, username);
        return jsonOk(outcome);
      }
      case "music": {
        if (!username) return jsonError("Last.fm username is required. No scrobbles, no roast.", 400);
        const outcome = await runMusicAnalysis(profile, username);
        return jsonOk(outcome);
      }
      case "combined": {
        const outcome = await runCombinedAnalysis(profile);
        return jsonOk(outcome);
      }
      default:
        return jsonError("Unknown analysis type. Use cv, github, music or combined. Don't be delulu.", 400);
    }
  } catch (err) {
    if (err instanceof AiValidationError) {
      return jsonError(err.message, 502);
    }
    if (err instanceof GitHubNotFoundError || err instanceof LastfmNotFoundError) {
      return jsonError(err.message, 404);
    }
    const message = errorMessage(err);
    return jsonError(message, statusForError(message));
  }
}
