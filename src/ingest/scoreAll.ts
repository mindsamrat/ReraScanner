import { eq, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { projects, promoters } from "@/db/schema";
import { computeScore, monthsBetween } from "@/lib/scoring/score";

/**
 * Recomputes promoter aggregates and then every project's score snapshot.
 * Run after each ingestion. Cheap enough to be a full pass at our scale.
 */
export async function scoreAll(db: Db, log: (m: string) => void = () => {}): Promise<{ projects: number; promoters: number }> {
  const today = new Date();

  // 1. Promoter aggregates from their projects.
  const allProjects = await db.select().from(projects).all();
  const byPromoter = new Map<number, typeof allProjects>();
  for (const p of allProjects) {
    const arr = byPromoter.get(p.promoterId) ?? [];
    arr.push(p);
    byPromoter.set(p.promoterId, arr);
  }

  const promoterAgg = new Map<number, { projectCount: number; completedCount: number; delayedCount: number; onTimeCount: number; openComplaints: number; trackScore: number | null }>();

  for (const [promoterId, list] of byPromoter) {
    let completed = 0,
      delayed = 0,
      onTime = 0,
      open = 0;
    for (const p of list) {
      open += p.complaintsOpen;
      const original = p.originalCompletionDate ? new Date(p.originalCompletionDate) : null;
      if (p.actualCompletionDate) {
        completed++;
        const actual = new Date(p.actualCompletionDate);
        if (original && monthsBetween(original, actual) > 0.5) delayed++;
        else onTime++;
      } else if (["lapsed", "revoked", "expired"].includes(p.status)) {
        delayed++;
      } else if (original && monthsBetween(original, today) > 6) {
        // Running more than six months past the original date counts as a delay on the record.
        delayed++;
      }
    }
    const concluded = completed + delayed;
    let trackScore: number | null = null;
    if (concluded >= 2) {
      trackScore = Math.round(40 + (onTime / concluded) * 60 - Math.min(25, (open / list.length) * 10));
      trackScore = Math.max(0, Math.min(100, trackScore));
    }
    promoterAgg.set(promoterId, { projectCount: list.length, completedCount: completed, delayedCount: delayed, onTimeCount: onTime, openComplaints: open, trackScore });
    await db
      .update(promoters)
      .set({ projectCount: list.length, completedCount: completed, delayedCount: delayed, onTimeCount: onTime, openComplaints: open, trackScore })
      .where(eq(promoters.id, promoterId));
  }
  log(`aggregated ${promoterAgg.size} promoters`);

  // 2. Score each project.
  const scoredAt = today.toISOString();
  let n = 0;
  for (const p of allProjects) {
    const agg = promoterAgg.get(p.promoterId)!;
    const result = computeScore({
      status: p.status,
      registrationDate: p.registrationDate,
      originalCompletionDate: p.originalCompletionDate,
      revisedCompletionDate: p.revisedCompletionDate,
      actualCompletionDate: p.actualCompletionDate,
      extensionCount: p.extensionCount,
      totalUnits: p.totalUnits,
      complaintsTotal: p.complaintsTotal,
      complaintsOpen: p.complaintsOpen,
      appealsOpen: p.appealsOpen,
      qprFiled: p.qprFiled,
      qprDue: p.qprDue,
      encumbrance: p.encumbrance,
      litigation: p.litigation,
      carpetAreaRegisteredSqm: p.carpetAreaRegisteredSqm,
      carpetAreaAdvertisedSqm: p.carpetAreaAdvertisedSqm,
      promoter: agg,
      today,
    });
    await db
      .update(projects)
      .set({
        scoreTotal: result.total,
        scoreBand: result.band,
        scoreConfidence: result.confidence,
        scoreBreakdown: result,
        scoredAt,
      })
      .where(eq(projects.id, p.id));
    n++;
    if (n % 200 === 0) log(`scored ${n}/${allProjects.length}`);
  }
  log(`scored ${n} projects`);
  void sql;
  return { projects: n, promoters: promoterAgg.size };
}
