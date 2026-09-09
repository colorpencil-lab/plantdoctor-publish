import { NextResponse } from "next/server";
import { analyzeImage, decodeImagePayload } from "@/lib/analyze";
import { isLang } from "@/lib/i18n";
import { getFixtureResult } from "@/lib/fixtures/results";
import type { AnalyzeResponse, AnalyzeErrorResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

interface AnalyzeRequestBody {
  /** Data URL ("data:image/jpeg;base64,....") or a bare base64 string. */
  image?: string;
  mediaType?: string;
  /** UI language — the diagnosis text comes back in this language. */
  lang?: string;
  /** Id of a saved demo fixture — when set, the AI is not called. */
  fixtureId?: string;
}

function jsonError(message: string, status: number) {
  return NextResponse.json<AnalyzeErrorResponse>({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: AnalyzeRequestBody;
  try {
    body = (await request.json()) as AnalyzeRequestBody;
  } catch {
    return jsonError("Request body must be JSON.", 400);
  }

  const lang = isLang(body.lang) ? body.lang : "en";

  // Saved demo fixture — return the reviewed result, skip the AI entirely.
  if (typeof body.fixtureId === "string" && body.fixtureId) {
    const saved = getFixtureResult(body.fixtureId, lang);
    if (!saved) return jsonError("Unknown demo photo.", 404);
    return NextResponse.json<AnalyzeResponse>({
      result: saved,
      demo: true,
      model: null,
      fixture: true,
    });
  }

  if (!body.image || typeof body.image !== "string") {
    return jsonError("No image was provided.", 400);
  }

  const decoded = decodeImagePayload(body.image, body.mediaType);
  if ("error" in decoded) return jsonError(decoded.error, 400);

  const outcome = await analyzeImage(decoded.bytes, decoded.mediaType, lang);
  if (!outcome.ok) return jsonError(outcome.message, outcome.status);

  return NextResponse.json<AnalyzeResponse>({
    result: outcome.result,
    demo: outcome.demo,
    model: outcome.model,
  });
}
