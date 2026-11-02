/**
 * Generic adapter factory for the many smaller portals that are "a server-rendered
 * HTML table of registered projects, each linking to a label/value detail page".
 *
 * West Bengal, Kerala, Tamil Nadu, Haryana, Delhi, Punjab, Goa, Uttarakhand,
 * Himachal and Assam all fit this shape. Each state supplies:
 *   - the listing URL(s) (optionally paginated with {page})
 *   - a regex that recognises its registration numbers in a row
 *   - optional label overrides when its detail page uses unusual wording
 *
 * ASP.NET portals (UP, Telangana, MP, Rajasthan, AP, Bihar, Chhattisgarh,
 * Jharkhand) also work with this factory when a listing URL renders without a
 * postback; otherwise see ./aspnet.ts.
 */
import { getText } from "../http";
import { cheerio, clean, labelValueMap, normalizeStatus, normalizeType, parseAreaSqm, parseDate, parseNumber, pick } from "../parse";
import type { ListOptions, NormalizedProject, PortalAdapter, ProjectRef } from "../types";

export interface HtmlTableConfig {
  id: string;
  stateSlug: string;
  base: string;
  /** Listing URLs; `{page}` is replaced with 1..n until a page yields no rows. */
  listUrls: string[];
  regNumber: RegExp;
  rowSelector?: string;
  detailLinkSelector?: string;
  notes: string;
  labels?: Partial<Record<"name" | "promoter" | "district" | "type" | "status" | "registered" | "completion" | "revised" | "actual" | "units" | "land", string[]>>;
  /** Some portals (WBRERA) publish no completion dates at all. */
  publishesCompletionDates?: boolean;
}

export function htmlTableAdapter(cfg: HtmlTableConfig): PortalAdapter {
  const L = {
    name: ["project name", "name of project"],
    promoter: ["promoter name", "name of promoter", "developer", "organization"],
    district: ["district"],
    type: ["project type", "type of project", "category"],
    status: ["project status", "status"],
    registered: ["registration date", "date of registration", "certificate date", "approved on"],
    completion: ["proposed date of completion", "proposed completion", "completion date", "end date", "proposed handover"],
    revised: ["revised", "extended"],
    actual: ["actual completion", "completion certificate", "occupancy"],
    units: ["total units", "number of units", "no. of units", "apartments", "plots"],
    land: ["land area", "plot area", "area of land", "total area"],
    ...cfg.labels,
  };

  return {
    id: cfg.id,
    stateSlug: cfg.stateSlug,
    capabilities: { listing: true, detail: true, complaints: false, unitInventory: false, quarterlyUpdates: false, incremental: false, needsBrowser: false },
    notes: cfg.notes,

    async *list(opts: ListOptions = {}) {
      let yielded = 0;
      for (const template of cfg.listUrls) {
        const paginated = template.includes("{page}");
        for (let page = 1; ; page++) {
          const url = template.replace("{page}", String(page));
          const html = await getText(url);
          const $ = cheerio.load(html);
          const rows = $(cfg.rowSelector ?? "table tbody tr, table tr").toArray();
          let found = 0;
          for (const tr of rows) {
            const text = clean($(tr).text());
            const reraNumber = text.match(cfg.regNumber)?.[0];
            if (!reraNumber) continue;
            const href = $(tr).find(cfg.detailLinkSelector ?? "a[href]").first().attr("href");
            const tds = $(tr).find("td").map((_, td) => clean($(td).text())).get();
            const district = opts.district ?? tds.find((t) => /district/i.test(t)) ?? undefined;
            if (opts.district && district && district !== opts.district) continue;
            found++;
            yield { reraNumber, name: tds.find((t) => t && t !== reraNumber && !/^\d+$/.test(t)) ?? undefined, district, handle: href ? new URL(href, cfg.base).toString() : url } satisfies ProjectRef;
            if (opts.limit && ++yielded >= opts.limit) return;
          }
          if (!paginated || found === 0) break;
        }
      }
    },

    async detail(ref: ProjectRef): Promise<NormalizedProject> {
      const html = await getText(ref.handle);
      const fetchedAt = new Date().toISOString();
      const kv = labelValueMap(html);
      const publishes = cfg.publishesCompletionDates ?? true;
      return {
        reraNumber: ref.reraNumber,
        stateSlug: cfg.stateSlug,
        name: pick(kv, ...L.name) ?? ref.name ?? ref.reraNumber,
        type: normalizeType(pick(kv, ...L.type)),
        status: normalizeStatus(pick(kv, ...L.status)),
        district: pick(kv, ...L.district) ?? ref.district ?? "Unknown",
        locality: pick(kv, "village", "locality", "location", "area") ?? null,
        pincode: pick(kv, "pin") ?? null,
        promoter: { name: pick(kv, ...L.promoter) ?? "Unknown promoter", address: pick(kv, "address") ?? null },
        registrationDate: parseDate(pick(kv, ...L.registered)),
        originalCompletionDate: publishes ? parseDate(pick(kv, ...L.completion)) : null,
        revisedCompletionDate: publishes ? parseDate(pick(kv, ...L.revised)) : null,
        actualCompletionDate: publishes ? parseDate(pick(kv, ...L.actual)) : null,
        landAreaSqm: parseAreaSqm(pick(kv, ...L.land)),
        totalUnits: parseNumber(pick(kv, ...L.units)),
        sourceUrl: ref.handle,
        sourceFetchedAt: fetchedAt,
      };
    },
  };
}
