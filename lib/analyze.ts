import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, USER_PROMPT } from "./prompt";
import { mockAnalyze } from "./mockEngine";
import { AI_LANG_INSTRUCTION, type Lang } from "./i18n";
import type { AnalysisResult } from "./types";

/** The vision prompt, plus a "write your answer in this language" line when needed. */
function userPrompt(lang: Lang): string {
  const extra = AI_LANG_INSTRUCTION[lang];
  return extra ? `${USER_PROMPT}\n\n${extra}` : USER_PROMPT;
}

// Shared analysis core. Used by the browser route (/api/analyze). Given raw
// image bytes, returns either a well-formed AnalysisResult or a typed error
// with an HTTP status.

/** Read an env var with surrounding whitespace / stray CR (Windows .env) removed. */
const env = (name: string): string => (process.env[name] ?? "").trim();

const ANTHROPIC_MODEL = env("PLANT_AI_MODEL") || "claude-opus-5";
const GEMINI_MODEL = env("GEMINI_MODEL") || "gemini-3.6-flash";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const MIN_IMAGE_BYTES = 100;

type Provider = "anthropic" | "gemini" | "mock";

/**
 * Which engine to use. `PLANT_AI_PROVIDER` forces one; otherwise pick whatever
 * key is present (Gemini's free tier wins if both are set).
 */
function pickProvider(): Provider {
  const forced = env("PLANT_AI_PROVIDER").toLowerCase() || "auto";
  if (forced === "anthropic" || forced === "gemini" || forced === "mock") {
    return forced;
  }
  if (env("GEMINI_API_KEY")) return "gemini";
  if (env("ANTHROPIC_API_KEY")) return "anthropic";
  return "mock";
}

export const ALLOWED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
export type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number];

export type AnalyzeOutcome =
  | { ok: true; result: AnalysisResult; demo: boolean; model: string | null }
  | { ok: false; status: number; message: string };

/** Normalise a Content-Type / extension hint to a media type Claude accepts. */
export function normalizeMediaType(raw?: string | null): AllowedMediaType | null {
  if (!raw) return null;
  let base = raw.split(";")[0].trim().toLowerCase();
  if (base === "image/jpg") base = "image/jpeg";
  return (ALLOWED_MEDIA_TYPES as readonly string[]).includes(base)
    ? (base as AllowedMediaType)
    : null;
}

/** Guess a media type from the first bytes of the buffer (JPEG/PNG/GIF/WebP). */
export function sniffMediaType(bytes: Buffer): AllowedMediaType | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e) return "image/png";
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "image/gif";
  if (
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  return null;
}

/**
 * Split a data URL ("data:image/jpeg;base64,...") or a bare base64 string into
 * a supported media type + raw bytes. Shared by /api/analyze and /api/ingest.
 */
export function decodeImagePayload(
  image: string,
  fallbackMediaType?: string,
): { mediaType: AllowedMediaType; bytes: Buffer } | { error: string } {
  let mediaHint = fallbackMediaType;
  let payload = image;

  const match = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(image);
  if (match) {
    mediaHint = match[1];
    payload = match[3];
  }

  payload = payload.trim().replace(/\s/g, "");
  if (!payload) return { error: "The image payload was empty." };

  let bytes: Buffer;
  try {
    bytes = Buffer.from(payload, "base64");
  } catch {
    return { error: "The image could not be decoded." };
  }

  const mediaType = normalizeMediaType(mediaHint) ?? sniffMediaType(bytes);
  if (!mediaType) {
    return {
      error:
        "Unsupported image type. Please upload a JPEG, PNG, WebP, or GIF photo.",
    };
  }
  return { mediaType, bytes };
}

/** Pull the first JSON object out of the model's reply, tolerating stray text. */
function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(trimmed);
  const candidate = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new Error("Model did not return valid JSON.");
  }
}

const CONFIDENCE = ["low", "medium", "high"];
const asEnum = (value: unknown, allowed: string[], fallback: string) =>
  typeof value === "string" && allowed.includes(value) ? value : fallback;
const asString = (value: unknown) => (typeof value === "string" ? value : "");
const asArray = (value: unknown) => (Array.isArray(value) ? value : []);

/** Coerce the parsed model output into a well-formed AnalysisResult. */
export function normalize(raw: unknown): AnalysisResult {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const id = (obj.identification ?? {}) as Record<string, unknown>;
  const health = (obj.health ?? {}) as Record<string, unknown>;
  const care = (obj.care ?? {}) as Record<string, unknown>;

  const status = asEnum(
    health.status,
    ["healthy", "minor_issues", "serious_issues", "unknown"],
    "unknown",
  ) as AnalysisResult["health"]["status"];

  // Recovery outlook: trust the model's value, else derive one from the status.
  const derivedRecovery: AnalysisResult["health"]["recovery"] =
    status === "healthy"
      ? "not_applicable"
      : status === "serious_issues"
        ? "unlikely"
        : status === "minor_issues"
          ? "likely"
          : "uncertain";

  return {
    isPlant: obj.isPlant !== false,
    identification: {
      commonName: asString(id.commonName) || "Unknown plant",
      scientificName: asString(id.scientificName),
      confidence: asEnum(id.confidence, CONFIDENCE, "low") as AnalysisResult["identification"]["confidence"],
      notes: asString(id.notes),
    },
    health: {
      status,
      summary: asString(health.summary),
      recovery: asEnum(
        health.recovery,
        ["likely", "uncertain", "unlikely", "not_applicable"],
        derivedRecovery,
      ) as AnalysisResult["health"]["recovery"],
    },
    issues: asArray(obj.issues).map((entry) => {
      const i = (entry ?? {}) as Record<string, unknown>;
      return {
        name: asString(i.name) || "Unnamed issue",
        type: asEnum(
          i.type,
          ["disease", "pest", "deficiency", "environmental", "other"],
          "other",
        ) as AnalysisResult["issues"][number]["type"],
        severity: asEnum(i.severity, ["low", "medium", "high"], "low") as AnalysisResult["issues"][number]["severity"],
        confidence: asEnum(i.confidence, CONFIDENCE, "low") as AnalysisResult["issues"][number]["confidence"],
        description: asString(i.description),
        evidence: asString(i.evidence),
      };
    }),
    treatment: asArray(obj.treatment).map((entry) => {
      const t = (entry ?? {}) as Record<string, unknown>;
      return {
        title: asString(t.title) || "Step",
        detail: asString(t.detail),
        urgency: asEnum(t.urgency, ["now", "soon", "ongoing"], "soon") as AnalysisResult["treatment"][number]["urgency"],
      };
    }),
    prevention: asArray(obj.prevention).map(asString).filter(Boolean),
    care: {
      light: asString(care.light),
      water: asString(care.water),
      soil: asString(care.soil),
      humidity: asString(care.humidity),
      temperature: asString(care.temperature),
    },
    disclaimer:
      asString(obj.disclaimer) ||
      "This is an automated visual estimate, not a substitute for local expert diagnosis.",
  };
}

export async function analyzeImage(
  bytes: Buffer,
  mediaType: AllowedMediaType,
  lang: Lang = "en",
): Promise<AnalyzeOutcome> {
  if (bytes.length < MIN_IMAGE_BYTES) {
    return { ok: false, status: 400, message: "Image payload looks empty or truncated." };
  }
  if (bytes.length > MAX_IMAGE_BYTES) {
    return { ok: false, status: 413, message: "Image is too large (8 MB limit)." };
  }

  const provider = pickProvider();

  if (provider === "mock") {
    const seed = bytes.length + bytes[0] + bytes[bytes.length - 1];
    return { ok: true, result: mockAnalyze(seed, lang), demo: true, model: null };
  }

  if (provider === "gemini") {
    if (!env("GEMINI_API_KEY")) {
      return {
        ok: false,
        status: 500,
        message: "PLANT_AI_PROVIDER=gemini but GEMINI_API_KEY is not set.",
      };
    }
    return analyzeWithGemini(bytes, mediaType, lang);
  }

  if (!env("ANTHROPIC_API_KEY")) {
    return {
      ok: false,
      status: 500,
      message: "PLANT_AI_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set.",
    };
  }
  return analyzeWithAnthropic(bytes, mediaType, lang);
}

// --- Google Gemini (via the official @google/genai SDK) -----------------
//
// The SDK owns the transport + auth details, so it works regardless of the
// API-key format Google issues (older `AIza…` keys and newer `AQ.…` keys
// alike). We don't hand-build the HTTP request.

async function analyzeWithGemini(
  bytes: Buffer,
  mediaType: AllowedMediaType,
  lang: Lang,
): Promise<AnalyzeOutcome> {
  const key = env("GEMINI_API_KEY");
  const model = GEMINI_MODEL;

  // Lazy import so the SDK never loads on the Anthropic / mock paths.
  const { GoogleGenAI, ApiError } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: key });

  const config: Record<string, unknown> = {
    systemInstruction: SYSTEM_PROMPT,
    temperature: 0.2,
    topP: 0.9,
    // Headroom so hidden "thinking" tokens don't crowd out the JSON answer.
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
    abortSignal: AbortSignal.timeout(90_000),
    httpOptions: { timeout: 90_000 },
  };
  // Flash models spend output budget on hidden "thinking" by default, which can
  // truncate the JSON. 2.5 Flash lets you switch it off with a zero budget.
  if (/2\.5-flash/.test(model)) {
    config.thinkingConfig = { thinkingBudget: 0 };
  }

  const request = {
    model,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: mediaType, data: bytes.toString("base64") } },
          { text: userPrompt(lang) },
        ],
      },
    ],
    config,
  };

  // "This model is currently experiencing high demand" (503 / UNAVAILABLE) is
  // usually a brief spike, so retry a couple of times before giving up.
  const BACKOFF_MS = [1000, 3000];

  let response;
  for (let attempt = 0; ; attempt++) {
    try {
      response = await ai.models.generateContent(request);
      break;
    } catch (e) {
      if (e instanceof ApiError) {
        const status = e.status ?? 0;
        const detail = e.message || "";
        const low = detail.toLowerCase();
        if (
          low.includes("api key not valid") ||
          low.includes("api_key_invalid") ||
          low.includes("invalid authentication") ||
          low.includes("permission denied") ||
          status === 401 ||
          status === 403
        ) {
          return {
            ok: false,
            status: 401,
            message:
              "Gemini rejected GEMINI_API_KEY. Confirm the key is active in Google AI Studio (https://aistudio.google.com/apikey) and the Generative Language API is enabled.",
          };
        }
        if (status === 429) {
          return { ok: false, status: 429, message: "Gemini rate limit / quota hit. Wait a minute and retry." };
        }
        if ((status === 503 || status === 500) && attempt < BACKOFF_MS.length) {
          await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt]));
          continue;
        }
        if (status === 503) {
          return {
            ok: false,
            status: 503,
            message: "Gemini is overloaded right now. Please try again in a moment.",
          };
        }
        return {
          ok: false,
          status: 502,
          message: `Gemini API error (${status || "unknown"})${detail ? `: ${detail}` : ""}.`,
        };
      }
      if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) {
        return { ok: false, status: 504, message: "Gemini timed out. Please try again." };
      }
      console.error("gemini SDK error:", e);
      return { ok: false, status: 502, message: "Could not reach the Gemini API." };
    }
  }

  const blockReason = response.promptFeedback?.blockReason;
  if (blockReason) {
    return {
      ok: false,
      status: 422,
      message: `Gemini blocked this image (${blockReason}). Try a clearer plant photo.`,
    };
  }

  const finishReason = response.candidates?.[0]?.finishReason;
  const text = (response.text ?? "").trim();

  if (!text) {
    if (finishReason === "SAFETY" || finishReason === "PROHIBITED_CONTENT") {
      return { ok: false, status: 422, message: "Gemini declined this image for safety reasons. Try another photo." };
    }
    if (finishReason === "MAX_TOKENS") {
      return { ok: false, status: 502, message: "Gemini's response was cut off. Please try again." };
    }
    return { ok: false, status: 502, message: "Gemini returned an empty response." };
  }

  try {
    return { ok: true, result: normalize(extractJson(text)), demo: false, model };
  } catch {
    return { ok: false, status: 502, message: "Could not parse Gemini's analysis as JSON. Please try again." };
  }
}

// --- Anthropic Claude ---------------------------------------------------

async function analyzeWithAnthropic(
  bytes: Buffer,
  mediaType: AllowedMediaType,
  lang: Lang,
): Promise<AnalyzeOutcome> {
  const client = new Anthropic({ apiKey: env("ANTHROPIC_API_KEY") });
  const MODEL = ANTHROPIC_MODEL;

  try {
    const response = await client.messages.create({
      model: MODEL,
      // Headroom for adaptive thinking (on by default on Opus 5) plus the JSON.
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: bytes.toString("base64"),
              },
            },
            { type: "text", text: userPrompt(lang) },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return {
        ok: false,
        status: 422,
        message: "The AI declined to analyse this image. Try a clearer plant photo.",
      };
    }

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    if (!text) {
      return { ok: false, status: 502, message: "The AI returned an empty response." };
    }

    return {
      ok: true,
      result: normalize(extractJson(text)),
      demo: false,
      model: response.model ?? MODEL,
    };
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      // Combine the SDK message with any nested response-body message — a
      // low-credit failure sometimes arrives as a bare 401 whose text is
      // only in the body.
      const bodyMsg =
        typeof error.error === "object" && error.error
          ? String(
              (error.error as { error?: { message?: string }; message?: string })
                ?.error?.message ??
                (error.error as { message?: string })?.message ??
                "",
            )
          : "";
      const msg = `${error.message ?? ""} ${bodyMsg}`.toLowerCase();

      if (
        msg.includes("credit balance") ||
        msg.includes("plans & billing") ||
        msg.includes("billing") ||
        msg.includes("purchase credits")
      ) {
        return {
          ok: false,
          status: 402,
          message:
            "The Anthropic account is out of credit. Add credits in the Anthropic Console (Plans & Billing), then retry.",
        };
      }
      if (error instanceof Anthropic.AuthenticationError) {
        return {
          ok: false,
          status: 401,
          message:
            "The Anthropic API rejected the request (401). Check that ANTHROPIC_API_KEY is a current, active key and that the account has credit.",
        };
      }
      if (error instanceof Anthropic.RateLimitError) {
        return { ok: false, status: 429, message: "The AI service is rate-limiting right now. Please try again shortly." };
      }
      if (error instanceof Anthropic.BadRequestError) {
        return { ok: false, status: 400, message: `The AI rejected the request: ${error.message}` };
      }
      return { ok: false, status: 502, message: `AI service error (${error.status ?? "unknown"}). Please try again.` };
    }
    if (
      error instanceof SyntaxError ||
      (error instanceof Error && error.message.includes("JSON"))
    ) {
      return { ok: false, status: 502, message: "Could not read the AI's analysis. Please try again." };
    }
    console.error("analyzeImage error:", error);
    return { ok: false, status: 500, message: "Something went wrong while analysing the photo." };
  }
}
