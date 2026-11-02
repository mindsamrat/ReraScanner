import type { Metadata } from "next";
import { Container, Breadcrumbs } from "@/components/ui";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Public API",
  description: "Free JSON API for RERA project search, lookups by registration number, promoter records and state statistics.",
  alternates: { canonical: "/developers" },
};

const ENDPOINTS = [
  { method: "GET", path: "/api/v1/search", desc: "Search and filter projects. Same parameters as the website: q, state, district, status, type, band, overdue=1, complaints=1, sort, page, pageSize (max 100)." },
  { method: "GET", path: "/api/v1/projects/by-number/{reraNumber}", desc: "Full record for one registration number: score with components and evidence, complaints, extensions, unit mix, documents, professionals, promoter." },
  { method: "GET", path: "/api/v1/projects?ids=1,2,3", desc: "Batch lookup by internal id (max 50). Used by the watchlist." },
  { method: "GET", path: "/api/v1/promoters", desc: "Promoter directory with state, q, sort (projects | track | name | complaints) and page." },
  { method: "GET", path: "/api/v1/promoters/{slug}", desc: "One promoter with aggregates and all their projects." },
  { method: "GET", path: "/api/v1/states", desc: "Every authority with portal URL, technology, registration-number example and index statistics." },
  { method: "GET", path: "/api/v1/states/{state}", desc: "One state's statistics with a per-district breakdown." },
  { method: "GET", path: "/api/v1/suggest?q=", desc: "Typeahead suggestions (projects and promoters)." },
];

export default function DevelopersPage() {
  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: "Public API" }]} />
      <div className="mx-auto mt-6 max-w-3xl">
        <h1 className="font-display text-3xl font-800 sm:text-4xl">Public API</h1>
        <p className="mt-3 text-lg text-fg-muted">Everything on the site is available as JSON, free, with no key. Responses are cached for five minutes and allow cross-origin requests. Please identify your application in the User-Agent and keep to a few requests per second.</p>
        <div className="prose-rs">
          <h2>Endpoints</h2>
        </div>
        <div className="card mt-2 divide-y divide-line">
          {ENDPOINTS.map((e) => (
            <div key={e.path} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="pill pill-brand">{e.method}</span>
                <code className="mono text-sm">{e.path}</code>
              </div>
              <p className="mt-1.5 text-sm text-fg-muted">{e.desc}</p>
            </div>
          ))}
        </div>
        <div className="prose-rs">
          <h2>Example</h2>
          <p>Look up a registration number and print the score headline:</p>
        </div>
        <pre className="mono mt-2 overflow-x-auto rounded-lg bg-bg-sunken p-4 text-xs leading-relaxed">{`curl -s "${SITE.url}/api/v1/projects/by-number/P51700053842" | jq '{name, status, score: .score.total, band: .score.band, headline: .score.headline, verify: .source.portal}'`}</pre>
        <div className="prose-rs">
          <h2>Response shape</h2>
          <p>Every project object has the same shape wherever it appears:</p>
        </div>
        <pre className="mono mt-2 overflow-x-auto rounded-lg bg-bg-sunken p-4 text-xs leading-relaxed">{`{
  "id": 123, "slug": "...", "url": "${SITE.url}/projects/...",
  "reraNumber": "P51700053842", "name": "...", "type": "residential", "status": "registered",
  "state": "maharashtra", "authority": "MahaRERA", "district": "Thane", "locality": "...", "pincode": "...",
  "location": { "lat": 19.2, "lng": 72.9 },
  "promoter": { "name": "...", "slug": "..." },
  "dates": { "registration": "2021-03-01", "originalCompletion": "2024-12-31", "revisedCompletion": null, "actualCompletion": null },
  "extensions": 0,
  "inventory": { "totalUnits": 120, "unitsBooked": 96, "buildings": 2, "landAreaSqm": 4500 },
  "carpetArea": { "registeredSqm": 61.2, "advertisedSqm": 65.0 },
  "complaints": { "total": 3, "open": 1, "appealsOpen": 0 },
  "compliance": { "qprFiled": 11, "qprDue": 12, "lastQpr": "2026-06-30", "escrowBank": "...", "encumbrance": false, "litigation": false },
  "score": { "total": 71, "band": "watch", "confidence": 1, "headline": "...", "scoredAt": "..." },
  "source": { "url": "...", "fetchedAt": "...", "portal": "https://maharera.maharashtra.gov.in" }
}`}</pre>
        <div className="prose-rs">
          <h2>Terms</h2>
          <ul>
            <li>Data is reproduced from public state registers; scores are Rera Scanner&apos;s analysis. Attribute &ldquo;Rera Scanner&rdquo; with a link when you display it.</li>
            <li>Do not present the Trust Score as an official RERA rating.</li>
            <li>Bulk mirroring is fine at a polite rate; if you need the whole dataset, ask and we will send a dump instead.</li>
            <li>The <code>X-Data-Mode</code> response header is <code>sample</code> on demo instances and <code>live</code> on production.</li>
          </ul>
        </div>
      </div>
    </Container>
  );
}
