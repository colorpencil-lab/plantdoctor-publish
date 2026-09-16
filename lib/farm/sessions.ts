import { getStore } from "../kv";
import { nowLocalIso, type PlantCheck, type ScanSession, type SessionSummary } from "./model";

// Persistence for scan sessions, backed by lib/kv.ts (Redis in production, an
// in-memory store in local dev). Only one session may be in progress at a
// time app-wide — matches how a single device or operator actually works,
// and lets /api/ingest resolve "the active session" without a device having
// to know a session id.

export class SessionError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

const metaKey = (id: string) => `session:${id}:meta`;
const checksKey = (id: string) => `session:${id}:checks`;
const INDEX_KEY = "sessions:index";
const CURRENT_KEY = "sessions:current";

function toSummary(id: string, meta: Record<string, string>): SessionSummary {
  return {
    id,
    startedAt: meta.startedAt,
    finishedAt: meta.finishedAt || undefined,
    plantsScanned: Number(meta.plantsScanned) || 0,
    plantsHealthy: Number(meta.plantsHealthy) || 0,
    plantsFlagged: Number(meta.plantsFlagged) || 0,
  };
}

export async function createSession(startedAt?: string): Promise<ScanSession> {
  const store = getStore();
  const current = await store.get(CURRENT_KEY);
  if (current) {
    const currentMeta = await store.hGetAll(metaKey(current));
    const stillActive = Boolean(currentMeta.startedAt) && !currentMeta.finishedAt;
    if (stillActive) {
      throw new SessionError(
        "A session is already in progress — end it before starting a new one.",
        409,
      );
    }
    // The "current session" pointer refers to a session that no longer
    // exists (or was already finished without clearing it) — a stale lock
    // rather than a real one. Clear it instead of blocking forever.
    await store.del(CURRENT_KEY);
  }

  const id = crypto.randomUUID();
  const started = startedAt || nowLocalIso();

  await store.hSet(metaKey(id), {
    startedAt: started,
    plantsScanned: "0",
    plantsHealthy: "0",
    plantsFlagged: "0",
    nextUnitSeq: "0",
  });
  await store.zAdd(INDEX_KEY, Date.parse(started) || Date.now(), id);
  await store.set(CURRENT_KEY, id);

  return { id, startedAt: started, plantsScanned: 0, plantsHealthy: 0, plantsFlagged: 0, checks: [] };
}

export async function endSession(id: string, finishedAt?: string): Promise<ScanSession> {
  const store = getStore();
  const meta = await store.hGetAll(metaKey(id));
  if (!meta.startedAt) throw new SessionError("Session not found.", 404);
  if (meta.finishedAt) throw new SessionError("Session is already finished.", 409);

  const finished = finishedAt || nowLocalIso();
  if (Date.parse(finished) <= Date.parse(meta.startedAt)) {
    throw new SessionError("End time must be after the start time.", 422);
  }
  await store.hSet(metaKey(id), { finishedAt: finished });
  const current = await store.get(CURRENT_KEY);
  if (current === id) await store.del(CURRENT_KEY);

  return getSession(id) as Promise<ScanSession>;
}

export async function getSession(id: string): Promise<ScanSession | null> {
  const store = getStore();
  const meta = await store.hGetAll(metaKey(id));
  if (!meta.startedAt) return null;

  const raw = await store.lRange(checksKey(id));
  // Defensive: a Store should always hand back raw strings (see lib/kv.ts),
  // but tolerate an already-parsed value rather than crash on it.
  const checks: PlantCheck[] = raw.map((s) =>
    typeof s === "string" ? (JSON.parse(s) as PlantCheck) : (s as PlantCheck),
  );

  return { ...toSummary(id, meta), checks };
}

export async function listRecentSessions(limit = 10): Promise<SessionSummary[]> {
  const store = getStore();
  const ids = await store.zRevRange(INDEX_KEY, limit);
  const summaries = await Promise.all(
    ids.map(async (id) => toSummary(id, await store.hGetAll(metaKey(id)))),
  );
  return summaries.filter((s) => s.startedAt);
}

export async function resolveCurrentSessionId(): Promise<string | null> {
  return getStore().get(CURRENT_KEY);
}

export interface PhotoTotals {
  plantsScanned: number;
  plantsHealthy: number;
  plantsFlagged: number;
}

export async function addPhotoOutcome(
  sessionId: string,
  check: PlantCheck | null,
): Promise<PhotoTotals> {
  const store = getStore();
  const meta = await store.hGetAll(metaKey(sessionId));
  if (!meta.startedAt) throw new SessionError("Session not found.", 404);
  if (meta.finishedAt) throw new SessionError("This session has already ended.", 409);

  const plantsScanned = await store.hIncrBy(metaKey(sessionId), "plantsScanned", 1);
  let plantsHealthy = Number(meta.plantsHealthy) || 0;
  let plantsFlagged = Number(meta.plantsFlagged) || 0;
  if (check) {
    plantsFlagged = await store.hIncrBy(metaKey(sessionId), "plantsFlagged", 1);
    await store.rPush(checksKey(sessionId), JSON.stringify(check));
  } else {
    plantsHealthy = await store.hIncrBy(metaKey(sessionId), "plantsHealthy", 1);
  }

  return { plantsScanned, plantsHealthy, plantsFlagged };
}

/** Per-session sequence for browser-uploaded photos, which have no device grid position. */
export async function nextUnitLabel(sessionId: string): Promise<string> {
  const n = await getStore().hIncrBy(metaKey(sessionId), "nextUnitSeq", 1);
  return `P${n}`;
}
