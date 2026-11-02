/**
 * Adapter registry. One entry per state portal we know how to read.
 *
 * Adapters marked `coverage: "sample"` in src/lib/states.ts have a sample
 * fallback so the site works offline; `npm run ingest -- --state <slug>` runs
 * the live adapter listed here instead.
 */
import type { PortalAdapter } from "../types";
import { maharashtraAdapter } from "./maharashtra";
import { gujaratAdapter } from "./gujarat";
import { karnatakaAdapter } from "./karnataka";
import { htmlTableAdapter } from "./htmlTable";
import { aspNetAdapter } from "./aspnet";

export const ADAPTERS: Record<string, PortalAdapter> = {
  maharashtra: maharashtraAdapter,
  gujarat: gujaratAdapter,
  karnataka: karnatakaAdapter,

  uttarpradesh: aspNetAdapter({
    id: "uprera",
    stateSlug: "uttarpradesh",
    base: "https://www.up-rera.in",
    searchPath: "/projects",
    fields: { ctl00$ContentPlaceHolder1$btnSearch: "Search" },
    pagerTarget: "ctl00$ContentPlaceHolder1$gvProjects",
    regNumber: /UPRERAPRJ\d+/,
    detailPath: (id) => `/Frm_View_Project_Details.aspx?id=${encodeURIComponent(id)}`,
    notes: "ASP.NET WebForms; the public project grid pages via __EVENTTARGET postbacks. Complaint and order lists are on the detail page. A CAPTCHA has been added to the search at times; use --browser when that happens.",
    needsBrowser: true,
  }),

  telangana: aspNetAdapter({
    id: "tsrera",
    stateSlug: "telangana",
    base: "https://rera.telangana.gov.in",
    searchPath: "/registered-projects",
    fields: { ctl00$ContentPlaceHolder1$btnSearch: "Search" },
    pagerTarget: "ctl00$ContentPlaceHolder1$gvProjects",
    regNumber: /\bP0\d{10}\b/,
    notes: "ASP.NET portal with a registered-projects grid; district and mandal are columns in the grid.",
  }),

  westbengal: htmlTableAdapter({
    id: "wbrera",
    stateSlug: "westbengal",
    base: "https://rera.wb.gov.in",
    listUrls: ["https://rera.wb.gov.in/project-list?page={page}"],
    regNumber: /WBRERA\/P\/[A-Z]{3}\/\d{4}\/\d{6}/,
    notes: "Server-rendered listing. WBRERA publishes no completion/handover date, so the possession component is unavailable and the score runs at reduced confidence.",
    publishesCompletionDates: false,
  }),

  kerala: htmlTableAdapter({
    id: "krera-kl",
    stateSlug: "kerala",
    base: "https://rera.kerala.gov.in",
    listUrls: ["https://rera.kerala.gov.in/project-list?page={page}"],
    regNumber: /K-RERA\/PRJ\/\d+\/\d{4}/,
    notes: "Server-rendered project list with a detail page per registration.",
  }),

  tamilnadu: htmlTableAdapter({
    id: "tnrera",
    stateSlug: "tamilnadu",
    base: "https://www.rera.tn.gov.in",
    listUrls: ["https://www.rera.tn.gov.in/registered-projects?page={page}"],
    regNumber: /TN\/\d{2}\/(?:Building|Layout)\/\d{4}\/\d{4}/,
    notes: "Registered projects are published as yearly/district HTML tables; detail pages carry the approval and completion data.",
  }),

  haryana: htmlTableAdapter({
    id: "harera",
    stateSlug: "haryana",
    base: "https://haryanarera.gov.in",
    listUrls: ["https://haryanarera.gov.in/view_project/registered_projects?page={page}"],
    regNumber: /RC\/REP\/HARERA\/(?:GGM|PKL)\/\d+\/\d+\/\d{4}\/\d+/,
    notes: "PHP portal shared by the Gurugram and Panchkula benches. Orders are PDFs linked from the detail page.",
  }),

  delhi: htmlTableAdapter({
    id: "rera-dl",
    stateSlug: "delhi",
    base: "https://rera.delhi.gov.in",
    listUrls: ["https://rera.delhi.gov.in/registered-projects"],
    regNumber: /DLRERA\d{4}P\d{4}/,
    notes: "Small register published as plain HTML tables.",
  }),
};

export function getAdapter(stateSlug: string): PortalAdapter | undefined {
  return ADAPTERS[stateSlug];
}
