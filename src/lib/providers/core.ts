// Socle commun des adaptateurs : timeout, retries exponentiels, cache, fixtures, mode dégradé.
import type { ProviderStatus, SourceMeta } from "@/lib/types";

export type ProviderMode = "live" | "fixtures" | "record";

export interface FetchOptions {
  timeoutMs?: number;
  retries?: number;
  ttlMs?: number;
  /** passer par le proxy serveur (/api/proxy) quand disponible (API sans CORS) */
  viaProxy?: boolean;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly url: string,
    public readonly status?: number,
  ) {
    super(message);
  }
}

// ----------------------------------------------------------------- configuration
let modeOverride: ProviderMode | undefined;
export function setProviderMode(mode: ProviderMode | undefined) {
  modeOverride = mode;
}
export function providerMode(): ProviderMode {
  if (modeOverride) return modeOverride;
  const env = (typeof process !== "undefined" && process.env.NEXT_PUBLIC_PROVIDER_MODE) || "";
  if (env === "fixtures" || env === "record") return env;
  if (typeof window !== "undefined") {
    try {
      const forced = window.localStorage.getItem("dp:providerMode");
      if (forced === "fixtures") return "fixtures";
    } catch {
      /* stockage indisponible */
    }
  }
  return "live";
}

export function proxyBase(): string | null {
  const p = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_PROXY : undefined;
  if (p) return p;
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEPLOY_TARGET === "server") {
    return `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/proxy`;
  }
  return null;
}

// ----------------------------------------------------------------- fixtures
type FixtureMap = Record<string, unknown>;
let fixtures: FixtureMap | null = null;
const recorded: FixtureMap = {};

export function normalizeUrl(url: string): string {
  return url.replace(/\s+/g, "");
}

async function loadFixtures(): Promise<FixtureMap> {
  if (!fixtures) {
    const mod = (await import("./__fixtures__/responses.json")) as { default: FixtureMap };
    fixtures = mod.default ?? (mod as unknown as FixtureMap);
  }
  return fixtures;
}
export function injectFixtures(map: FixtureMap) {
  fixtures = { ...(fixtures ?? {}), ...map };
}
export function getRecorded(): FixtureMap {
  return recorded;
}

// ----------------------------------------------------------------- cache
interface CacheEntry {
  at: number;
  ttl: number;
  data: unknown;
}
const memCache = new Map<string, CacheEntry>();
const LS_PREFIX = "dp:cache:";

function cacheGet(key: string): unknown | undefined {
  const now = Date.now();
  const m = memCache.get(key);
  if (m && now - m.at < m.ttl) return m.data;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(LS_PREFIX + key);
      if (raw) {
        const e = JSON.parse(raw) as CacheEntry;
        if (now - e.at < e.ttl) {
          memCache.set(key, e);
          return e.data;
        }
        window.localStorage.removeItem(LS_PREFIX + key);
      }
    } catch {
      /* ignore */
    }
  }
  return undefined;
}
function cacheSet(key: string, data: unknown, ttl: number) {
  const e: CacheEntry = { at: Date.now(), ttl, data };
  memCache.set(key, e);
  if (typeof window !== "undefined") {
    try {
      const s = JSON.stringify(e);
      if (s.length < 400_000) window.localStorage.setItem(LS_PREFIX + key, s);
    } catch {
      /* quota : on garde le cache mémoire */
    }
  }
}
export function clearProviderCache() {
  memCache.clear();
  if (typeof window !== "undefined") {
    try {
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith(LS_PREFIX))
        .forEach((k) => window.localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ----------------------------------------------------------------- fetch JSON
export async function fetchJson<T = unknown>(
  provider: string,
  url: string,
  opts: FetchOptions = {},
): Promise<{ data: T; meta: SourceMeta }> {
  const { timeoutMs = 15_000, retries = 2, ttlMs = 24 * 3600_000, viaProxy = false } = opts;
  const key = normalizeUrl(url);
  const mode = providerMode();
  const fetchedAt = new Date().toISOString();

  if (mode === "fixtures") {
    const fx = await loadFixtures();
    if (key in fx) {
      return { data: fx[key] as T, meta: { provider, url, fetchedAt, status: "ok", fromFixture: true } };
    }
    throw new ProviderError(`Fixture absente pour ${key}`, provider, url);
  }

  const cached = cacheGet(key);
  if (cached !== undefined) {
    return { data: cached as T, meta: { provider, url, fetchedAt, status: "ok", fromCache: true } };
  }

  let target = url;
  if (viaProxy) {
    const base = proxyBase();
    if (!base) throw new ProviderError("API sans CORS et aucun proxy serveur configuré", provider, url);
    target = `${base}?url=${encodeURIComponent(url)}`;
  }

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(target, { signal: ctrl.signal, headers: { Accept: "application/json" } });
      clearTimeout(timer);
      if (!res.ok) {
        // 4xx (hors 429) : inutile de réessayer
        if (res.status < 500 && res.status !== 429) {
          throw new ProviderError(`HTTP ${res.status}`, provider, url, res.status);
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as T;
      cacheSet(key, data, ttlMs);
      if (mode === "record") recorded[key] = data;
      return { data, meta: { provider, url, fetchedAt, status: "ok" } };
    } catch (e) {
      clearTimeout(timer);
      lastErr = e;
      if (e instanceof ProviderError) break;
      if (attempt < retries) await sleep(400 * 2 ** attempt);
    }
  }
  const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  throw new ProviderError(msg.includes("abort") ? "Délai dépassé" : msg, provider, url);
}

export function degradedMeta(provider: string, message: string, url?: string, status: ProviderStatus = "degraded"): SourceMeta {
  return { provider, url, fetchedAt: new Date().toISOString(), status, message };
}

/** arrondi des coordonnées pour des URL déterministes (cache / fixtures) : 6 décimales ≈ 10 cm */
export const r6 = (n: number) => Math.round(n * 1e6) / 1e6;

/** corrige le double encodage latin-1 → UTF-8 rencontré dans certains champs GPU */
export function fixMojibake(s: string | null | undefined): string {
  if (!s) return "";
  if (!/Ã|Â/.test(s)) return s;
  try {
    const bytes = Uint8Array.from([...s].map((c) => c.charCodeAt(0) & 0xff));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return s;
  }
}
