// Minimal key-value store abstraction backing lib/farm/sessions.ts.
//
// In production (Vercel), connect Upstash Redis from the project's Storage
// tab — that injects the REST URL/token env vars this file reads and the
// real Redis-backed Store is used automatically. With no such vars (plain
// `npm run dev`), a small JSON-file-backed store is used instead, so the
// whole feature works locally with zero setup.
//
// This can't be a plain in-memory singleton: `next dev` (Turbopack) runs
// route handlers and page rendering as separate worker processes, so a
// module-level (or even globalThis-level) variable silently ends up as more
// than one instance — a session created via one request handler would be
// invisible from another. All those workers do share the local disk, so a
// file is the simplest thing that's actually correct for dev. This has no
// bearing on the production path, which is real Redis regardless.

export interface Store {
  hGetAll(key: string): Promise<Record<string, string>>;
  hSet(key: string, fields: Record<string, string>): Promise<void>;
  hIncrBy(key: string, field: string, by: number): Promise<number>;
  rPush(key: string, value: string): Promise<void>;
  lRange(key: string): Promise<string[]>;
  zAdd(key: string, score: number, member: string): Promise<void>;
  zRevRange(key: string, count: number): Promise<string[]>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

interface FileState {
  hashes: Record<string, Record<string, string>>;
  lists: Record<string, string[]>;
  zsets: Record<string, Record<string, number>>;
  strings: Record<string, string>;
}

const emptyState = (): FileState => ({ hashes: {}, lists: {}, zsets: {}, strings: {} });

/** Dev-only fallback: read-modify-write a single JSON file per call. Low
 *  volume, single local operator — simplicity wins over any locking. */
class FileStore implements Store {
  constructor(private path: string) {}

  private read(): FileState {
    try {
      return JSON.parse(require("node:fs").readFileSync(this.path, "utf8"));
    } catch {
      return emptyState();
    }
  }
  private write(state: FileState) {
    require("node:fs").writeFileSync(this.path, JSON.stringify(state));
  }

  async hGetAll(key: string) {
    return this.read().hashes[key] ?? {};
  }
  async hSet(key: string, fields: Record<string, string>) {
    const s = this.read();
    s.hashes[key] = { ...s.hashes[key], ...fields };
    this.write(s);
  }
  async hIncrBy(key: string, field: string, by: number) {
    const s = this.read();
    const h = s.hashes[key] ?? {};
    const next = (Number(h[field]) || 0) + by;
    h[field] = String(next);
    s.hashes[key] = h;
    this.write(s);
    return next;
  }
  async rPush(key: string, value: string) {
    const s = this.read();
    s.lists[key] = [...(s.lists[key] ?? []), value];
    this.write(s);
  }
  async lRange(key: string) {
    return this.read().lists[key] ?? [];
  }
  async zAdd(key: string, score: number, member: string) {
    const s = this.read();
    s.zsets[key] = { ...s.zsets[key], [member]: score };
    this.write(s);
  }
  async zRevRange(key: string, count: number) {
    const z = this.read().zsets[key];
    if (!z) return [];
    return Object.entries(z)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([member]) => member);
  }
  async get(key: string) {
    return this.read().strings[key] ?? null;
  }
  async set(key: string, value: string) {
    const s = this.read();
    s.strings[key] = value;
    this.write(s);
  }
  async del(key: string) {
    const s = this.read();
    delete s.strings[key];
    this.write(s);
  }
}

class RedisStore implements Store {
  constructor(private redis: import("@upstash/redis").Redis) {}

  async hGetAll(key: string) {
    const h = await this.redis.hgetall<Record<string, string>>(key);
    return h ?? {};
  }
  async hSet(key: string, fields: Record<string, string>) {
    await this.redis.hset(key, fields);
  }
  async hIncrBy(key: string, field: string, by: number) {
    return this.redis.hincrby(key, field, by);
  }
  async rPush(key: string, value: string) {
    await this.redis.rpush(key, value);
  }
  async lRange(key: string) {
    return this.redis.lrange<string>(key, 0, -1);
  }
  async zAdd(key: string, score: number, member: string) {
    await this.redis.zadd(key, { score, member });
  }
  async zRevRange(key: string, count: number) {
    return this.redis.zrange<string[]>(key, 0, count - 1, { rev: true });
  }
  async get(key: string) {
    return this.redis.get<string>(key);
  }
  async set(key: string, value: string) {
    await this.redis.set(key, value);
  }
  async del(key: string) {
    await this.redis.del(key);
  }
}

let store: Store | null = null;

export function getStore(): Store {
  if (store) return store;

  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    // Lazy require so the SDK never loads when it isn't configured.
    const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis");
    store = new RedisStore(new Redis({ url, token }));
  } else {
    const path = require("node:path").join(process.cwd(), ".plantdoctor-dev-kv.json");
    console.warn(
      `[kv] No Redis env vars found — using a local dev store at ${path}. ` +
        "Connect Upstash Redis from the Vercel Storage tab for production.",
    );
    store = new FileStore(path);
  }
  return store;
}
