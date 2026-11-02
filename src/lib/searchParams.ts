import type { ProjectFilters, SortKey } from "@/db/queries";

export type SP = Record<string, string | string[] | undefined>;

const arr = (v: string | string[] | undefined): string[] | undefined => (v === undefined ? undefined : Array.isArray(v) ? v.filter(Boolean) : v ? [v] : undefined);
const str = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v) || undefined;
const num = (v: string | string[] | undefined): number | undefined => {
  const s = str(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

const SORTS: SortKey[] = ["relevance", "score_desc", "score_asc", "newest", "oldest", "name", "complaints", "completion"];

export function parseFilters(sp: SP, fixed: Partial<ProjectFilters> = {}): ProjectFilters {
  const sort = str(sp.sort) as SortKey | undefined;
  return {
    q: str(sp.q)?.slice(0, 120),
    state: fixed.state ?? str(sp.state),
    district: str(sp.district),
    status: arr(sp.status),
    type: arr(sp.type),
    band: arr(sp.band),
    minScore: num(sp.min),
    maxScore: num(sp.max),
    overdue: str(sp.overdue) === "1",
    hasComplaints: str(sp.complaints) === "1",
    sort: sort && SORTS.includes(sort) ? sort : undefined,
    page: Math.max(1, num(sp.page) ?? 1),
    ...fixed,
  };
}

export function toSearchParams(sp: SP): URLSearchParams {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) v.forEach((x) => x && out.append(k, x));
    else if (v) out.set(k, v);
  }
  return out;
}

export function describeFilters(f: ProjectFilters): string[] {
  const bits: string[] = [];
  if (f.district) bits.push(f.district);
  if (f.status?.length) bits.push(f.status.join("/"));
  if (f.type?.length) bits.push(f.type.join("/"));
  if (f.band?.length) bits.push(`${f.band.join("/")} score`);
  if (f.overdue) bits.push("overdue");
  if (f.hasComplaints) bits.push("with complaints");
  return bits;
}
