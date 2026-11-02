/**
 * GujRERA — https://gujrera.gujarat.gov.in
 *
 * How the public register is exposed
 * ----------------------------------
 * The portal is an Angular single-page application. Everything the browser
 * shows is fetched from a JSON REST backend, which makes Gujarat the cleanest
 * state to ingest: no HTML parsing, no CAPTCHA on public views, unit-wise
 * booking data included.
 *
 * The endpoint paths are not documented by the authority and have changed
 * between portal releases, so they are configurable via environment variables.
 * To (re)discover them: open the project list in a browser, open DevTools →
 * Network → filter XHR, and copy the request that returns the list and the
 * one that returns a single project. Set:
 *
 *   GUJRERA_LIST_URL    e.g. https://gujrera.gujarat.gov.in/api/project/list?district={district}&page={page}&size={size}
 *   GUJRERA_DETAIL_URL  e.g. https://gujrera.gujarat.gov.in/api/project/{id}
 *
 * `{district}`, `{page}`, `{size}` and `{id}` are substituted by the adapter.
 * Field names are matched loosely (several candidate keys per field) because
 * the backend uses inconsistent camelCase/snake_case across versions.
 */
import { getJson } from "../http";
import { normalizeStatus, normalizeType, parseAreaSqm, parseDate, parseNumber } from "../parse";
import type { ListOptions, NormalizedProject, PortalAdapter, ProjectRef } from "../types";

type AnyRec = Record<string, unknown>;

const LIST_URL = process.env.GUJRERA_LIST_URL ?? "https://gujrera.gujarat.gov.in/api/project/list?district={district}&page={page}&size={size}";
const DETAIL_URL = process.env.GUJRERA_DETAIL_URL ?? "https://gujrera.gujarat.gov.in/api/project/{id}";

/** Return the first present key, case-insensitively, tolerating nesting one level deep. */
function g(rec: AnyRec | undefined, ...keys: string[]): unknown {
  if (!rec) return undefined;
  const lower = Object.fromEntries(Object.entries(rec).map(([k, v]) => [k.toLowerCase(), v]));
  for (const k of keys) {
    const v = lower[k.toLowerCase()];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  for (const v of Object.values(rec)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const inner = g(v as AnyRec, ...keys);
      if (inner !== undefined) return inner;
    }
  }
  return undefined;
}
const s = (v: unknown): string | null => (v === undefined || v === null ? null : String(v));

export const gujaratAdapter: PortalAdapter = {
  id: "gujrera",
  stateSlug: "gujarat",
  capabilities: { listing: true, detail: true, complaints: true, unitInventory: true, quarterlyUpdates: true, incremental: true, needsBrowser: false },
  notes: "Angular SPA with a JSON REST backend; endpoints captured from the browser's network tab and set via GUJRERA_LIST_URL / GUJRERA_DETAIL_URL.",

  async *list(opts: ListOptions = {}) {
    const size = 100;
    let page = 0;
    let yielded = 0;
    for (;;) {
      const url = LIST_URL.replace("{district}", encodeURIComponent(opts.district ?? "")).replace("{page}", String(page)).replace("{size}", String(size));
      const data = await getJson<AnyRec | AnyRec[]>(url);
      const items = (Array.isArray(data) ? data : ((g(data, "content", "data", "items", "projects", "result") as AnyRec[]) ?? [])) as AnyRec[];
      if (!items.length) return;
      for (const it of items) {
        const reraNumber = s(g(it, "regNo", "registrationNo", "projectRegNo", "rera_no", "projectRegistrationNumber"));
        const id = s(g(it, "projectId", "id", "project_id"));
        if (!reraNumber || !id) continue;
        yield { reraNumber, name: s(g(it, "projectName", "name")) ?? undefined, district: s(g(it, "district", "districtName")) ?? undefined, handle: id, listingHash: s(g(it, "updatedOn", "lastModified", "modifiedDate")) ?? undefined } satisfies ProjectRef;
        if (opts.limit && ++yielded >= opts.limit) return;
      }
      if (items.length < size) return;
      page++;
    }
  },

  async detail(ref: ProjectRef): Promise<NormalizedProject> {
    const data = await getJson<AnyRec>(DETAIL_URL.replace("{id}", encodeURIComponent(ref.handle)));
    const fetchedAt = new Date().toISOString();
    const root = (g(data, "data", "project", "result") as AnyRec) ?? data;

    const units = ((g(root, "unitDetails", "units", "unitList", "inventory") as AnyRec[]) ?? []).map((u) => ({
      unitType: s(g(u, "unitType", "type", "name")) ?? "Unit",
      count: parseNumber(s(g(u, "totalUnits", "noOfUnits", "count", "total"))) ?? 0,
      booked: parseNumber(s(g(u, "bookedUnits", "booked", "sold"))) ?? 0,
      carpetAreaSqm: parseAreaSqm(s(g(u, "carpetArea", "carpetAreaSqmt", "carpet_area"))),
    }));
    const complaints = ((g(root, "complaints", "complaintList", "cases") as AnyRec[]) ?? []).map((c) => ({
      caseNumber: s(g(c, "complaintNo", "caseNo", "number")) ?? "unknown",
      filedOn: parseDate(s(g(c, "filedOn", "complaintDate", "date"))),
      status: (/dispos|closed/i.test(s(g(c, "status")) ?? "") ? "disposed" : /appeal/i.test(s(g(c, "status")) ?? "") ? "appeal" : "open") as "open" | "disposed" | "appeal",
      summary: s(g(c, "subject", "description", "summary")),
      orderDate: parseDate(s(g(c, "orderDate"))),
      orderSummary: s(g(c, "orderSummary", "order")),
    }));
    const qprs = (g(root, "quarterlyUpdates", "qprList", "progressReports") as AnyRec[]) ?? [];
    const totalUnits = units.reduce((a, u) => a + u.count, 0) || parseNumber(s(g(root, "totalUnits", "noOfUnits")));

    return {
      reraNumber: ref.reraNumber,
      stateSlug: "gujarat",
      name: s(g(root, "projectName", "name")) ?? ref.name ?? ref.reraNumber,
      type: normalizeType(s(g(root, "projectType", "type"))),
      status: normalizeStatus(s(g(root, "projectStatus", "status"))),
      district: s(g(root, "district", "districtName")) ?? ref.district ?? "Unknown",
      taluka: s(g(root, "taluka", "talukaName")),
      locality: s(g(root, "village", "area", "locality", "moje")),
      pincode: s(g(root, "pincode", "pinCode")),
      lat: parseNumber(s(g(root, "latitude", "lat"))),
      lng: parseNumber(s(g(root, "longitude", "lng", "long"))),
      promoter: {
        name: s(g(root, "promoterName", "promoter", "organizationName")) ?? "Unknown promoter",
        type: s(g(root, "promoterType", "organizationType")),
        address: s(g(root, "promoterAddress", "officeAddress", "address")),
        website: s(g(root, "website")),
        cin: s(g(root, "cin")),
      },
      registrationDate: parseDate(s(g(root, "registrationDate", "regDate", "approvedDate"))),
      originalCompletionDate: parseDate(s(g(root, "proposedCompletionDate", "completionDate", "endDate"))),
      revisedCompletionDate: parseDate(s(g(root, "revisedCompletionDate", "extendedDate", "extendedCompletionDate"))),
      actualCompletionDate: parseDate(s(g(root, "actualCompletionDate", "bucDate", "completionCertificateDate"))),
      extensionCount: parseNumber(s(g(root, "extensionCount", "noOfExtensions"))) ?? 0,
      landAreaSqm: parseAreaSqm(s(g(root, "landArea", "plotArea", "totalLandArea"))),
      totalBuildings: parseNumber(s(g(root, "noOfBuildings", "totalBuildings", "blocks"))),
      totalUnits,
      unitsBooked: units.reduce((a, u) => a + u.booked, 0) || parseNumber(s(g(root, "bookedUnits"))),
      carpetAreaRegisteredSqm: units.length ? units.reduce((a, u) => a + (u.carpetAreaSqm ?? 0) * u.count, 0) / Math.max(1, totalUnits ?? 1) : null,
      unitMix: units,
      complaints,
      qprFiled: qprs.length,
      lastQprDate: parseDate(s(g(qprs.at(-1), "quarterEndDate", "date", "submittedOn"))),
      escrowBank: s(g(root, "bankName", "escrowBank")),
      encumbrance: /yes|true/i.test(s(g(root, "encumbrance", "isEncumbered")) ?? ""),
      litigation: /yes|true/i.test(s(g(root, "litigation", "isLitigation", "pendingLitigation")) ?? ""),
      sourceUrl: `https://gujrera.gujarat.gov.in/project-details/${ref.handle}`,
      sourceFetchedAt: fetchedAt,
    };
  },
};
