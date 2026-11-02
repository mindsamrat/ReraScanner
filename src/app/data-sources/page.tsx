import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Container, Breadcrumbs } from "@/components/ui";
import { recentSyncRuns, stateStats } from "@/db/queries";
import { STATES } from "@/lib/states";
import { ADAPTERS } from "@/ingest/adapters";
import { formatDate, relativeTime } from "@/lib/format";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Where the data comes from",
  description: "Every state RERA portal we read, how each exposes its register, how often we sync, which fields we take and what we deliberately do not use.",
  alternates: { canonical: "/data-sources" },
};

const TECH_LABEL: Record<string, string> = {
  "json-api": "SPA + JSON API",
  "aspnet-postback": "ASP.NET postbacks",
  "server-html": "Server-rendered HTML",
  "php-html": "PHP server-rendered",
  unknown: "Unknown",
};

export default async function DataSourcesPage() {
  const [stats, runs] = await Promise.all([stateStats(), recentSyncRuns(15)]);
  const bySlug = Object.fromEntries(stats.map((s) => [s.stateSlug, s]));
  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: "Data sources" }]} />
      <div className="mx-auto mt-6 max-w-4xl">
        <h1 className="font-display text-3xl font-800 sm:text-4xl">Where the data comes from</h1>
        <p className="mt-3 text-lg text-fg-muted">
          India has no national RERA database. Each state authority runs its own portal, with its own technology, its own registration-number format and its own idea of what a &ldquo;completion date&rdquo; is. Rera Scanner reads those public registers, normalises them into one model, and shows you the result with a link back to the source on every page.
        </p>

        <div className="prose-rs">
          <h2>What we read, and what we refuse to</h2>
          <ul>
            <li><strong>We read</strong> the public project register of each state authority: registration certificate data, promoter details, declared completion dates and extensions, unit inventory where published, quarterly progress reports, complaints and orders, and the lists of lapsed or revoked registrations.</li>
            <li><strong>For the carpet-area check only</strong>, we additionally read the advertised carpet area from the promoter&apos;s own brochure or project page where one is publicly linked from the registration. We do not scrape broker portals.</li>
            <li><strong>We do not take</strong> data from builders, brokers, paid listings or user reviews, and nobody can submit or edit a record. If the authority&apos;s record is wrong, we are wrong in the same way, and we link to the portal so you can see that.</li>
          </ul>

          <h2>How the portals expose their registers</h2>
          <p>None of the authorities publishes a documented API or a bulk download. Every third-party RERA site, including the ones you may have seen before, gets its data the same way we do: by reading the public pages. The portals fall into four technical families, which decides how we ingest them:</p>
          <table>
            <thead><tr><th>Family</th><th>How it works</th><th>How we ingest</th><th>States</th></tr></thead>
            <tbody>
              <tr><td>SPA + JSON API</td><td>An Angular/React front end calls a JSON backend. The browser shows exactly what the API returns.</td><td>Call the same JSON endpoints directly. Fastest and most reliable; includes unit-wise booking data.</td><td>{STATES.filter((s) => s.tech === "json-api").map((s) => s.name).join(", ")}</td></tr>
              <tr><td>Server-rendered HTML</td><td>Classic pages (Java/Spring, Laravel, Django) with search forms and label/value tables.</td><td>Fetch pages politely, parse label/value tables. Robust to layout changes because we match on labels, not positions.</td><td>{STATES.filter((s) => s.tech === "server-html" || s.tech === "php-html").map((s) => s.name).join(", ")}</td></tr>
              <tr><td>ASP.NET WebForms</td><td>Page state lives in hidden <code>__VIEWSTATE</code> fields; paging and search are postbacks.</td><td>Replay the postback sequence, or drive a headless browser when the portal adds a CAPTCHA.</td><td>{STATES.filter((s) => s.tech === "aspnet-postback").map((s) => s.name).join(", ")}</td></tr>
            </tbody>
          </table>

          <h2>Sync cadence</h2>
          <p>Registers change slowly, so we read each state in full every 7 days and re-read any project with an open complaint or a completion date in the past every 48 hours. Change detection is by content hash, so unchanged records cost the portal nothing beyond the page view. Requests are spaced at least 1.5 seconds apart per portal and identify themselves as <code>ReraScannerBot</code> with a contact address.</p>
        </div>

        <h2 className="mt-12 font-display text-2xl font-bold">Portal by portal</h2>
        <p className="mt-1 text-sm text-fg-muted">The {STATES.length} authorities, the technology each uses and the adapter we run against it.</p>
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-fg-subtle">
              <tr className="border-b border-line">
                <th className="px-4 py-2.5 font-semibold">Authority</th>
                <th className="hidden px-4 py-2.5 font-semibold md:table-cell">Portal type</th>
                <th className="hidden px-4 py-2.5 font-semibold lg:table-cell">Registration number</th>
                <th className="px-4 py-2.5 text-right font-semibold">Indexed</th>
                <th className="hidden px-4 py-2.5 text-right font-semibold sm:table-cell">Last read</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {STATES.map((s) => {
                const st = bySlug[s.slug];
                const adapter = ADAPTERS[s.slug];
                return (
                  <tr key={s.slug} className="border-b border-line align-top last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{s.coverage !== "planned" ? <Link href={`/state/${s.slug}`} className="hover:text-brand">{s.name}</Link> : s.name}</div>
                      <a href={s.portalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-brand hover:underline">{new URL(s.portalUrl).host} <ExternalLink className="h-3 w-3" /></a>
                      <p className="mt-1 max-w-md text-xs text-fg-subtle">{adapter?.notes ?? s.ingestion}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-fg-muted md:table-cell">{TECH_LABEL[s.tech]}</td>
                    <td className="mono hidden px-4 py-3 text-[11px] text-fg-muted lg:table-cell">{s.regNumberExample}</td>
                    <td className="px-4 py-3 text-right tnum">{st ? st.total.toLocaleString("en-IN") : "—"}</td>
                    <td className="hidden px-4 py-3 text-right text-fg-muted sm:table-cell">{st?.lastSynced ? relativeTime(st.lastSynced) : "—"}</td>
                    <td className="px-4 py-3">{s.coverage === "live" ? <span className="pill pill-strong">Live</span> : s.coverage === "sample" ? <span className="pill pill-watch">{SITE.dataMode === "sample" ? "Sample" : "Live"}</span> : <span className="pill pill-neutral">Planned</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {runs.length > 0 && (
          <>
            <h2 className="mt-12 font-display text-2xl font-bold">Recent sync runs</h2>
            <div className="card mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-fg-subtle">
                  <tr className="border-b border-line">
                    <th className="px-4 py-2.5 font-semibold">Adapter</th>
                    <th className="px-4 py-2.5 font-semibold">Started</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Fetched</th>
                    <th className="px-4 py-2.5 text-right font-semibold">New</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Updated</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Unchanged</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Errors</th>
                    <th className="px-4 py-2.5 font-semibold">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.id} className="border-b border-line last:border-0">
                      <td className="mono px-4 py-2 text-xs">{r.adapter}</td>
                      <td className="px-4 py-2 text-fg-muted">{formatDate(r.startedAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="px-4 py-2 text-right tnum">{r.fetched}</td>
                      <td className="px-4 py-2 text-right tnum">{r.inserted}</td>
                      <td className="px-4 py-2 text-right tnum">{r.updated}</td>
                      <td className="px-4 py-2 text-right tnum">{r.unchanged}</td>
                      <td className="px-4 py-2 text-right tnum">{r.errors}</td>
                      <td className="px-4 py-2"><span className={`pill ${r.status === "ok" ? "pill-strong" : r.status === "failed" ? "pill-caution" : "pill-watch"}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="prose-rs">
          <h2>Why there is no official API</h2>
          <p>The Act requires each authority to maintain a public website with project details, but says nothing about machine access. A few authorities have discussed an integrated national portal, and a handful of commercial identity-verification vendors resell RERA lookups by scraping the same pages, but as of today the public web page is the only interface. We treat it as one: read gently, cache well, and link back.</p>

          <h2>Corrections</h2>
          <p>If a record here differs from the portal, the portal is right. Email <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> with the registration number and we will re-read it within a day. Promoters who want a record re-read can do the same; nobody can pay to change a score.</p>
        </div>
      </div>
    </Container>
  );
}
