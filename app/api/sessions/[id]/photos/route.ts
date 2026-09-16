import { NextResponse } from "next/server";
import { analyzeImage, decodeImagePayload } from "@/lib/analyze";
import { isLang } from "@/lib/i18n";
import { checkFromAnalysis } from "@/lib/farm/ingest";
import { addPhotoOutcome, getSession, nextUnitLabel, SessionError } from "@/lib/farm/sessions";
import { nowLocalIso } from "@/lib/farm/model";
import type { PlantCheck } from "@/lib/farm/model";

// Browser-facing endpoint for manually uploading a photo into an in-progress
// session (a human operating the app, standing in for the physical device).
// Same analysis core as /api/analyze and /api/ingest.

export const runtime = "nodejs";
export const maxDuration = 120;

interface PhotoBody {
  image?: string;
  mediaType?: string;
  lang?: string;
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request, ctx: RouteContext<"/api/sessions/[id]/photos">) {
  const { id } = await ctx.params;

  const session = await getSession(id);
  if (!session) return jsonError("Session not found.", 404);
  if (session.finishedAt) return jsonError("This session has already ended.", 409);

  let body: PhotoBody;
  try {
    body = (await request.json()) as PhotoBody;
  } catch {
    return jsonError("Request body must be JSON.", 400);
  }

  if (!body.image || typeof body.image !== "string") {
    return jsonError("No image was provided.", 400);
  }

  const decoded = decodeImagePayload(body.image, body.mediaType);
  if ("error" in decoded) return jsonError(decoded.error, 400);

  const lang = isLang(body.lang) ? body.lang : "en";
  const outcome = await analyzeImage(decoded.bytes, decoded.mediaType, lang);
  if (!outcome.ok) return jsonError(outcome.message, outcome.status);

  const unit = await nextUnitLabel(id);
  const checkedAt = nowLocalIso();
  const check: PlantCheck | null = checkFromAnalysis(
    { unit, row: 0, col: Number(unit.slice(1)), checkedAt },
    outcome.result,
  );

  try {
    const totals = await addPhotoOutcome(id, check);
    return NextResponse.json({ unit, healthy: check === null, check, totals });
  } catch (e) {
    if (e instanceof SessionError) return jsonError(e.message, e.status);
    throw e;
  }
}
