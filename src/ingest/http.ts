/**
 * Polite HTTP client for state portals: one request at a time per host,
 * configurable delay, retries with backoff, and an honest User-Agent so
 * authorities can see who is reading their public register.
 */
import { setTimeout as sleep } from "node:timers/promises";

export interface HttpOptions {
  delayMs?: number;
  retries?: number;
  timeoutMs?: number;
  headers?: Record<string, string>;
}

const lastRequestAt = new Map<string, number>();

export const USER_AGENT = "ReraScannerBot/1.0 (+https://rerascanner.in/data-sources; public-record indexer; contact hello@rerascanner.in)";

export class HttpError extends Error {
  constructor(
    public status: number,
    public url: string,
    message?: string,
  ) {
    super(message ?? `HTTP ${status} for ${url}`);
  }
}

export async function politeFetch(url: string, init: RequestInit = {}, opts: HttpOptions = {}): Promise<Response> {
  const delay = opts.delayMs ?? Number(process.env.INGEST_DELAY_MS ?? 1500);
  const retries = opts.retries ?? 3;
  const timeoutMs = opts.timeoutMs ?? 30000;
  const host = new URL(url).host;

  for (let attempt = 0; ; attempt++) {
    const since = Date.now() - (lastRequestAt.get(host) ?? 0);
    if (since < delay) await sleep(delay - since);
    lastRequestAt.set(host, Date.now());

    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...init,
        signal: ac.signal,
        headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/json;q=0.9,*/*;q=0.8", ...opts.headers, ...(init.headers as Record<string, string> | undefined) },
      });
      if (res.status === 429 || res.status >= 500) throw new HttpError(res.status, url);
      return res;
    } catch (err) {
      if (attempt >= retries) throw err;
      await sleep(Math.min(30000, 1000 * 2 ** attempt + Math.random() * 500));
    } finally {
      clearTimeout(t);
    }
  }
}

export async function getText(url: string, opts?: HttpOptions): Promise<string> {
  const res = await politeFetch(url, {}, opts);
  if (!res.ok) throw new HttpError(res.status, url);
  return res.text();
}

export async function getJson<T>(url: string, opts?: HttpOptions): Promise<T> {
  const res = await politeFetch(url, { headers: { Accept: "application/json" } }, opts);
  if (!res.ok) throw new HttpError(res.status, url);
  return (await res.json()) as T;
}

export async function postForm(url: string, form: Record<string, string>, opts?: HttpOptions): Promise<string> {
  const body = new URLSearchParams(form).toString();
  const res = await politeFetch(url, { method: "POST", body, headers: { "Content-Type": "application/x-www-form-urlencoded" } }, opts);
  if (!res.ok) throw new HttpError(res.status, url);
  return res.text();
}

export async function postJson<T>(url: string, payload: unknown, opts?: HttpOptions): Promise<T> {
  const res = await politeFetch(url, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json", Accept: "application/json" } }, opts);
  if (!res.ok) throw new HttpError(res.status, url);
  return (await res.json()) as T;
}
