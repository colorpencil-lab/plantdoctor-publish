import { NextResponse } from "next/server";
import { analyzeImage, decodeImagePayload } from "@/lib/analyze";
import { isLang } from "@/lib/i18n";
import { checkFromAnalysis } from "@/lib/farm/ingest";
import type { PlantCheck } from "@/lib/farm/model";

// Device endpoint. The field camera unit POSTs one plant photo per call:
//
//   { "unit": "R1C4", "image": "data:image/jpeg;base64,...", "lang": "zh" }
//
// The system analyses it and returns whether the plant is healthy, plus a
// dashboard row when an illness is detected. Persistence is not wired yet —
// this evaluates and returns; storing a scan session is the next step.

export const runtime = "nodejs";
export const maxDuration = 120;

interface IngestBody {
  unit?: string;
  row?: number;
  col?: number;
  image?: string;
  mediaType?: string;
  lang?: string;
}

interface IngestResponse {
  unit: string;
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

  const decoded = decodeImagePayload(body.image, body.mediaType);
  if ("error" in decoded) return jsonError(decoded.error, 400);

  const lang = isLang(body.lang) ? body.lang : "en";
  const outcome = await analyzeImage(decoded.bytes, decoded.mediaType, lang);
  if (!outcome.ok) return jsonError(outcome.message, outcome.status);

  const checkedAt = new Date().toISOString().slice(0, 19); // local-ish, no zone
  const check = checkFromAnalysis({ unit, row, col, checkedAt }, outcome.result);

  return NextResponse.json<IngestResponse>({
    unit,
    healthy: check === null,
    check,
  });
}
