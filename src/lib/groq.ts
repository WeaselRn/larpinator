import Groq from "groq-sdk";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import type { z } from "zod";
import { AiValidationError } from "./ai-schemas";
import { imageTranscriptionPrompt } from "./prompts";

export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";
export const DEFAULT_GROQ_VISION_MODEL = "";

let client: Groq | null = null;

export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY ?? process.env.GROQ);
}

function getClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY ?? process.env.GROQ;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing. Add it to .env (server-side only).");
  }
  if (!client) client = new Groq({ apiKey });
  return client;
}

export function groqModel(): string {
  return process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;
}

export function groqVisionModel(): string {
  return process.env.GROQ_VISION_MODEL || DEFAULT_GROQ_VISION_MODEL;
}

export function isVisionConfigured(): boolean {
  return Boolean(groqVisionModel());
}

function stripFences(content: string): string {
  const trimmed = content.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

function describeGroqError(err: unknown): string {
  if (err && typeof err === "object" && "status" in err) {
    const typed = err as { status?: number; error?: { message?: string }; message?: string };
    const status = typed.status;
    const detail = (typed.error?.message ?? typed.message ?? "").slice(0, 300);
    if (status === 401) return "AI provider rejected the API key (401). Check GROQ_API_KEY.";
    if (status === 429) return "AI provider rate limit hit (429). Wait a moment and try again.";
    if (status && status >= 500) return "AI provider is having a moment. Try again shortly.";
    return `AI provider error (${status ?? "unknown"})${detail ? `: ${detail}` : ""}.`;
  }
  if (err instanceof Error) return err.message;
  return "AI provider error.";
}

function isRateLimitError(err: unknown): boolean {
  if (!err || typeof err !== "object" || !("status" in err)) return false;
  const typed = err as { status?: number; error?: { message?: string }; message?: string };
  if (typed.status === 429) return true;
  const message = `${typed.error?.message ?? ""} ${typed.message ?? ""}`;
  return /rate limit|tokens per minute|tpm|too large|reduce your message/i.test(message);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calls Groq and validates the response against a zod schema. Retries once
 * with a repair instruction when the JSON is malformed, and waits briefly
 * once when the provider rate-limits the request. Throws AiValidationError if
 * the model never produces valid output — callers must treat that as a
 * failure and save nothing.
 */
export async function requestStructuredJson<S extends z.ZodTypeAny>(options: {
  system: string;
  user: string;
  schema: S;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}): Promise<z.infer<S>> {
  const model = options.model ?? groqModel();
  const baseMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: options.system },
    { role: "user", content: options.user },
  ];

  let validationRetries = 0;
  let rateLimitRetries = 0;

  while (true) {
    let completion;
    try {
      completion = await getClient().chat.completions.create({
        model,
        messages:
          validationRetries === 0
            ? baseMessages
            : [
                ...baseMessages,
                {
                  role: "user",
                  content:
                    "Your previous output was not valid JSON matching the required shape. Respond again with ONLY the valid JSON object, no markdown fences, no commentary.",
                },
              ],
        temperature: options.temperature ?? 0.85,
        max_tokens: options.maxTokens ?? 2600,
        response_format: { type: "json_object" },
      });
    } catch (err) {
      if (isRateLimitError(err) && rateLimitRetries < 1) {
        rateLimitRetries++;
        await sleep(6000);
        continue;
      }
      throw new Error(describeGroqError(err));
    }

    const content = completion.choices[0]?.message?.content;
    if (content) {
      try {
        const json = JSON.parse(stripFences(content));
        const parsed = options.schema.safeParse(json);
        if (parsed.success) return parsed.data;
      } catch {
        // fall through to retry
      }
    }

    validationRetries++;
    if (validationRetries >= 2) {
      throw new AiValidationError();
    }
  }
}

/** Transcribes a resume/CV image via a Groq vision model. Returns "" when no text found. */
export async function transcribeImage(dataUrl: string): Promise<string> {
  const model = groqVisionModel();
  if (!model) {
    throw new Error(
      "Image resume analysis isn't available (no vision model configured on this Groq account). Upload a PDF or paste the text instead.",
    );
  }

  let completion;
  try {
    completion = await getClient().chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: imageTranscriptionPrompt() },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ] as ChatCompletionMessageParam[],
      temperature: 0.2,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    });
  } catch (err) {
    throw new Error(describeGroqError(err));
  }

  const content = completion.choices[0]?.message?.content;
  if (!content) return "";

  try {
    const json = JSON.parse(stripFences(content)) as { text?: string };
    return (json.text ?? "").trim();
  } catch {
    return "";
  }
}
