/**
 * Adapter factory for ASP.NET WebForms portals (UP RERA, TS RERA, MP, Rajasthan,
 * AP, Bihar, Chhattisgarh, Jharkhand).
 *
 * These portals keep page state in `__VIEWSTATE` / `__EVENTVALIDATION` hidden
 * fields and paginate by posting back `__EVENTTARGET=<grid>$ctl00$...`. The
 * sequence is always:
 *   1. GET the search page to obtain the hidden state fields
 *   2. POST the same page with the state + search fields to get results
 *   3. For each page, POST again with the pager's event target
 *
 * The fields differ per portal and are therefore passed in via `fields`.
 * If a portal adds a CAPTCHA to the public search (UP RERA has done so at
 * times), set `needsBrowser: true` and run the ingestion through the
 * Playwright driver (`scripts/ingest.ts --browser`) which solves nothing but
 * lets a human type the CAPTCHA once per session.
 */
import { getText, postForm } from "../http";
import { aspNetState, cheerio, clean, labelValueMap, normalizeStatus, normalizeType, parseAreaSqm, parseDate, parseNumber, pick } from "../parse";
import type { ListOptions, NormalizedProject, PortalAdapter, ProjectRef } from "../types";

export interface AspNetConfig {
  id: string;
  stateSlug: string;
  base: string;
  searchPath: string;
  /** Form fields posted with the ViewState to trigger the search. */
  fields: Record<string, string>;
  /** __EVENTTARGET template for paging; `{page}` is substituted. Omit if the grid is not paged. */
  pagerTarget?: string;
  regNumber: RegExp;
  detailPath?: (id: string) => string;
  notes: string;
  needsBrowser?: boolean;
}

export function aspNetAdapter(cfg: AspNetConfig): PortalAdapter {
  const searchUrl = `${cfg.base}${cfg.searchPath}`;
  return {
    id: cfg.id,
    stateSlug: cfg.stateSlug,
    capabilities: { listing: true, detail: true, complaints: true, unitInventory: false, quarterlyUpdates: false, incremental: false, needsBrowser: !!cfg.needsBrowser },
    notes: cfg.notes,

    async *list(opts: ListOptions = {}) {
      const first = await getText(searchUrl);
      let state = aspNetState(first);
      let html = await postForm(searchUrl, { ...state, ...cfg.fields, ...(opts.district ? { district: opts.district } : {}) });
      let yielded = 0;
      for (let page = 1; ; page++) {
        const $ = cheerio.load(html);
        const rows = $("table tr").toArray();
        let found = 0;
        for (const tr of rows) {
          const text = clean($(tr).text());
          const reraNumber = text.match(cfg.regNumber)?.[0];
          if (!reraNumber) continue;
          const tds = $(tr).find("td").map((_, td) => clean($(td).text())).get();
          const href = $(tr).find("a[href]").not("[href^='javascript']").first().attr("href");
          const id = $(tr).find("a[href*='id=']").attr("href")?.match(/id=([^&]+)/)?.[1] ?? reraNumber;
          found++;
          yield { reraNumber, name: tds[1], handle: href ? new URL(href, cfg.base).toString() : `${cfg.base}${cfg.detailPath ? cfg.detailPath(id) : `/ProjectDetails.aspx?id=${encodeURIComponent(id)}`}` } satisfies ProjectRef;
          if (opts.limit && ++yielded >= opts.limit) return;
        }
        if (!cfg.pagerTarget || found === 0) return;
        state = aspNetState(html);
        html = await postForm(searchUrl, { ...state, ...cfg.fields, __EVENTTARGET: cfg.pagerTarget.replace("{page}", String(page + 1)), __EVENTARGUMENT: `Page$${page + 1}` });
      }
    },

    async detail(ref: ProjectRef): Promise<NormalizedProject> {
      const html = await getText(ref.handle);
      const fetchedAt = new Date().toISOString();
      const $ = cheerio.load(html);
      const kv = labelValueMap(html);
      const complaints = $("table:contains('Complaint') tr")
        .map((_, tr) => {
          const tds = $(tr).find("td").map((_, td) => clean($(td).text())).get();
          return tds.length >= 2 && /\d/.test(tds[0]) ? { caseNumber: tds[0], filedOn: parseDate(tds[1]), status: (/dispos|closed|decided/i.test(tds.join(" ")) ? "disposed" : "open") as "open" | "disposed", summary: tds[2] ?? null, sourceUrl: ref.handle } : null;
        })
        .get()
        .filter(Boolean) as NormalizedProject["complaints"];
      return {
        reraNumber: ref.reraNumber,
        stateSlug: cfg.stateSlug,
        name: pick(kv, "project name") ?? ref.name ?? ref.reraNumber,
        type: normalizeType(pick(kv, "project type", "type")),
        status: normalizeStatus(pick(kv, "status")),
        district: pick(kv, "district") ?? ref.district ?? "Unknown",
        locality: pick(kv, "locality", "village", "sector", "area") ?? null,
        pincode: pick(kv, "pin") ?? null,
        promoter: { name: pick(kv, "promoter name", "promoter", "developer") ?? "Unknown promoter", address: pick(kv, "address") ?? null },
        registrationDate: parseDate(pick(kv, "registration date", "date of registration", "registered on")),
        originalCompletionDate: parseDate(pick(kv, "proposed completion", "completion date", "end date")),
        revisedCompletionDate: parseDate(pick(kv, "extended", "revised")),
        actualCompletionDate: parseDate(pick(kv, "actual completion", "completion certificate", "occupancy")),
        landAreaSqm: parseAreaSqm(pick(kv, "land area", "plot area", "total area")),
        totalUnits: parseNumber(pick(kv, "total units", "number of units", "apartments", "plots")),
        complaints,
        sourceUrl: ref.handle,
        sourceFetchedAt: fetchedAt,
      };
    },
  };
}
