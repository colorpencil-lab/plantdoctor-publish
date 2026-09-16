import { NextResponse } from "next/server";
import { getSession } from "@/lib/farm/sessions";

export const runtime = "nodejs";

export async function GET(_request: Request, ctx: RouteContext<"/api/sessions/[id]">) {
  const { id } = await ctx.params;
  const session = await getSession(id);
  if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });
  return NextResponse.json({ session });
}
