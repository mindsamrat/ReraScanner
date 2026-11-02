/**
 * Registry of every Indian state / UT Real Estate Regulatory Authority.
 *
 * This is the single source of truth for:
 *  - URL slugs used across the site (`/state/[slug]`)
 *  - Links back to the official portal (every project page links to it)
 *  - How the portal exposes data, which drives the ingestion adapter choice
 *
 * Portal technology notes come from public reverse-engineering work on the
 * portals (see /data-sources). They describe how the data is reached, not an
 * official API: none of the authorities publish one.
 */

export type PortalTech =
  | "json-api" // SPA (Angular/React) backed by a JSON REST API
  | "aspnet-postback" // ASP.NET WebForms with __VIEWSTATE, usually needs a headless browser
  | "server-html" // Server-rendered HTML, often with POST search forms
  | "php-html" // PHP/Laravel server-rendered pages
  | "unknown";

export type Coverage = "live" | "sample" | "planned";

export interface StateInfo {
  slug: string;
  name: string;
  code: string; // ISO-3166-2 suffix, e.g. MH
  authority: string; // Common name of the regulator
  portalUrl: string;
  projectSearchUrl: string;
  tech: PortalTech;
  ingestion: string; // short, human description of the ingestion method
  regNumberExample: string;
  regNumberPattern: string; // RegExp source used to detect state from a RERA number
  coverage: Coverage;
  notes?: string;
  region: "North" | "South" | "East" | "West" | "Central" | "North-East";
}

export const STATES: StateInfo[] = [
  {
    slug: "maharashtra",
    name: "Maharashtra",
    code: "MH",
    authority: "MahaRERA",
    portalUrl: "https://maharera.maharashtra.gov.in",
    projectSearchUrl: "https://maharera.maharashtra.gov.in/projects-search-result",
    tech: "php-html",
    ingestion:
      "Paginated server-rendered search results; each project has a public 'view details' page with registration, promoter, buildings, units and complaints tabs.",
    regNumberExample: "P51700053842",
    regNumberPattern: "^P5\\d{10}$",
    coverage: "sample",
    region: "West",
    notes:
      "Largest register in India. Also publishes lists of lapsed projects and district-wise QPR non-compliance which we ingest as compliance signals.",
  },
  {
    slug: "gujarat",
    name: "Gujarat",
    code: "GJ",
    authority: "GujRERA",
    portalUrl: "https://gujrera.gujarat.gov.in",
    projectSearchUrl: "https://gujrera.gujarat.gov.in/project-list",
    tech: "json-api",
    ingestion:
      "Angular single-page app backed by a JSON REST API. The project list, project detail, unit inventory and quarterly updates are all plain JSON once the endpoints are captured from the browser's network tab.",
    regNumberExample: "PR/GJ/AHMEDABAD/AHMEDABAD CITY/AUDA/RAA00001/010117",
    regNumberPattern: "^PR\\/GJ\\/",
    coverage: "sample",
    region: "West",
    notes: "The friendliest portal to ingest: unit-wise booking data is public.",
  },
  {
    slug: "karnataka",
    name: "Karnataka",
    code: "KA",
    authority: "RERA Karnataka (K-RERA)",
    portalUrl: "https://rera.karnataka.gov.in",
    projectSearchUrl: "https://rera.karnataka.gov.in/viewAllProjects",
    tech: "server-html",
    ingestion:
      "Java/Spring server-rendered pages. Project search is a POST form filtered by district; project detail pages are HTML with the registration certificate, promoter and complaint data.",
    regNumberExample: "PRM/KA/RERA/1251/446/PR/171014/000001",
    regNumberPattern: "^PRM\\/KA\\/RERA\\/",
    coverage: "sample",
    region: "South",
  },
  {
    slug: "uttarpradesh",
    name: "Uttar Pradesh",
    code: "UP",
    authority: "UP RERA",
    portalUrl: "https://www.up-rera.in",
    projectSearchUrl: "https://www.up-rera.in/projects",
    tech: "aspnet-postback",
    ingestion:
      "ASP.NET WebForms portal (__VIEWSTATE postbacks). Listing and detail pages are driven through a headless browser; detail pages expose registration, promoter, complaint and order data.",
    regNumberExample: "UPRERAPRJ446747",
    regNumberPattern: "^UPRERAPRJ\\d+$",
    coverage: "sample",
    region: "North",
  },
  {
    slug: "westbengal",
    name: "West Bengal",
    code: "WB",
    authority: "WBRERA",
    portalUrl: "https://rera.wb.gov.in",
    projectSearchUrl: "https://rera.wb.gov.in/project-list",
    tech: "server-html",
    ingestion:
      "Server-rendered listing with public project detail pages. The older HIRA register was discontinued after the 2021 Supreme Court ruling; only WBRERA registrations are ingested.",
    regNumberExample: "WBRERA/P/NOR/2023/000123",
    regNumberPattern: "^WBRERA\\/P\\/",
    coverage: "sample",
    region: "East",
    notes:
      "WBRERA does not publish a handover/possession date for most projects, so the possession component of the score runs at reduced confidence.",
  },
  {
    slug: "kerala",
    name: "Kerala",
    code: "KL",
    authority: "K-RERA Kerala",
    portalUrl: "https://rera.kerala.gov.in",
    projectSearchUrl: "https://rera.kerala.gov.in/project-list",
    tech: "server-html",
    ingestion: "Server-rendered project list with detail pages per registration.",
    regNumberExample: "K-RERA/PRJ/123/2021",
    regNumberPattern: "^K-RERA\\/PRJ\\/",
    coverage: "sample",
    region: "South",
  },
  {
    slug: "tamilnadu",
    name: "Tamil Nadu",
    code: "TN",
    authority: "TNRERA",
    portalUrl: "https://www.rera.tn.gov.in",
    projectSearchUrl: "https://www.rera.tn.gov.in/registered-projects",
    tech: "server-html",
    ingestion: "Server-rendered registered project tables grouped by district and year.",
    regNumberExample: "TN/01/Building/0123/2021",
    regNumberPattern: "^TN\\/\\d{2}\\/",
    coverage: "sample",
    region: "South",
  },
  {
    slug: "telangana",
    name: "Telangana",
    code: "TS",
    authority: "TS RERA",
    portalUrl: "https://rera.telangana.gov.in",
    projectSearchUrl: "https://rera.telangana.gov.in/registered-projects",
    tech: "aspnet-postback",
    ingestion: "ASP.NET portal; project search via postback with a public detail page.",
    regNumberExample: "P02400001234",
    regNumberPattern: "^P0\\d{10}$",
    coverage: "sample",
    region: "South",
  },
  {
    slug: "haryana",
    name: "Haryana",
    code: "HR",
    authority: "HARERA (Gurugram & Panchkula)",
    portalUrl: "https://haryanarera.gov.in",
    projectSearchUrl: "https://haryanarera.gov.in/view_project",
    tech: "php-html",
    ingestion:
      "Two benches (Gurugram and Panchkula) share one PHP portal; project lists and orders (PDF) are public.",
    regNumberExample: "RC/REP/HARERA/GGM/123/855/2019/45",
    regNumberPattern: "^RC\\/REP\\/HARERA\\/",
    coverage: "sample",
    region: "North",
  },
  {
    slug: "delhi",
    name: "Delhi",
    code: "DL",
    authority: "RERA Delhi",
    portalUrl: "https://rera.delhi.gov.in",
    projectSearchUrl: "https://rera.delhi.gov.in/registered-projects",
    tech: "server-html",
    ingestion: "Small register published as HTML tables.",
    regNumberExample: "DLRERA2023P0001",
    regNumberPattern: "^DLRERA\\d{4}P\\d+$",
    coverage: "sample",
    region: "North",
  },
  {
    slug: "madhyapradesh",
    name: "Madhya Pradesh",
    code: "MP",
    authority: "RERA MP",
    portalUrl: "https://rera.mp.gov.in",
    projectSearchUrl: "https://rera.mp.gov.in/registered-projects",
    tech: "aspnet-postback",
    ingestion: "ASP.NET portal with postback search; registration certificates as PDF.",
    regNumberExample: "P-BPL-18-01234",
    regNumberPattern: "^P-[A-Z]{3}-\\d{2}-\\d+$",
    coverage: "planned",
    region: "Central",
  },
  {
    slug: "rajasthan",
    name: "Rajasthan",
    code: "RJ",
    authority: "RERA Rajasthan",
    portalUrl: "https://rera.rajasthan.gov.in",
    projectSearchUrl: "https://rera.rajasthan.gov.in/ProjectSearch",
    tech: "aspnet-postback",
    ingestion: "ASP.NET postback search with per-project detail pages.",
    regNumberExample: "RAJ/P/2019/1234",
    regNumberPattern: "^RAJ\\/P\\/",
    coverage: "planned",
    region: "North",
  },
  {
    slug: "punjab",
    name: "Punjab",
    code: "PB",
    authority: "RERA Punjab",
    portalUrl: "https://rera.punjab.gov.in",
    projectSearchUrl: "https://rera.punjab.gov.in/reraindex/pubview/pubprojectlist",
    tech: "server-html",
    ingestion: "Public project list pages with per-project HTML detail.",
    regNumberExample: "PBRERA-SAS80-PR0123",
    regNumberPattern: "^PBRERA-",
    coverage: "planned",
    region: "North",
  },
  {
    slug: "odisha",
    name: "Odisha",
    code: "OD",
    authority: "ORERA",
    portalUrl: "https://rera.odisha.gov.in",
    projectSearchUrl: "https://rera.odisha.gov.in/projects/project-list",
    tech: "json-api",
    ingestion: "Angular app backed by a JSON API, similar to GujRERA.",
    regNumberExample: "RP/01/2019/00123",
    regNumberPattern: "^RP\\/\\d{2}\\/\\d{4}\\/",
    coverage: "planned",
    region: "East",
  },
  {
    slug: "bihar",
    name: "Bihar",
    code: "BR",
    authority: "RERA Bihar",
    portalUrl: "https://rera.bihar.gov.in",
    projectSearchUrl: "https://rera.bihar.gov.in/Registered_Projects",
    tech: "aspnet-postback",
    ingestion: "ASP.NET portal.",
    regNumberExample: "BRERAP00123-1/123/R-456/2019",
    regNumberPattern: "^BRERAP",
    coverage: "planned",
    region: "East",
  },
  {
    slug: "andhrapradesh",
    name: "Andhra Pradesh",
    code: "AP",
    authority: "AP RERA",
    portalUrl: "https://rera.ap.gov.in",
    projectSearchUrl: "https://rera.ap.gov.in/registered-projects",
    tech: "aspnet-postback",
    ingestion: "ASP.NET portal.",
    regNumberExample: "P01110012345",
    regNumberPattern: "^P01\\d{9}$",
    coverage: "planned",
    region: "South",
  },
  {
    slug: "chhattisgarh",
    name: "Chhattisgarh",
    code: "CG",
    authority: "CG RERA",
    portalUrl: "https://rera.cgstate.gov.in",
    projectSearchUrl: "https://rera.cgstate.gov.in/Approved_project_List",
    tech: "aspnet-postback",
    ingestion: "ASP.NET portal.",
    regNumberExample: "PCGRERA270518000123",
    regNumberPattern: "^PCGRERA\\d+$",
    coverage: "planned",
    region: "Central",
  },
  {
    slug: "goa",
    name: "Goa",
    code: "GA",
    authority: "Goa RERA",
    portalUrl: "https://rera.goa.gov.in",
    projectSearchUrl: "https://rera.goa.gov.in/reraApp/registered-projects",
    tech: "server-html",
    ingestion: "Small server-rendered register.",
    regNumberExample: "PRGO01231234",
    regNumberPattern: "^PRGO\\d+$",
    coverage: "planned",
    region: "West",
  },
  {
    slug: "uttarakhand",
    name: "Uttarakhand",
    code: "UK",
    authority: "UK RERA",
    portalUrl: "https://www.ukrera.org.in",
    projectSearchUrl: "https://www.ukrera.org.in/projects",
    tech: "server-html",
    ingestion: "Server-rendered register.",
    regNumberExample: "UKREP01230000123",
    regNumberPattern: "^UKREP\\d+$",
    coverage: "planned",
    region: "North",
  },
  {
    slug: "jharkhand",
    name: "Jharkhand",
    code: "JH",
    authority: "JHARERA",
    portalUrl: "https://rera.jharkhand.gov.in",
    projectSearchUrl: "https://rera.jharkhand.gov.in/projects",
    tech: "aspnet-postback",
    ingestion: "ASP.NET portal.",
    regNumberExample: "JHARERA/PROJECT/123/2021",
    regNumberPattern: "^JHARERA\\/",
    coverage: "planned",
    region: "East",
  },
  {
    slug: "himachalpradesh",
    name: "Himachal Pradesh",
    code: "HP",
    authority: "HP RERA",
    portalUrl: "https://www.hprera.in",
    projectSearchUrl: "https://www.hprera.in/project-list",
    tech: "server-html",
    ingestion: "Server-rendered register.",
    regNumberExample: "RERAHPSOP01230123",
    regNumberPattern: "^RERAHP",
    coverage: "planned",
    region: "North",
  },
  {
    slug: "assam",
    name: "Assam",
    code: "AS",
    authority: "RERA Assam",
    portalUrl: "https://rera.assam.gov.in",
    projectSearchUrl: "https://rera.assam.gov.in/projects",
    tech: "server-html",
    ingestion: "Server-rendered register.",
    regNumberExample: "RERA/ASM/P/2021/123",
    regNumberPattern: "^RERA\\/ASM\\/",
    coverage: "planned",
    region: "North-East",
  },
  {
    slug: "chandigarh",
    name: "Chandigarh",
    code: "CH",
    authority: "RERA Chandigarh",
    portalUrl: "https://rera.chbonline.in",
    projectSearchUrl: "https://rera.chbonline.in/projects",
    tech: "server-html",
    ingestion: "Small server-rendered register.",
    regNumberExample: "CHRERA-PRJ-0012",
    regNumberPattern: "^CHRERA",
    coverage: "planned",
    region: "North",
  },
];

export const STATE_BY_SLUG: Record<string, StateInfo> = Object.fromEntries(
  STATES.map((s) => [s.slug, s]),
);

export function getState(slug: string): StateInfo | undefined {
  return STATE_BY_SLUG[slug];
}

export const COVERED_STATES = STATES.filter((s) => s.coverage !== "planned");

/** Detect the issuing state from a RERA registration number. */
export function detectStateFromRegNumber(raw: string): StateInfo | undefined {
  const value = raw.trim().toUpperCase();
  for (const s of STATES) {
    if (new RegExp(s.regNumberPattern, "i").test(value)) return s;
  }
  return undefined;
}

/** Heuristic: does the string look like a RERA registration number at all? */
export function looksLikeRegNumber(raw: string): boolean {
  const v = raw.trim();
  if (v.length < 8) return false;
  if (detectStateFromRegNumber(v)) return true;
  return /[A-Z]{2,}.*\d{3,}/i.test(v) && /\//.test(v);
}
