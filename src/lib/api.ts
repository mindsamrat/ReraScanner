import type { Project } from "@/db/schema";
import type { ScoreResult } from "@/lib/scoring/score";
import { getState } from "@/lib/states";
import { SITE } from "@/lib/site";

/** Stable public representation of a project for /api/v1. */
export function projectToApi(p: Project & { promoterName?: string; promoterSlug?: string }, promoter?: { name: string; slug: string }, full = false) {
  const score = p.scoreBreakdown as ScoreResult | null;
  const s = getState(p.stateSlug);
  return {
    id: p.id,
    slug: p.slug,
    url: `${SITE.url}/projects/${p.slug}`,
    reraNumber: p.reraNumber,
    name: p.name,
    type: p.type,
    status: p.status,
    state: p.stateSlug,
    authority: s?.authority,
    district: p.district,
    locality: p.locality,
    pincode: p.pincode,
    location: p.lat && p.lng ? { lat: p.lat, lng: p.lng } : null,
    promoter: { name: promoter?.name ?? p.promoterName ?? "", slug: promoter?.slug ?? p.promoterSlug ?? "" },
    dates: {
      registration: p.registrationDate,
      originalCompletion: p.originalCompletionDate,
      revisedCompletion: p.revisedCompletionDate,
      actualCompletion: p.actualCompletionDate,
    },
    extensions: p.extensionCount,
    inventory: { totalUnits: p.totalUnits, unitsBooked: p.unitsBooked, buildings: p.totalBuildings, landAreaSqm: p.landAreaSqm },
    carpetArea: { registeredSqm: p.carpetAreaRegisteredSqm, advertisedSqm: p.carpetAreaAdvertisedSqm },
    complaints: { total: p.complaintsTotal, open: p.complaintsOpen, appealsOpen: p.appealsOpen },
    compliance: { qprFiled: p.qprFiled, qprDue: p.qprDue, lastQpr: p.lastQprDate, escrowBank: p.escrowBank, encumbrance: p.encumbrance, litigation: p.litigation },
    score: {
      total: p.scoreTotal,
      band: p.scoreBand,
      confidence: p.scoreConfidence,
      headline: score?.headline ?? null,
      ...(full && score ? { components: score.components.map((c) => ({ key: c.key, label: c.label, weight: c.weight, score: c.score, covered: c.covered, evidence: c.evidence, flags: c.flags })) } : {}),
      scoredAt: p.scoredAt,
    },
    source: { url: p.sourceUrl, fetchedAt: p.sourceFetchedAt, portal: s?.portalUrl },
  };
}

export function apiHeaders(extra: Record<string, string> = {}) {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    "Access-Control-Allow-Origin": "*",
    "X-Data-Mode": SITE.dataMode,
    ...extra,
  };
}

export function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), { ...init, headers: { ...apiHeaders(), ...(init.headers as Record<string, string> | undefined) } });
}

export function error(status: number, message: string) {
  return json({ error: { status, message } }, { status });
}
