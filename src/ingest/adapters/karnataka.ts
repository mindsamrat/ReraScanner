/**
 * RERA Karnataka (K-RERA) — https://rera.karnataka.gov.in
 *
 * How the public register is exposed
 * ----------------------------------
 * Java/Spring server-rendered portal. The public project search is a POST form
 * (`/projectViewDetails` style endpoints) filtered by district; results are an
 * HTML table of ~25 rows per page with a hidden project id per row. Project
 * detail is another server-rendered page with label/value tables for the
 * registration, promoter, land, building, and complaint sections.
 *
 * A single search per district returns the whole district (roughly 10,000
 * records state-wide across all districts), which is why `district` is the
 * natural unit of incremental ingestion here.
 */
import { getText, postForm } from "../http";
import { cheerio, clean, labelValueMap, normalizeStatus, normalizeType, parseAreaSqm, parseDate, parseNumber, pick } from "../parse";
import type { ListOptions, NormalizedProject, PortalAdapter, ProjectRef } from "../types";

const BASE = "https://rera.karnataka.gov.in";
const KA_DISTRICTS = ["Bengaluru Urban", "Bengaluru Rural", "Mysuru", "Dakshina Kannada", "Dharwad", "Belagavi", "Udupi", "Tumakuru", "Ballari", "Kalaburagi", "Shivamogga", "Hassan", "Mandya", "Davanagere", "Chikkamagaluru", "Ramanagara", "Kolar", "Chikkaballapura", "Vijayapura", "Bagalkot", "Raichur", "Bidar", "Koppal", "Gadag", "Haveri", "Uttara Kannada", "Chitradurga", "Kodagu", "Chamarajanagar", "Yadgir"];

export const karnatakaAdapter: PortalAdapter = {
  id: "krera",
  stateSlug: "karnataka",
  capabilities: { listing: true, detail: true, complaints: true, unitInventory: false, quarterlyUpdates: true, incremental: false, needsBrowser: false },
  notes: "Spring MVC portal; POST search per district returns an HTML table, detail pages are label/value tables.",

  async *list(opts: ListOptions = {}) {
    const districts = opts.district ? [opts.district] : KA_DISTRICTS;
    let yielded = 0;
    for (const district of districts) {
      let page = 1;
      for (;;) {
        const html = await postForm(`${BASE}/projectViewDetails`, { district, projectType: "", status: "", page: String(page) });
        const $ = cheerio.load(html);
        const rows = $("table tbody tr").toArray();
        if (!rows.length) break;
        for (const tr of rows) {
          const tds = $(tr).find("td").map((_, td) => clean($(td).text())).get();
          const reraNumber = tds.find((t) => /^PRM\/KA\/RERA\//.test(t));
          const href = $(tr).find("a[href]").first().attr("href");
          const id = $(tr).find("input[type=hidden]").first().attr("value") ?? href?.match(/[?&](?:id|projectId)=(\d+)/)?.[1];
          if (!reraNumber || !(href || id)) continue;
          yield { reraNumber, name: tds[1], district, handle: href ? new URL(href, BASE).toString() : `${BASE}/projectDetails?id=${id}` } satisfies ProjectRef;
          if (opts.limit && ++yielded >= opts.limit) return;
        }
        if (!$("a:contains('Next'), li.next a").length) break;
        page++;
      }
    }
  },

  async detail(ref: ProjectRef): Promise<NormalizedProject> {
    const html = await getText(ref.handle);
    const fetchedAt = new Date().toISOString();
    const $ = cheerio.load(html);
    const kv = labelValueMap(html);
    const complaints = $("table:contains('Complaint') tbody tr")
      .map((_, tr) => {
        const tds = $(tr).find("td").map((_, td) => clean($(td).text())).get();
        if (tds.length < 2 || !/CMP|KRERA|\d/.test(tds[0])) return null;
        return { caseNumber: tds[0], filedOn: parseDate(tds[1]), status: (/dispos|closed/i.test(tds.join(" ")) ? "disposed" : "open") as "open" | "disposed", summary: tds[2] ?? null, sourceUrl: ref.handle };
      })
      .get()
      .filter(Boolean) as NormalizedProject["complaints"];

    return {
      reraNumber: ref.reraNumber,
      stateSlug: "karnataka",
      name: pick(kv, "project name") ?? ref.name ?? ref.reraNumber,
      type: normalizeType(pick(kv, "project type", "type of project")),
      status: normalizeStatus(pick(kv, "project status", "status")),
      district: pick(kv, "district") ?? ref.district ?? "Unknown",
      taluka: pick(kv, "taluk") ?? null,
      locality: pick(kv, "village", "locality", "area") ?? null,
      pincode: pick(kv, "pin code", "pincode") ?? null,
      promoter: { name: pick(kv, "promoter name", "name of the promoter", "organization name") ?? "Unknown promoter", type: pick(kv, "promoter type", "type of promoter") ?? null, address: pick(kv, "address") ?? null },
      registrationDate: parseDate(pick(kv, "registration date", "approved on", "date of registration")),
      originalCompletionDate: parseDate(pick(kv, "proposed completion date", "project end date", "completion date")),
      revisedCompletionDate: parseDate(pick(kv, "extended date", "revised completion")),
      actualCompletionDate: parseDate(pick(kv, "actual completion", "completion certificate")),
      extensionCount: parseNumber(pick(kv, "number of extensions", "extension")) ?? 0,
      landAreaSqm: parseAreaSqm(pick(kv, "total area of land", "land area", "plot area")),
      totalBuildings: parseNumber(pick(kv, "number of buildings", "no of towers", "blocks")),
      totalUnits: parseNumber(pick(kv, "total number of units", "no of units", "total units", "number of apartments")),
      unitsBooked: parseNumber(pick(kv, "booked", "sold")),
      complaints,
      qprFiled: $("table:contains('Quarter') tbody tr").length,
      escrowBank: pick(kv, "bank name") ?? null,
      litigation: /yes/i.test(pick(kv, "litigation") ?? ""),
      encumbrance: /yes/i.test(pick(kv, "encumbrance", "mortgage") ?? ""),
      sourceUrl: ref.handle,
      sourceFetchedAt: fetchedAt,
    };
  },
};
