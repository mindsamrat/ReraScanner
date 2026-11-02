import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { getClient, getDb } from "@/db/client";
import { migrate, rebuildSearchIndex } from "@/db/migrate";
import { complaints, documents, extensions, professionals, projects, promoters, syncRuns, unitMix } from "@/db/schema";
import type { NormalizedProject, PortalAdapter, ListOptions } from "./types";
import { slugify } from "@/lib/slug";

export interface UpsertStats {
  fetched: number;
  inserted: number;
  updated: number;
  unchanged: number;
  errors: number;
}

export function contentHash(p: NormalizedProject): string {
  // Exclude volatile fetch timestamp so re-fetching identical data is a no-op.
  const { sourceFetchedAt: _ignored, ...rest } = p;
  void _ignored;
  return createHash("sha1").update(JSON.stringify(rest)).digest("hex");
}

export function projectSlug(p: Pick<NormalizedProject, "name" | "reraNumber" | "district">): string {
  return slugify(`${p.name}-${p.district}-${p.reraNumber}`);
}

export function promoterSlug(name: string, stateSlug: string): string {
  return slugify(`${name}-${stateSlug}`);
}

async function upsertPromoter(db: Db, p: NormalizedProject, now: string): Promise<number> {
  const slug = promoterSlug(p.promoter.name, p.stateSlug);
  const existing = await db.select({ id: promoters.id }).from(promoters).where(eq(promoters.slug, slug)).get();
  if (existing) {
    await db
      .update(promoters)
      .set({
        name: p.promoter.name,
        type: p.promoter.type ?? null,
        address: p.promoter.address ?? null,
        website: p.promoter.website ?? null,
        cin: p.promoter.cin ?? null,
        pan: p.promoter.panMasked ?? null,
        updatedAt: now,
      })
      .where(eq(promoters.id, existing.id));
    return existing.id;
  }
  const inserted = await db
    .insert(promoters)
    .values({
      slug,
      name: p.promoter.name,
      type: p.promoter.type ?? null,
      stateSlug: p.stateSlug,
      address: p.promoter.address ?? null,
      website: p.promoter.website ?? null,
      cin: p.promoter.cin ?? null,
      pan: p.promoter.panMasked ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: promoters.id })
    .get();
  return inserted.id;
}

async function replaceChildren(db: Db, projectId: number, p: NormalizedProject) {
  await db.delete(complaints).where(eq(complaints.projectId, projectId));
  await db.delete(extensions).where(eq(extensions.projectId, projectId));
  await db.delete(unitMix).where(eq(unitMix.projectId, projectId));
  await db.delete(documents).where(eq(documents.projectId, projectId));
  await db.delete(professionals).where(eq(professionals.projectId, projectId));

  if (p.complaints?.length) {
    await db.insert(complaints).values(
      p.complaints.map((c) => ({
        projectId,
        caseNumber: c.caseNumber,
        filedOn: c.filedOn ?? null,
        status: c.status,
        category: c.category ?? null,
        summary: c.summary ?? null,
        orderDate: c.orderDate ?? null,
        orderSummary: c.orderSummary ?? null,
        sourceUrl: c.sourceUrl ?? null,
      })),
    );
  }
  if (p.extensions?.length) {
    await db.insert(extensions).values(
      p.extensions.map((e) => ({
        projectId,
        kind: e.kind,
        previousDate: e.previousDate ?? null,
        newDate: e.newDate,
        grantedOn: e.grantedOn ?? null,
        reason: e.reason ?? null,
      })),
    );
  }
  if (p.unitMix?.length) {
    await db.insert(unitMix).values(
      p.unitMix.map((u) => ({
        projectId,
        unitType: u.unitType,
        count: u.count,
        booked: u.booked ?? 0,
        carpetAreaSqm: u.carpetAreaSqm ?? null,
        advertisedCarpetAreaSqm: u.advertisedCarpetAreaSqm ?? null,
      })),
    );
  }
  if (p.documents?.length) {
    await db.insert(documents).values(
      p.documents.map((d) => ({ projectId, name: d.name, kind: d.kind, url: d.url, publishedOn: d.publishedOn ?? null })),
    );
  }
  if (p.professionals?.length) {
    await db.insert(professionals).values(
      p.professionals.map((pr) => ({ projectId, role: pr.role, name: pr.name, registrationNumber: pr.registrationNumber ?? null })),
    );
  }
}

/** Insert or update one normalised project. Returns what happened. */
export async function upsertProject(db: Db, p: NormalizedProject): Promise<"inserted" | "updated" | "unchanged"> {
  const now = new Date().toISOString();
  const hash = contentHash(p);
  const existing = await db
    .select({ id: projects.id, contentHash: projects.contentHash })
    .from(projects)
    .where(eq(projects.reraNumber, p.reraNumber))
    .get();

  if (existing && existing.contentHash === hash) {
    await db.update(projects).set({ sourceFetchedAt: p.sourceFetchedAt }).where(eq(projects.id, existing.id));
    return "unchanged";
  }

  const promoterId = await upsertPromoter(db, p, now);
  const openComplaints = (p.complaints ?? []).filter((c) => c.status === "open" || c.status === "appeal").length;
  const row = {
    slug: projectSlug(p),
    reraNumber: p.reraNumber,
    stateSlug: p.stateSlug,
    name: p.name,
    type: p.type,
    status: p.status,
    district: p.district,
    taluka: p.taluka ?? null,
    locality: p.locality ?? null,
    pincode: p.pincode ?? null,
    lat: p.lat ?? null,
    lng: p.lng ?? null,
    promoterId,
    registrationDate: p.registrationDate ?? null,
    originalCompletionDate: p.originalCompletionDate ?? null,
    revisedCompletionDate: p.revisedCompletionDate ?? null,
    actualCompletionDate: p.actualCompletionDate ?? null,
    extensionCount: p.extensionCount ?? p.extensions?.filter((e) => e.kind !== "revision").length ?? 0,
    landAreaSqm: p.landAreaSqm ?? null,
    totalBuildings: p.totalBuildings ?? null,
    totalUnits: p.totalUnits ?? null,
    unitsBooked: p.unitsBooked ?? null,
    carpetAreaRegisteredSqm: p.carpetAreaRegisteredSqm ?? null,
    carpetAreaAdvertisedSqm: p.carpetAreaAdvertisedSqm ?? null,
    complaintsTotal: p.complaints?.length ?? 0,
    complaintsOpen: openComplaints,
    appealsOpen: p.appealsOpen ?? (p.complaints ?? []).filter((c) => c.status === "appeal").length,
    qprFiled: p.qprFiled ?? 0,
    qprDue: p.qprDue ?? 0,
    lastQprDate: p.lastQprDate ?? null,
    escrowBank: p.escrowBank ?? null,
    encumbrance: p.encumbrance ?? false,
    litigation: p.litigation ?? false,
    description: p.description ?? null,
    sourceUrl: p.sourceUrl,
    sourceFetchedAt: p.sourceFetchedAt,
    contentHash: hash,
    updatedAt: now,
  };

  let projectId: number;
  if (existing) {
    await db.update(projects).set(row).where(eq(projects.id, existing.id));
    projectId = existing.id;
  } else {
    const ins = await db
      .insert(projects)
      .values({ ...row, createdAt: now })
      .returning({ id: projects.id })
      .get();
    projectId = ins.id;
  }
  await replaceChildren(db, projectId, p);
  return existing ? "updated" : "inserted";
}

export interface RunOptions extends ListOptions {
  dryRun?: boolean;
  log?: (msg: string) => void;
}

/** Run one adapter end to end and record the run in sync_runs. */
export async function runAdapter(adapter: PortalAdapter, opts: RunOptions = {}): Promise<UpsertStats> {
  const log = opts.log ?? (() => {});
  const client = getClient();
  await migrate(client);
  const db = getDb();
  const stats: UpsertStats = { fetched: 0, inserted: 0, updated: 0, unchanged: 0, errors: 0 };
  const startedAt = new Date().toISOString();
  const run = opts.dryRun
    ? null
    : await db
        .insert(syncRuns)
        .values({ stateSlug: adapter.stateSlug, adapter: adapter.id, startedAt, status: "running" })
        .returning({ id: syncRuns.id })
        .get();

  try {
    for await (const ref of adapter.list(opts)) {
      stats.fetched++;
      try {
        const record = await adapter.detail(ref);
        if (opts.dryRun) {
          log(`[dry-run] ${record.reraNumber} ${record.name}`);
          continue;
        }
        const outcome = await upsertProject(db, record);
        stats[outcome]++;
        if (stats.fetched % 50 === 0) log(`${adapter.id}: ${stats.fetched} fetched, ${stats.inserted} new, ${stats.updated} updated`);
      } catch (err) {
        stats.errors++;
        log(`${adapter.id}: failed ${ref.reraNumber}: ${(err as Error).message}`);
      }
      if (opts.limit && stats.fetched >= opts.limit) break;
    }
    if (!opts.dryRun) {
      await rebuildSearchIndex(client);
      await db
        .update(syncRuns)
        .set({ ...stats, finishedAt: new Date().toISOString(), status: stats.errors ? "partial" : "ok" })
        .where(eq(syncRuns.id, run!.id));
    }
  } catch (err) {
    if (!opts.dryRun) {
      await db
        .update(syncRuns)
        .set({ ...stats, finishedAt: new Date().toISOString(), status: "failed", message: (err as Error).message })
        .where(eq(syncRuns.id, run!.id));
    }
    throw err;
  }
  return stats;
}

export async function countProjects(db: Db): Promise<number> {
  const r = await db.select({ n: sql<number>`count(*)` }).from(projects).get();
  return r?.n ?? 0;
}
