/** Small parsing helpers shared by the HTML-scraping adapters. */
import * as cheerio from "cheerio";
import type { ProjectStatus, ProjectType } from "./types";

export { cheerio };

export function clean(s: string | undefined | null): string {
  return (s ?? "").replace(/\s+/g, " ").replace(/ /g, " ").trim();
}

/** Parse the many date formats Indian portals use into yyyy-mm-dd. */
export function parseDate(raw: string | undefined | null): string | null {
  const s = clean(raw);
  if (!s || /^(na|n\/a|-|--|nil|not available)$/i.test(s)) return null;
  // dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy
  let m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  // yyyy-mm-dd
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // 31 Mar 2025, 31-Mar-2025, March 31, 2025
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

export function parseNumber(raw: string | undefined | null): number | null {
  const s = clean(raw).replace(/,/g, "");
  const m = s.match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

/** Convert an area string with a unit into square metres. */
export function parseAreaSqm(raw: string | undefined | null): number | null {
  const s = clean(raw).toLowerCase();
  const n = parseNumber(s);
  if (n == null) return null;
  if (/sq\.?\s*ft|sqft|square feet/.test(s)) return Math.round(n * 0.092903 * 100) / 100;
  if (/acre/.test(s)) return Math.round(n * 4046.86);
  if (/hectare|ha\b/.test(s)) return Math.round(n * 10000);
  if (/sq\.?\s*yd|sq\.?\s*yard|gaj/.test(s)) return Math.round(n * 0.836127 * 100) / 100;
  return n; // assume sq m
}

export function normalizeStatus(raw: string | undefined | null): ProjectStatus {
  const s = clean(raw).toLowerCase();
  if (/complet|occupan|oc received|cc received|possession given/.test(s)) return "completed";
  if (/lapse|expired|time over|validity over/.test(s)) return "lapsed";
  if (/revok|cancel|suspend|deregist/.test(s)) return "revoked";
  if (/withdraw/.test(s)) return "withdrawn";
  return "registered";
}

export function normalizeType(raw: string | undefined | null): ProjectType {
  const s = clean(raw).toLowerCase();
  if (/plot|layout|land/.test(s)) return "plotted";
  if (/mixed/.test(s)) return "mixed";
  if (/commercial|shop|office|retail|mall|it park|warehouse/.test(s)) return "commercial";
  return "residential";
}

/**
 * Read a label/value table (the dominant layout on every portal) into a map.
 * Handles <th>/<td> pairs, <td>/<td> pairs and <dt>/<dd>.
 */
export function labelValueMap(html: string, scope?: string): Record<string, string> {
  const $ = cheerio.load(html);
  const root = scope ? $(scope) : $.root();
  const out: Record<string, string> = {};
  root.find("tr").each((_, tr) => {
    const cells = $(tr).children("th,td");
    for (let i = 0; i + 1 < cells.length; i += 2) {
      const k = clean($(cells[i]).text()).replace(/[:*]+$/, "").toLowerCase();
      const v = clean($(cells[i + 1]).text());
      if (k && !(k in out)) out[k] = v;
    }
  });
  root.find("dt").each((_, dt) => {
    const k = clean($(dt).text()).replace(/[:*]+$/, "").toLowerCase();
    const v = clean($(dt).next("dd").text());
    if (k && !(k in out)) out[k] = v;
  });
  // Bootstrap style: <label>Key</label><span/div>Value</span>
  root.find("label").each((_, l) => {
    const k = clean($(l).text()).replace(/[:*]+$/, "").toLowerCase();
    const v = clean($(l).next().text());
    if (k && v && !(k in out)) out[k] = v;
  });
  return out;
}

/** Find the first value whose label contains any of the given fragments. */
export function pick(map: Record<string, string>, ...fragments: string[]): string | undefined {
  for (const f of fragments) {
    const key = Object.keys(map).find((k) => k.includes(f.toLowerCase()));
    if (key && map[key]) return map[key];
  }
  return undefined;
}

/** Extract ASP.NET WebForms hidden fields needed to post back a form. */
export function aspNetState(html: string): Record<string, string> {
  const $ = cheerio.load(html);
  const out: Record<string, string> = {};
  for (const name of ["__VIEWSTATE", "__VIEWSTATEGENERATOR", "__EVENTVALIDATION", "__VIEWSTATEENCRYPTED", "__PREVIOUSPAGE"]) {
    const v = $(`input[name="${name}"]`).attr("value");
    if (v !== undefined) out[name] = v;
  }
  return out;
}
