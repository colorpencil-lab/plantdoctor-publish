import { NextResponse } from "next/server";
import { endSession, SessionError } from "@/lib/farm/sessions";

export const runtime = "nodejs";

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

interface EndBody {
  finishedAt?: string;
}

export async function POST(request: Request, ctx: RouteContext<"/api/sessions/[id]/end">) {
  const { id } = await ctx.params;

  let body: EndBody = {};
  try {
    body = (await request.json()) as EndBody;
  } catch {
    // empty body is fine — finishedAt defaults to now
  }

  try {
    const session = await endSession(
      id,
      typeof body.finishedAt === "string" && body.finishedAt ? body.finishedAt : undefined,
    );
    return NextResponse.json({ session });
  } catch (e) {
    if (e instanceof SessionError) return jsonError(e.message, e.status);
    throw e;
  }
}
