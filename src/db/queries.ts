import { and, asc, desc, eq, gte, inArray, isNotNull, like, lt, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { getClient, getDb } from "./client";
import { complaints, documents, extensions, professionals, projects, promoters, syncRuns, unitMix, type Project, type Promoter } from "./schema";
import type { ScoreResult } from "@/lib/scoring/score";
import { COVERED_STATES } from "@/lib/states";

export const PAGE_SIZE = 24;

export type SortKey = "relevance" | "score_desc" | "score_asc" | "newest" | "oldest" | "name" | "complaints" | "completion";

export interface ProjectFilters {
  q?: string;
  state?: string;
  district?: string;
  status?: string[];
  type?: string[];
  band?: string[];
  minScore?: number;
  maxScore?: number;
  overdue?: boolean; // original completion date passed and not complete
  hasComplaints?: boolean;
  promoterId?: number;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
}

export interface ProjectListItem extends Project {
  promoterName: string;
  promoterSlug: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

function filterClauses(f: ProjectFilters): SQL[] {
  const w: SQL[] = [];
  if (f.state) w.push(eq(projects.stateSlug, f.state));
  if (f.district) w.push(eq(projects.district, f.district));
  if (f.status?.length) w.push(inArray(projects.status, f.status));
  if (f.type?.length) w.push(inArray(projects.type, f.type));
  if (f.band?.length) w.push(inArray(projects.scoreBand, f.band));
  if (f.minScore !== undefined) w.push(gte(projects.scoreTotal, f.minScore));
  if (f.maxScore !== undefined) w.push(lte(projects.scoreTotal, f.maxScore));
  if (f.promoterId) w.push(eq(projects.promoterId, f.promoterId));
  if (f.hasComplaints) w.push(sql`${projects.complaintsTotal} > 0`);
  if (f.overdue) {
    const today = new Date().toISOString().slice(0, 10);
    w.push(
      and(
        isNotNull(projects.originalCompletionDate),
        lt(projects.originalCompletionDate, today),
        sql`${projects.actualCompletionDate} IS NULL`,
        ne(projects.status, "completed"),
      )!,
    );
  }
  return w;
}

function orderFor(sort: SortKey | undefined, hasQuery: boolean): SQL[] {
  switch (sort) {
    case "score_desc":
      return [sql`${projects.scoreTotal} IS NULL`, desc(projects.scoreTotal), asc(projects.name)];
    case "score_asc":
      return [sql`${projects.scoreTotal} IS NULL`, asc(projects.scoreTotal), asc(projects.name)];
    case "newest":
      return [desc(projects.registrationDate)];
    case "oldest":
      return [asc(projects.registrationDate)];
    case "name":
      return [asc(projects.name)];
    case "complaints":
      return [desc(projects.complaintsOpen), desc(projects.complaintsTotal)];
    case "completion":
      return [sql`COALESCE(${projects.revisedCompletionDate}, ${projects.originalCompletionDate}) IS NULL`, asc(sql`COALESCE(${projects.revisedCompletionDate}, ${projects.originalCompletionDate})`)];
    default:
      return hasQuery ? [] : [desc(projects.registrationDate)];
  }
}

/** Build the FTS5 query from free text: every token becomes a prefix match. */
export function ftsQuery(q: string): string {
  const tokens = q
    .replace(/["'()*:^]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 8);
  if (!tokens.length) return "";
  return tokens.map((t) => `"${t}"*`).join(" ");
}

async function matchingIdsForQuery(q: string): Promise<number[] | null> {
  const client = getClient();
  const direct = await client.execute({ sql: `SELECT id FROM projects WHERE UPPER(rera_number) = UPPER(?)`, args: [q.trim()] });
  if (direct.rows.length) return direct.rows.map((r) => Number(r.id));
  const fq = ftsQuery(q);
  if (!fq) return null;
  try {
    const res = await client.execute({ sql: `SELECT project_id FROM projects_fts WHERE projects_fts MATCH ? ORDER BY bm25(projects_fts, 0, 8, 10, 4, 2, 1) LIMIT 2000`, args: [fq] });
    return res.rows.map((r) => Number(r.project_id));
  } catch {
    // Fallback for odd input FTS can't parse
    const res = await client.execute({ sql: `SELECT id FROM projects WHERE name LIKE ? OR rera_number LIKE ? LIMIT 2000`, args: [`%${q}%`, `%${q}%`] });
    return res.rows.map((r) => Number(r.id));
  }
}

export async function listProjects(f: ProjectFilters): Promise<Paginated<ProjectListItem>> {
  const db = getDb();
  const page = Math.max(1, f.page ?? 1);
  const pageSize = Math.min(100, f.pageSize ?? PAGE_SIZE);
  const where = filterClauses(f);
  let rankedIds: number[] | null = null;
  if (f.q?.trim()) {
    rankedIds = await matchingIdsForQuery(f.q);
    if (rankedIds && rankedIds.length === 0) return { items: [], total: 0, page, pageSize, pages: 0 };
    if (rankedIds) where.push(inArray(projects.id, rankedIds));
  }
  const whereSql = where.length ? and(...where) : undefined;

  const totalRow = await db.select({ n: sql<number>`count(*)` }).from(projects).where(whereSql).get();
  const total = totalRow?.n ?? 0;

  let order = orderFor(f.sort, !!rankedIds);
  if (rankedIds && (!f.sort || f.sort === "relevance")) {
    // Preserve FTS rank order
    const cases = sql.join(rankedIds.slice(0, 500).map((id, i) => sql`WHEN ${id} THEN ${i}`), sql` `);
    order = [sql`CASE ${projects.id} ${cases} ELSE 9999 END`];
  }

  const rows = await db
    .select({ p: projects, promoterName: promoters.name, promoterSlug: promoters.slug })
    .from(projects)
    .innerJoin(promoters, eq(promoters.id, projects.promoterId))
    .where(whereSql)
    .orderBy(...order)
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .all();

  return {
    items: rows.map((r) => ({ ...r.p, promoterName: r.promoterName, promoterSlug: r.promoterSlug })),
    total,
    page,
    pageSize,
    pages: Math.ceil(total / pageSize),
  };
}

export interface FacetCounts {
  status: Array<{ value: string; n: number }>;
  type: Array<{ value: string; n: number }>;
  band: Array<{ value: string; n: number }>;
  district: Array<{ value: string; n: number }>;
}

/** Facet counts for the current state/query (ignores the facet's own filter, like a store sidebar). */
export async function facetCounts(f: ProjectFilters): Promise<FacetCounts> {
  const db = getDb();
  const base = { ...f, status: undefined, type: undefined, band: undefined, district: undefined, page: 1 };
  const where = filterClauses(base);
  if (f.q?.trim()) {
    const ids = await matchingIdsForQuery(f.q);
    if (ids) where.push(ids.length ? inArray(projects.id, ids) : sql`0`);
  }
  const whereSql = where.length ? and(...where) : undefined;
  const group = async (col: typeof projects.status | typeof projects.type | typeof projects.scoreBand | typeof projects.district) =>
    (
      await db
        .select({ value: col, n: sql<number>`count(*)` })
        .from(projects)
        .where(whereSql)
        .groupBy(col)
        .orderBy(desc(sql`count(*)`))
        .all()
    ).filter((r) => r.value != null) as Array<{ value: string; n: number }>;
  return {
    status: await group(projects.status),
    type: await group(projects.type),
    band: await group(projects.scoreBand),
    district: f.state ? await group(projects.district) : [],
  };
}

export interface ProjectDetail {
  project: Project;
  promoter: Promoter;
  score: ScoreResult | null;
  complaints: (typeof complaints.$inferSelect)[];
  extensions: (typeof extensions.$inferSelect)[];
  unitMix: (typeof unitMix.$inferSelect)[];
  documents: (typeof documents.$inferSelect)[];
  professionals: (typeof professionals.$inferSelect)[];
}

export async function getProjectBySlug(slug: string): Promise<ProjectDetail | null> {
  const db = getDb();
  const p = await db.select().from(projects).where(eq(projects.slug, slug)).get();
  if (!p) return null;
  return hydrateProject(p);
}

export async function getProjectByReraNumber(reraNumber: string): Promise<Project | null> {
  const db = getDb();
  const p = await db
    .select()
    .from(projects)
    .where(sql`UPPER(${projects.reraNumber}) = UPPER(${reraNumber.trim()})`)
    .get();
  return p ?? null;
}

export async function getProjectsByIds(ids: number[]): Promise<ProjectDetail[]> {
  const db = getDb();
  if (!ids.length) return [];
  const rows = await db.select().from(projects).where(inArray(projects.id, ids)).all();
  const out = await Promise.all(rows.map(hydrateProject));
  return ids.map((id) => out.find((o) => o.project.id === id)).filter(Boolean) as ProjectDetail[];
}

async function hydrateProject(p: Project): Promise<ProjectDetail> {
  const db = getDb();
  const [promoter, c, e, u, d, pr] = await Promise.all([
    db.select().from(promoters).where(eq(promoters.id, p.promoterId)).get(),
    db.select().from(complaints).where(eq(complaints.projectId, p.id)).orderBy(desc(complaints.filedOn)).all(),
    db.select().from(extensions).where(eq(extensions.projectId, p.id)).orderBy(asc(extensions.newDate)).all(),
    db.select().from(unitMix).where(eq(unitMix.projectId, p.id)).all(),
    db.select().from(documents).where(eq(documents.projectId, p.id)).all(),
    db.select().from(professionals).where(eq(professionals.projectId, p.id)).all(),
  ]);
  return {
    project: p,
    promoter: promoter!,
    score: (p.scoreBreakdown as ScoreResult | null) ?? null,
    complaints: c,
    extensions: e,
    unitMix: u,
    documents: d,
    professionals: pr,
  };
}

export async function similarProjects(p: Project, limit = 6): Promise<ProjectListItem[]> {
  const db = getDb();
  const rows = await db
    .select({ p: projects, promoterName: promoters.name, promoterSlug: promoters.slug })
    .from(projects)
    .innerJoin(promoters, eq(promoters.id, projects.promoterId))
    .where(and(eq(projects.stateSlug, p.stateSlug), eq(projects.district, p.district), ne(projects.id, p.id), eq(projects.type, p.type)))
    .orderBy(sql`${projects.scoreTotal} IS NULL`, desc(projects.scoreTotal))
    .limit(limit)
    .all();
  return rows.map((r) => ({ ...r.p, promoterName: r.promoterName, promoterSlug: r.promoterSlug }));
}

export async function getPromoterBySlug(slug: string): Promise<{ promoter: Promoter; projects: ProjectListItem[] } | null> {
  const db = getDb();
  const pr = await db.select().from(promoters).where(eq(promoters.slug, slug)).get();
  if (!pr) return null;
  const list = await listProjects({ promoterId: pr.id, sort: "newest", pageSize: 100 });
  return { promoter: pr, projects: list.items };
}

export interface PromoterListItem extends Promoter {
  avgScore: number | null;
}

export async function listPromoters(opts: { state?: string; q?: string; sort?: "projects" | "track" | "name" | "complaints"; page?: number; pageSize?: number }): Promise<Paginated<PromoterListItem>> {
  const db = getDb();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, opts.pageSize ?? 30);
  const where: SQL[] = [];
  if (opts.state) where.push(eq(promoters.stateSlug, opts.state));
  if (opts.q?.trim()) where.push(like(promoters.name, `%${opts.q.trim()}%`));
  const whereSql = where.length ? and(...where) : undefined;
  const totalRow = await db.select({ n: sql<number>`count(*)` }).from(promoters).where(whereSql).get();
  const order =
    opts.sort === "track"
      ? [sql`${promoters.trackScore} IS NULL`, desc(promoters.trackScore)]
      : opts.sort === "name"
        ? [asc(promoters.name)]
        : opts.sort === "complaints"
          ? [desc(promoters.openComplaints)]
          : [desc(promoters.projectCount), asc(promoters.name)];
  const rows = await db
    .select({
      pr: promoters,
      avgScore: sql<number | null>`(SELECT ROUND(AVG(score_total)) FROM projects WHERE projects.promoter_id = ${promoters.id})`,
    })
    .from(promoters)
    .where(whereSql)
    .orderBy(...order)
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .all();
  const total = totalRow?.n ?? 0;
  return { items: rows.map((r) => ({ ...r.pr, avgScore: r.avgScore })), total, page, pageSize, pages: Math.ceil(total / pageSize) };
}

export interface StateStats {
  stateSlug: string;
  total: number;
  registered: number;
  completed: number;
  lapsed: number;
  overdue: number;
  withComplaints: number;
  openComplaints: number;
  avgScore: number | null;
  strong: number;
  watch: number;
  caution: number;
  unrated: number;
  promoters: number;
  lastSynced: string | null;
}

export async function stateStats(stateSlug?: string): Promise<StateStats[]> {
  const client = getClient();
  const today = new Date().toISOString().slice(0, 10);
  const res = await client.execute({
    sql: `
      SELECT
        state_slug,
        COUNT(*) AS total,
        SUM(status = 'registered') AS registered,
        SUM(status = 'completed') AS completed,
        SUM(status IN ('lapsed','revoked','expired')) AS lapsed,
        SUM(original_completion_date IS NOT NULL AND original_completion_date < ? AND actual_completion_date IS NULL AND status <> 'completed') AS overdue,
        SUM(complaints_total > 0) AS with_complaints,
        SUM(complaints_open) AS open_complaints,
        ROUND(AVG(score_total)) AS avg_score,
        SUM(score_band = 'strong') AS strong,
        SUM(score_band = 'watch') AS watch,
        SUM(score_band = 'caution') AS caution,
        SUM(score_band = 'unrated') AS unrated,
        COUNT(DISTINCT promoter_id) AS promoters,
        MAX(source_fetched_at) AS last_synced
      FROM projects
      ${stateSlug ? "WHERE state_slug = ?" : ""}
      GROUP BY state_slug
      ORDER BY total DESC`,
    args: stateSlug ? [today, stateSlug] : [today],
  });
  return res.rows.map((r) => ({
    stateSlug: String(r.state_slug),
    total: Number(r.total),
    registered: Number(r.registered),
    completed: Number(r.completed),
    lapsed: Number(r.lapsed),
    overdue: Number(r.overdue),
    withComplaints: Number(r.with_complaints),
    openComplaints: Number(r.open_complaints),
    avgScore: r.avg_score == null ? null : Number(r.avg_score),
    strong: Number(r.strong),
    watch: Number(r.watch),
    caution: Number(r.caution),
    unrated: Number(r.unrated),
    promoters: Number(r.promoters),
    lastSynced: r.last_synced ? String(r.last_synced) : null,
  }));
}

export async function globalStats() {
  const all = await stateStats();
  const sum = (k: keyof StateStats) => all.reduce((a, s) => a + (Number(s[k]) || 0), 0);
  return {
    projects: sum("total"),
    states: all.length,
    coveredStates: COVERED_STATES.length,
    promoters: sum("promoters"),
    overdue: sum("overdue"),
    openComplaints: sum("openComplaints"),
    completed: sum("completed"),
    lastSynced: all.map((s) => s.lastSynced).filter(Boolean).sort().at(-1) ?? null,
  };
}

export async function districtStats(stateSlug: string) {
  const client = getClient();
  const today = new Date().toISOString().slice(0, 10);
  const res = await client.execute({
    sql: `SELECT district, COUNT(*) n, ROUND(AVG(score_total)) avg_score,
          SUM(original_completion_date < ? AND actual_completion_date IS NULL AND status <> 'completed') overdue
          FROM projects WHERE state_slug = ? GROUP BY district ORDER BY n DESC`,
    args: [today, stateSlug],
  });
  return res.rows.map((r) => ({ district: String(r.district), n: Number(r.n), avgScore: r.avg_score == null ? null : Number(r.avg_score), overdue: Number(r.overdue) }));
}

export async function topPromoters(stateSlug: string, limit = 6): Promise<PromoterListItem[]> {
  return (await listPromoters({ state: stateSlug, sort: "projects", pageSize: limit })).items;
}

export async function recentSyncRuns(limit = 20) {
  const db = getDb();
  return db.select().from(syncRuns).orderBy(desc(syncRuns.startedAt)).limit(limit).all();
}

export async function allProjectSlugs(): Promise<Array<{ slug: string; updatedAt: string }>> {
  const db = getDb();
  return db.select({ slug: projects.slug, updatedAt: projects.updatedAt }).from(projects).all();
}

export async function allPromoterSlugs(): Promise<Array<{ slug: string; updatedAt: string }>> {
  const db = getDb();
  return db.select({ slug: promoters.slug, updatedAt: promoters.updatedAt }).from(promoters).all();
}

export async function suggest(q: string, limit = 8): Promise<Array<{ kind: "project" | "promoter"; label: string; sub: string; href: string }>> {
  const client = getClient();
  const fq = ftsQuery(q);
  if (!fq) return [];
  const out: Array<{ kind: "project" | "promoter"; label: string; sub: string; href: string }> = [];
  try {
    const res = await client.execute({
      sql: `SELECT p.name, p.rera_number, p.district, p.slug FROM projects_fts f JOIN projects p ON p.id = f.project_id
            WHERE projects_fts MATCH ? ORDER BY bm25(projects_fts, 0, 8, 10, 4, 2, 1) LIMIT ?`,
      args: [fq, limit],
    });
    for (const r of res.rows) out.push({ kind: "project", label: String(r.name), sub: `${r.rera_number} · ${r.district}`, href: `/projects/${r.slug}` });
  } catch {
    /* ignore */
  }
  const pr = await client.execute({ sql: `SELECT name, slug, state_slug, project_count FROM promoters WHERE name LIKE ? ORDER BY project_count DESC LIMIT 3`, args: [`%${q}%`] });
  for (const r of pr.rows) out.push({ kind: "promoter", label: String(r.name), sub: `${r.project_count} projects`, href: `/promoters/${r.slug}` });
  void or;
  return out;
}
