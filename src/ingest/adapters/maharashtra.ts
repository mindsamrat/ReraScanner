/**
 * MahaRERA — https://maharera.maharashtra.gov.in
 *
 * How the public register is exposed
 * ----------------------------------
 * The portal is a server-rendered (Drupal/PHP) site. The project search page
 * `/projects-search-result` accepts GET parameters and paginates with `?page=N`.
 * Each result links to a public "view details" page which renders the full
 * application in tabs: project, promoter, buildings/wings, unit inventory,
 * professionals, documents, litigations, and the 'complaints' tab.
 *
 * MahaRERA also publishes:
 *  - lapsed project lists per year            (/index.php/lapsed-projects)
 *  - district-wise QPR non-compliance lists   (/index.php/district-wise-non-compliance-qpr-projects)
 *  - revoked / suspended registrations
 * These feed the compliance component of the score.
 *
 * Notes for operators
 *  - The portal changes markup every few months; selectors below are kept
 *    loose (label-based) for that reason. Run `npm run ingest -- --state maharashtra --limit 5 --dry-run`
 *    after any portal change and compare the output with the live page.
 *  - Some detail tabs are loaded via XHR on the live site. The public-view URL
 *    renders them server-side when requested with the `tab` query parameter.
 *  - Respect robots.txt and keep INGEST_DELAY_MS >= 1500.
 */
import { getText } from "../http";
import { cheerio, clean, labelValueMap, normalizeStatus, normalizeType, parseAreaSqm, parseDate, parseNumber, pick } from "../parse";
import type { ListOptions, NormalizedComplaint, NormalizedProject, PortalAdapter, ProjectRef } from "../types";

const BASE = "https://maharera.maharashtra.gov.in";

export const maharashtraAdapter: PortalAdapter = {
  id: "maharera",
  stateSlug: "maharashtra",
  capabilities: { listing: true, detail: true, complaints: true, unitInventory: true, quarterlyUpdates: true, incremental: false, needsBrowser: false },
  notes: "Server-rendered PHP portal. Paginated search results + public project detail page with tabs.",

  async *list(opts: ListOptions = {}) {
    let page = 0;
    let yielded = 0;
    for (;;) {
      const url = `${BASE}/projects-search-result?project_name=&project_location=&project_completion_date=&project_state=27&project_district=${encodeURIComponent(opts.district ?? "")}&page=${page}`;
      const html = await getText(url);
      const $ = cheerio.load(html);
      const rows = $(".views-row, table.views-table tbody tr, .project-list .row");
      if (!rows.length) return;
      for (const el of rows.toArray()) {
        const text = clean($(el).text());
        const reraNumber = text.match(/\bP5\d{10}\b/)?.[0];
        const href = $(el).find("a[href*='view'], a[href*='project']").first().attr("href");
        if (!reraNumber || !href) continue;
        yield { reraNumber, name: clean($(el).find("h3, h4, .project-name, td:nth-child(2)").first().text()) || undefined, handle: new URL(href, BASE).toString() } satisfies ProjectRef;
        if (opts.limit && ++yielded >= opts.limit) return;
      }
      const hasNext = $("a[rel='next'], .pager__item--next a, li.next a").length > 0;
      if (!hasNext) return;
      page++;
    }
  },

  async detail(ref: ProjectRef): Promise<NormalizedProject> {
    const html = await getText(ref.handle);
    const fetchedAt = new Date().toISOString();
    const $ = cheerio.load(html);
    const kv = labelValueMap(html);

    const name = clean(pick(kv, "project name") ?? $("h1, h2").first().text()) || ref.name || ref.reraNumber;
    const promoterName = clean(pick(kv, "promoter name", "name of promoter", "organization name") ?? "");
    const district = clean(pick(kv, "district") ?? ref.district ?? "Unknown");

    // Complaints tab lists case numbers, complainant, status and order links
    const complaints: NormalizedComplaint[] = [];
    $("#complaints table tbody tr, table.complaints tbody tr").each((_, tr) => {
      const tds = $(tr).find("td").map((_, td) => clean($(td).text())).get();
      if (tds.length < 2) return;
      const status = /dispos|closed|decided/i.test(tds.join(" ")) ? "disposed" : /appeal/i.test(tds.join(" ")) ? "appeal" : "open";
      complaints.push({ caseNumber: tds[0], filedOn: parseDate(tds[1]), status, summary: tds[2] ?? null, sourceUrl: ref.handle });
    });

    const unitMix = $("#units table tbody tr, table.unit-details tbody tr")
      .map((_, tr) => {
        const tds = $(tr).find("td").map((_, td) => clean($(td).text())).get();
        return { unitType: tds[0] ?? "Unit", carpetAreaSqm: parseAreaSqm(tds[1]), count: parseNumber(tds[2]) ?? 0, booked: parseNumber(tds[3]) ?? 0 };
      })
      .get()
      .filter((u) => u.count > 0);

    const totalUnits = unitMix.reduce((s, u) => s + u.count, 0) || parseNumber(pick(kv, "total number of apartments", "number of apartments", "total units"));
    const booked = unitMix.reduce((s, u) => s + (u.booked ?? 0), 0) || parseNumber(pick(kv, "booked"));
    const avgCarpet = unitMix.length ? unitMix.reduce((s, u) => s + (u.carpetAreaSqm ?? 0) * u.count, 0) / Math.max(1, totalUnits ?? 1) : null;

    const extensions = $("#extension table tbody tr, table.extension tbody tr")
      .map((_, tr) => {
        const tds = $(tr).find("td").map((_, td) => clean($(td).text())).get();
        const newDate = parseDate(tds[1] ?? tds[0]);
        return newDate ? { kind: "extension" as const, previousDate: parseDate(tds[0]), newDate, grantedOn: parseDate(tds[2]), reason: tds[3] ?? null } : null;
      })
      .get()
      .filter(Boolean) as NormalizedProject["extensions"];

    return {
      reraNumber: ref.reraNumber,
      stateSlug: "maharashtra",
      name,
      type: normalizeType(pick(kv, "project type", "type of project")),
      status: normalizeStatus(pick(kv, "project status", "status")),
      district,
      taluka: pick(kv, "taluka") ?? null,
      locality: pick(kv, "village", "locality", "area") ?? null,
      pincode: pick(kv, "pin code", "pincode") ?? null,
      promoter: { name: promoterName || "Unknown promoter", type: pick(kv, "promoter type", "organization type") ?? null, address: pick(kv, "office address", "address") ?? null, website: pick(kv, "website") ?? null },
      registrationDate: parseDate(pick(kv, "registration date", "date of registration")),
      originalCompletionDate: parseDate(pick(kv, "proposed date of completion", "original completion", "proposed completion")),
      revisedCompletionDate: parseDate(pick(kv, "revised proposed date", "extended date", "revised completion")),
      actualCompletionDate: parseDate(pick(kv, "actual completion", "date of completion", "occupancy certificate date")),
      extensionCount: extensions?.length ?? 0,
      extensions,
      landAreaSqm: parseAreaSqm(pick(kv, "total area of land", "plot area", "land area")),
      totalBuildings: parseNumber(pick(kv, "number of buildings", "total buildings", "no. of buildings")),
      totalUnits,
      unitsBooked: booked ?? null,
      carpetAreaRegisteredSqm: avgCarpet,
      unitMix,
      complaints,
      litigation: /yes/i.test(pick(kv, "litigation") ?? ""),
      encumbrance: /yes/i.test(pick(kv, "encumbrance") ?? ""),
      escrowBank: pick(kv, "bank name", "designated bank") ?? null,
      qprFiled: $("#quarterly table tbody tr, table.qpr tbody tr").length || 0,
      sourceUrl: ref.handle,
      sourceFetchedAt: fetchedAt,
    };
  },
};
