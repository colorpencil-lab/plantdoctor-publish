import { NextResponse } from "next/server";
import { createSession, listRecentSessions, SessionError } from "@/lib/farm/sessions";

export const runtime = "nodejs";

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

interface CreateBody {
  startedAt?: string;
}

export async function GET() {
  const sessions = await listRecentSessions(10);
  return NextResponse.json({ sessions });
}

export async function POST(request: Request) {
  let body: CreateBody = {};
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    // empty body is fine — startedAt defaults to now
  }

  try {
    const session = await createSession(
      typeof body.startedAt === "string" && body.startedAt ? body.startedAt : undefined,
    );
    return NextResponse.json({ session }, { status: 201 });
  } catch (e) {
    if (e instanceof SessionError) return jsonError(e.message, e.status);
    throw e;
  }
}
