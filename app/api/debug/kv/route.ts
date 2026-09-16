import { NextResponse } from "next/server";
import { getStore } from "@/lib/kv";

// TEMPORARY diagnostic endpoint — delete once the session-persistence issue
// on Vercel is resolved. Reveals no secrets: only whether the Redis env vars
// are present and which host they point to (not the token), plus a same-
// invocation write/read round-trip to isolate where persistence breaks.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  const info: Record<string, unknown> = {
    hasUrl: Boolean(url),
    hasToken: Boolean(token),
    urlHost: url ? safeHost(url) : null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    region: process.env.VERCEL_REGION ?? null,
  };

  try {
    const store = getStore();
    const testKey = `debug:ping:${Date.now()}`;
    await store.set(testKey, "hello");
    const readBackSameInvocation = await store.get(testKey);
    info.sameInvocationRoundTrip = { wrote: "hello", readBack: readBackSameInvocation };
    await store.del(testKey);
  } catch (e) {
    info.error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(info);
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return "unparseable";
  }
}
