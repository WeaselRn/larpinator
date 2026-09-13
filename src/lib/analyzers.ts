import { larpResultSchema, battleResultSchema, parseBattleResult, parseLarpResult, type BattleResult } from "./ai-schemas";
import { recordActivity } from "./activity";
import { fetchGitHubEvidence, parseGitHubUsername } from "./github";
import { requestStructuredJson, transcribeImage } from "./groq";
import { fetchMusicEvidence, parseLastfmUsername } from "./lastfm";
import { extractPdfText } from "./pdf";
import { fetchLatestAnalyses } from "./profile";
import {
  BATTLE_SYSTEM,
  battleUserPrompt,
  combinedUserPrompt,
  cvUserPrompt,
  dailyUserPrompt,
  githubUserPrompt,
  musicUserPrompt,
  systemPromptFor,
} from "./prompts";
import { getSupabaseAdmin } from "./supabase";
import type { Achievement, LarpAnalysisResult, Profile, ScoreType } from "./types";

const MAX_TEXT_CHARS = 15_000;
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export interface AnalysisOutcome {
  type: ScoreType;
  result: LarpAnalysisResult;
  profile: Profile;
  newAchievements: Achievement[];
}

export interface BattleOutcome {
  result: BattleResult;
  profile: Profile;
  newAchievements: Achievement[];
  battle: {
    id: string;
    winner: "player_one" | "player_two" | null;
    playerOneName: string;
    playerTwoName: string;
  };
}

interface CvInput {
  text?: string;
  file?: File;
}

async function resolveCvText(input: CvInput): Promise<{ text: string; source: "text" | "pdf" | "image" }> {
  if (input.file) {
    const file = input.file;
    const type = file.type || "";

    if (type === "application/pdf") {
      if (file.size > MAX_PDF_BYTES) {
        throw new Error("PDF is too large. Max size is 10MB. Your resume doesn't need to be a novella, bestie.");
      }
      const { text } = await extractPdfText(await file.arrayBuffer(), file.name || "resume.pdf");
      return { text: text.slice(0, MAX_TEXT_CHARS), source: "pdf" };
    }

    if (type.startsWith("image/")) {
      if (file.size > MAX_IMAGE_BYTES) {
        throw new Error("Image is too large. Max size is 8MB. Screenshot in 4K doesn't make the claims more real.");
      }
      const dataUrl = `data:${type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
      const text = await transcribeImage(dataUrl);
      if (!text || text.length < 40) {
        throw new Error("Could not read enough text from that image. Try a clearer screenshot or paste the text — image LARP is already a red flag.");
      }
      return { text: text.slice(0, MAX_TEXT_CHARS), source: "image" };
    }

    throw new Error("Unsupported file type. Upload a PDF or image, or paste your resume text. We need evidence, not vibes.");
  }

  const text = (input.text ?? "").trim();
  if (!text) {
    throw new Error("Nothing to analyze. Upload a file or paste your resume text. We can't roast an empty plate.");
  }
  if (text.length < 80) {
    throw new Error("That's not a resume, that's a tweet. Paste at least a few lines so the delulu can be quantified.");
  }
  return { text: text.slice(0, MAX_TEXT_CHARS), source: "text" };
}

export async function runCvAnalysis(profile: Profile, input: CvInput): Promise<AnalysisOutcome> {
  const { text, source } = await resolveCvText(input);

  const raw = await requestStructuredJson({
    system: systemPromptFor("cv"),
    user: cvUserPrompt(text),
    schema: larpResultSchema,
  });
  const result = parseLarpResult(raw, "cv");

  const { profile: updated, newAchievements } = await recordActivity({
    profileId: profile.id,
    type: "cv",
    score: result.overall_score,
    categoryScores: result.categories,
    roast: result.roast,
    improvements: result.improvements,
    findings: result.findings,
    rawResult: { source, text_excerpt: text.slice(0, 4000) },
  });

  return { type: "cv", result, profile: updated, newAchievements };
}

export async function runGithubAnalysis(profile: Profile, usernameInput: string): Promise<AnalysisOutcome> {
  const username = parseGitHubUsername(usernameInput);
  if (!username) {
    throw new Error("That doesn't look like a GitHub username or profile URL. Try again, bestie.");
  }

  const evidence = await fetchGitHubEvidence(username);

  const raw = await requestStructuredJson({
    system: systemPromptFor("github"),
    user: githubUserPrompt(evidence),
    schema: larpResultSchema,
  });
  const result = parseLarpResult(raw, "github");

  const { profile: updated, newAchievements } = await recordActivity({
    profileId: profile.id,
    type: "github",
    score: result.overall_score,
    categoryScores: result.categories,
    roast: result.roast,
    improvements: result.improvements,
    findings: result.findings,
    rawResult: evidence,
  });

  return { type: "github", result, profile: updated, newAchievements };
}

export async function runMusicAnalysis(profile: Profile, usernameInput: string): Promise<AnalysisOutcome> {
  const username = parseLastfmUsername(usernameInput);
  if (!username) {
    throw new Error("That doesn't look like a Last.fm username or profile URL. No scrobbles, no roast.");
  }

  const evidence = await fetchMusicEvidence(username);

  const raw = await requestStructuredJson({
    system: systemPromptFor("music"),
    user: musicUserPrompt(evidence),
    schema: larpResultSchema,
  });
  const result = parseLarpResult(raw, "music");

  const { profile: updated, newAchievements } = await recordActivity({
    profileId: profile.id,
    type: "music",
    score: result.overall_score,
    categoryScores: result.categories,
    roast: result.roast,
    improvements: result.improvements,
    findings: result.findings,
    rawResult: evidence,
  });

  return { type: "music", result, profile: updated, newAchievements };
}

const COMBINED_SOURCE_TYPES: ScoreType[] = ["cv", "github", "music", "quiz", "daily", "battle"];

export async function runCombinedAnalysis(profile: Profile): Promise<AnalysisOutcome> {
  const latest = await fetchLatestAnalyses(profile.id);

  const sources = COMBINED_SOURCE_TYPES.filter((t) => latest[t]).map((t) => ({
    type: t,
    score: latest[t].score,
    categories: latest[t].category_scores,
    roast: latest[t].roast,
    completed_at: latest[t].created_at,
  }));

  if (sources.length < 2) {
    throw new Error(
      "Cross-vibe audit needs at least 2 completed analyses (CV, GitHub, Music, Quiz, Daily or Battle). Go collect some receipts first.",
    );
  }

  const raw = await requestStructuredJson({
    system: systemPromptFor("combined"),
    user: combinedUserPrompt({ sources }),
    schema: larpResultSchema,
  });
  const result = parseLarpResult(raw, "combined");

  const { profile: updated, newAchievements } = await recordActivity({
    profileId: profile.id,
    type: "combined",
    score: result.overall_score,
    categoryScores: result.categories,
    roast: result.roast,
    improvements: result.improvements,
    findings: result.findings,
    rawResult: { sources },
  });

  return { type: "combined", result, profile: updated, newAchievements };
}

export async function runDailyAnalysis(
  profile: Profile,
  challenge: string,
  response: string,
  extraProfileUpdates?: Record<string, unknown>,
): Promise<AnalysisOutcome> {
  const text = response.trim();
  if (text.length < 5) {
    throw new Error("Write at least a few words. Dodging with silence is too meta, even for a LARPer.");
  }
  if (text.length > 2000) {
    throw new Error("Keep it under 2000 characters. Brevity is aura, and also a literacy check.");
  }

  const raw = await requestStructuredJson({
    system: systemPromptFor("daily"),
    user: dailyUserPrompt(challenge, text),
    schema: larpResultSchema,
  });
  const result = parseLarpResult(raw, "daily");

  const { profile: updated, newAchievements } = await recordActivity({
    profileId: profile.id,
    type: "daily",
    score: result.overall_score,
    categoryScores: result.categories,
    roast: result.roast,
    improvements: result.improvements,
    findings: result.findings,
    rawResult: { challenge, response: text.slice(0, 2000) },
    extraProfileUpdates,
  });

  return { type: "daily", result, profile: updated, newAchievements };
}

export interface BattleInput {
  playerOneText: string;
  playerTwoText: string;
  playerTwoName?: string;
}

export async function runBattleAnalysis(profile: Profile, input: BattleInput): Promise<BattleOutcome> {
  const playerOneText = input.playerOneText.trim();
  const playerTwoText = input.playerTwoText.trim();

  if (playerOneText.length < 60 || playerTwoText.length < 60) {
    throw new Error("Both players need at least 60 characters of CV/profile material to battle. Bring receipts.");
  }
  if (playerOneText.length > 8000 || playerTwoText.length > 8000) {
    throw new Error("Keep each submission under 8000 characters. Even your lore has limits.");
  }

  const raw = await requestStructuredJson({
    system: BATTLE_SYSTEM,
    user: battleUserPrompt(playerOneText, playerTwoText),
    schema: battleResultSchema,
    maxTokens: 3600,
  });
  const parsed = parseBattleResult(raw);

  const auraOne = parsed.playerOne.categories.aura ?? 0;
  const auraTwo = parsed.playerTwo.categories.aura ?? 0;
  const winner: "player_one" | "player_two" | null =
    parsed.playerOne.overall_score < parsed.playerTwo.overall_score
      ? "player_one"
      : parsed.playerTwo.overall_score < parsed.playerOne.overall_score
        ? "player_two"
        : auraOne === auraTwo
          ? null
          : auraOne > auraTwo
            ? "player_one"
            : "player_two";

  const playerOneName = profile.username;
  const playerTwoName = (input.playerTwoName ?? "").trim().slice(0, 40) || "Player B";

  const supabase = getSupabaseAdmin();
  const { data: battleRow, error } = await supabase
    .from("battles")
    .insert({
      player_one_id: profile.id,
      player_two_id: null,
      player_one_name: playerOneName,
      player_two_name: playerTwoName,
      player_one_score: parsed.playerOne.overall_score,
      player_two_score: parsed.playerTwo.overall_score,
      winner_id: winner === "player_one" ? profile.id : null,
      verdict: parsed.verdict,
      raw_result: {
        player_one: { overall_score: parsed.playerOne.overall_score, categories: parsed.playerOne.categories },
        player_two: { overall_score: parsed.playerTwo.overall_score, categories: parsed.playerTwo.categories },
        findings: parsed.findings,
        winner,
      },
    })
    .select("id")
    .single();

  if (error) throw new Error(`Could not save battle: ${error.message}`);

  const { profile: updated, newAchievements } = await recordActivity({
    profileId: profile.id,
    type: "battle",
    score: parsed.playerOne.overall_score,
    categoryScores: parsed.playerOne.categories,
    roast: parsed.playerOne.roast,
    improvements: [],
    findings: parsed.findings,
    rawResult: {
      opponent: playerTwoName,
      verdict: parsed.verdict,
      player_one_score: parsed.playerOne.overall_score,
      player_two_score: parsed.playerTwo.overall_score,
      winner,
    },
  });

  return {
    result: parsed,
    profile: updated,
    newAchievements,
    battle: {
      id: battleRow.id,
      winner,
      playerOneName,
      playerTwoName,
    },
  };
}
