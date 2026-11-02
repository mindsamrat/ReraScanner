# Where RERA aggregators get their data (research notes)

_Last updated: 2 November 2026. Prepared while building Rera Scanner. The portals themselves could not be opened from the build environment, so endpoint details come from public reverse-engineering projects and from search-result snippets of the sites in question; verify against the live portal before relying on any path._

## The short answer

There is **no official RERA API and no national RERA database**. The Real Estate (Regulation and Development) Act, 2016 is implemented state by state, so there are more than 20 separate registers, each on its own website with its own technology stack. Nobody, including ReraInspector, has privileged access. Every third-party RERA site gets its data one of three ways:

1. **Reading the public portal pages directly** (scraping), either by calling the JSON endpoints that a portal's single-page app uses, by parsing server-rendered HTML, or by driving a headless browser through ASP.NET postbacks and CAPTCHAs.
2. **Paying a scraping vendor** that does step 1 for them: Apify actors (a "RERA Verified Real Estate Projects & Promoter Leads Scraper" is listed from about $0.03 per 1,000 results), Actowiz Solutions and similar.
3. **Paying an identity-verification vendor** that wraps step 1 in an API: Surepass sells a "RERA Verification API" with state-specific products for Karnataka, Maharashtra, Punjab and Assam; pricing is quote-based. Signzy, IDfy and Setu do not advertise RERA-specific products.

## What ReraInspector appears to do

Everything below is from ReraInspector's own pages as surfaced by search engines; no direct access was possible.

- **Self-description:** "independent project information, built from the public records of India's state RERA authorities". It says every field traces to a state filing and that it "adds no opinion" to the facts; the score is its own analysis.
- **Coverage visible in search:** Maharashtra (MahaRERA, with URLs like `/projects/55177/P50500080064`), Gujarat, Karnataka, West Bengal, Uttar Pradesh (3,877 projects listed on its UP page), Kerala (1,669 projects). It also has `/professionals/<letter>` pages for architects and other professionals with a recency-weighted score, and `/state/<slug>` landing pages.
- **"RERA Health Score":** 0–100 with bands Strong (75+), Watch (50–74), Caution (0–49). Snippets show two weights, **Possession record 40%** and **Litigation & complaints 35%**; the remaining 25% is not visible in snippets but its pages mention promoter track record, land/escrow diligence and a comparison of registered versus advertised carpet area. Projects not yet past a deadline can show "too early to rate". For West Bengal it notes that WBRERA publishes no handover date, so the score cannot separate on-time from late deliveries there.
- **Conclusion:** the input set (completion dates, extensions, complaints, promoter history, carpet area) is exactly what the state portals publish per project, plus advertised carpet area from brochures or listings. There is no sign of any data source beyond the portals. The URL pattern `/projects/<internal id>/<RERA number>` suggests a crawled database with its own ids, consistent with scheduled scraping into a store.

## How each portal family exposes its register

| Family | How it works | How to ingest | States |
| --- | --- | --- | --- |
| SPA + JSON API | Angular/React front end calling a JSON backend | Open DevTools → Network, copy the XHR for list and detail, call them directly. Fastest; GujRERA even exposes unit-wise booking data. | Gujarat (GujRERA), Odisha (ORERA) |
| Server-rendered HTML | Java/Spring, PHP or Django pages with search forms and label/value tables | Fetch and parse HTML. Karnataka's search is a POST per district returning ~10,000 records state-wide. | Maharashtra (PHP), Karnataka (Spring), Kerala, Tamil Nadu, West Bengal, Haryana, Delhi, Punjab, Goa, Uttarakhand, HP, Assam |
| ASP.NET WebForms | Hidden `__VIEWSTATE` / `__EVENTVALIDATION` fields; paging and search are postbacks | Replay the postback sequence, or run Playwright. UP RERA has at times put a CAPTCHA on the public search; one open-source project uses Tesseract OCR to get through it. | Uttar Pradesh, Telangana, Madhya Pradesh, Rajasthan, Andhra Pradesh, Bihar, Chhattisgarh, Jharkhand |

Public reverse-engineering projects that document this (check each repo's licence before reuse):

- `mukuldas77-web/rera-india`: pan-India scraper whose README classifies portals as "Angular SPA + JSON REST API (Gujarat, Odisha): direct API calls, capture endpoint once via devtools" versus "ASP.NET postback (Maharashtra, UP, AP, MP, Rajasthan): Playwright headless browser". Outputs SQLite and Excel with a common data model.
- `Saivishwa-avacasa/RERA-Scheduler`: Tamil Nadu, Maharashtra and Karnataka scrapers with change detection and scheduled GitHub Actions runs; reports about 10,000 Karnataka records from one search per district.
- `Dhruvilhapani/AllSet_GujRERA_Analytics`: GujRERA crawler and parser with a FastAPI backend; notes the portal returns all of Gujarat in one list response and exposes block- and unit-level data (4,520 projects for Ahmedabad district).
- `Vedant121613/maharera-agent-extractor`: Playwright + Tesseract OCR for MahaRERA's CAPTCHA, capturing API responses via network interception into SQLite.
- `yogsbags/500-ai-agents-projects` PR #1: MahaRERA scraper reading the paginated `projects-search-result` listing and the public-view detail calls, writing CSV/JSON.
- `AnuragVolety/web-scraper`: MahaRERA lookup by registration number at `maharerait.mahaonline.gov.in`.
- `charanjit-singh` gist: multithreaded Punjab RERA scraper.

## Official bulk data

None of the authorities offer a CSV/Excel export of the register. MahaRERA publishes some lists as web pages: district-wise QPR non-compliance (`/index.php/district-wise-non-compliance-qpr-projects`), lapsed projects by year, and suspended registrations (388 projects suspended in one 2024 action, 212 pulled for non-compliance in another). These are useful compliance signals and Rera Scanner's model has fields for them.

## What this means for Rera Scanner

- The adapter layer in `src/ingest/adapters/` mirrors the three portal families: `gujarat.ts` (JSON API, endpoints configurable via env), `maharashtra.ts` and `karnataka.ts` (HTML), `htmlTable.ts` (factory for the small server-rendered registers), `aspnet.ts` (factory for WebForms portals). All of them emit the same `NormalizedProject` and go through one upsert pipeline with content-hash change detection.
- Because the portals change markup without notice, adapters match on **labels** rather than positions and every field parser is tolerant. Run `npm run ingest -- --state <slug> --limit 5 --dry-run` after a portal release and diff against the live page.
- Carpet-area comparison needs a second source (the promoter's brochure or project page). The model has `carpetAreaAdvertisedSqm` for it; a brochure reader is a follow-up.
- Be a good citizen: honest User-Agent, ≥1.5 s between requests per host, content-hash so unchanged records cost nothing, and a link back to the portal on every page.
