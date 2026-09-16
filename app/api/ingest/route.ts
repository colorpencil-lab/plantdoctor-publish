import { NextResponse } from "next/server";
import { analyzeImage, decodeImagePayload } from "@/lib/analyze";
import { isLang } from "@/lib/i18n";
import { checkFromAnalysis, attachPhoto } from "@/lib/farm/ingest";
import { addPhotoOutcome, resolveCurrentSessionId, SessionError } from "@/lib/farm/sessions";
import { nowLocalIso, type PlantCheck } from "@/lib/farm/model";

// Device endpoint. The field camera unit POSTs one plant photo per call:
//
//   { "unit": "R1C4", "image": "data:image/jpeg;base64,...", "lang": "zh" }
//
// The system analyses it, records the outcome against the current
// in-progress scan session (or an explicit "sessionId" in the body, if the
// device ever needs to target one directly), and returns whether the plant
// is healthy plus a dashboard row when an illness is detected.

export const runtime = "nodejs";
export const maxDuration = 120;

interface IngestBody {
  unit?: string;
  row?: number;
  col?: number;
  image?: string;
  mediaType?: string;
  lang?: string;
  sessionId?: string;
}

interface IngestResponse {
  unit: string;
  sessionId: string;
  healthy: boolean;
  check: PlantCheck | null;
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

/** "R12C4" -> { row: 12, col: 4 }. */
function parseUnit(unit: string): { row: number; col: number } | null {
  const m = /^R(\d+)C(\d+)$/i.exec(unit.trim());
  return m ? { row: Number(m[1]), col: Number(m[2]) } : null;
}

export async function POST(request: Request) {
  let body: IngestBody;
  try {
    body = (await request.json()) as IngestBody;
  } catch {
    return jsonError("Request body must be JSON.", 400);
  }

  const unit = typeof body.unit === "string" ? body.unit.trim() : "";
  if (!unit) return jsonError("A unit id (e.g. \"R1C4\") is required.", 400);

  const parsed = parseUnit(unit);
  const row = Number.isFinite(body.row) ? Number(body.row) : parsed?.row;
  const col = Number.isFinite(body.col) ? Number(body.col) : parsed?.col;
  if (row === undefined || col === undefined) {
    return jsonError(
      "Could not determine row/col — send unit as \"R<row>C<col>\" or pass row and col.",
      400,
    );
  }

  if (!body.image || typeof body.image !== "string") {
    return jsonError("No image was provided.", 400);
  }

  const sessionId =
    (typeof body.sessionId === "string" && body.sessionId) ||
    (await resolveCurrentSessionId());
  if (!sessionId) {
    return jsonError("No in-progress session — start one first.", 400);
  }

  const decoded = decodeImagePayload(body.image, body.mediaType);
  if ("error" in decoded) return jsonError(decoded.error, 400);

  const lang = isLang(body.lang) ? body.lang : "en";
  const outcome = await analyzeImage(decoded.bytes, decoded.mediaType, lang);
  if (!outcome.ok) return jsonError(outcome.message, outcome.status);

  const checkedAt = nowLocalIso();
  let check = checkFromAnalysis({ unit, row, col, checkedAt }, outcome.result);
  if (check) {
    check = await attachPhoto(check, decoded.bytes, decoded.mediaType, sessionId);
  }

  try {
    await addPhotoOutcome(sessionId, check);
  } catch (e) {
    if (e instanceof SessionError) return jsonError(e.message, e.status);
    throw e;
  }

  return NextResponse.json<IngestResponse>({
    unit,
    sessionId,
    healthy: check === null,
    check,
  });
}
