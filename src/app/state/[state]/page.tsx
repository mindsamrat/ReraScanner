import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, ArrowRight } from "lucide-react";
import { Container, Breadcrumbs, SectionHeading, StatTile } from "@/components/ui";
import { ProjectCard } from "@/components/ProjectCard";
import { ScoreBadge } from "@/components/Score";
import { districtStats, listProjects, stateStats, topPromoters } from "@/db/queries";
import { getState, STATES } from "@/lib/states";
import { formatNumber, relativeTime } from "@/lib/format";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const s = getState((await params).state);
  if (!s) return {};
  return {
    title: `${s.name} RERA projects — search, verify and score`,
    description: `Search ${s.authority} registered projects by name, builder or registration number. Possession delays, complaints and Trust Scores for every project in ${s.name}.`,
    alternates: { canonical: `/state/${s.slug}` },
  };
}

export default async function StatePage({ params }: { params: Promise<{ state: string }> }) {
  const slug = (await params).state;
  const s = getState(slug);
  if (!s || s.coverage === "planned") notFound();
  const [[st], districts, promoters, overdue, recent, best] = await Promise.all([
    stateStats(slug),
    districtStats(slug),
    topPromoters(slug, 6),
    listProjects({ state: slug, overdue: true, sort: "complaints", pageSize: 3 }),
    listProjects({ state: slug, sort: "newest", pageSize: 3 }),
    listProjects({ state: slug, band: ["strong"], status: ["registered"], sort: "score_desc", pageSize: 3 }),
  ]);
  if (!st) notFound();
  const bandTotal = st.strong + st.watch + st.caution + st.unrated || 1;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${s.name} RERA projects`,
    url: `${SITE.url}/state/${s.slug}`,
    about: { "@type": "GovernmentOrganization", name: s.authority, url: s.portalUrl },
    numberOfItems: st.total,
  };

  return (
    <Container className="py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs items={[{ href: "/state", label: "States" }, { label: s.name }]} />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-800 sm:text-4xl">{s.name} RERA projects</h1>
          <p className="mt-2 max-w-2xl text-fg-muted">
            {formatNumber(st.total)} projects registered with {s.authority}, from {formatNumber(st.promoters)} promoters across {districts.length} districts. Register last read {relativeTime(st.lastSynced)}.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/state/${s.slug}/projects`} className="btn btn-primary">
            Browse all projects <ArrowRight className="h-4 w-4" />
          </Link>
          <a href={s.projectSearchUrl} target="_blank" rel="noopener noreferrer" className="btn">
            Official portal <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatTile label="Registered" value={formatNumber(st.registered)} href={`/state/${s.slug}/projects?status=registered`} />
        <StatTile label="Completed" value={formatNumber(st.completed)} tone="strong" href={`/state/${s.slug}/projects?status=completed`} />
        <StatTile label="Lapsed / revoked" value={formatNumber(st.lapsed)} tone="caution" href={`/state/${s.slug}/projects?status=lapsed&status=revoked`} />
        <StatTile label="Past promised date" value={formatNumber(st.overdue)} tone="caution" hint="still not complete" href={`/state/${s.slug}/projects?overdue=1&sort=complaints`} />
        <StatTile label="Open complaints" value={formatNumber(st.openComplaints)} tone="watch" href={`/state/${s.slug}/projects?complaints=1&sort=complaints`} />
      </div>

      {/* Score distribution */}
      <div className="card mt-8 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">Trust Score distribution</h2>
          {st.avgScore != null && (
            <div className="flex items-center gap-2 text-sm text-fg-muted">
              State average <ScoreBadge total={st.avgScore} band={st.avgScore >= 75 ? "strong" : st.avgScore >= 50 ? "watch" : "caution"} />
            </div>
          )}
        </div>
        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-bg-sunken">
          <div className="bg-strong" style={{ width: `${(st.strong / bandTotal) * 100}%` }} title={`${st.strong} strong`} />
          <div className="bg-watch" style={{ width: `${(st.watch / bandTotal) * 100}%` }} title={`${st.watch} watch`} />
          <div className="bg-caution" style={{ width: `${(st.caution / bandTotal) * 100}%` }} title={`${st.caution} caution`} />
          <div className="bg-unrated" style={{ width: `${(st.unrated / bandTotal) * 100}%` }} title={`${st.unrated} unrated`} />
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          {[
            ["strong", "Strong", st.strong, "bg-strong"],
            ["watch", "Watch", st.watch, "bg-watch"],
            ["caution", "Caution", st.caution, "bg-caution"],
            ["unrated", "Unrated", st.unrated, "bg-unrated"],
          ].map(([k, label, n, cls]) => (
            <Link key={k as string} href={`/state/${s.slug}/projects?band=${k}`} className="flex items-center gap-2 hover:underline">
              <span className={`h-2.5 w-2.5 rounded-full ${cls}`} />
              <span className="text-fg-muted">{label}</span>
              <span className="font-semibold tnum">{formatNumber(n as number)}</span>
              <span className="text-xs text-fg-subtle">({Math.round(((n as number) / bandTotal) * 100)}%)</span>
            </Link>
          ))}
        </div>
        {s.notes && <p className="mt-4 text-xs text-fg-subtle">{s.notes}</p>}
      </div>

      {/* Districts */}
      <section className="mt-12">
        <SectionHeading title="By district" sub="Where the projects are, and how each district's record compares." />
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-fg-subtle">
              <tr className="border-b border-line">
                <th className="px-4 py-2.5 font-semibold">District</th>
                <th className="px-4 py-2.5 text-right font-semibold">Projects</th>
                <th className="px-4 py-2.5 text-right font-semibold">Past promised date</th>
                <th className="px-4 py-2.5 text-right font-semibold">Avg score</th>
              </tr>
            </thead>
            <tbody>
              {districts.map((d) => (
                <tr key={d.district} className="border-b border-line last:border-0 hover:bg-bg-sunken/60">
                  <td className="px-4 py-2.5">
                    <Link href={`/state/${s.slug}/projects?district=${encodeURIComponent(d.district)}`} className="font-medium hover:text-brand">
                      {d.district}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-right tnum">{d.n}</td>
                  <td className="px-4 py-2.5 text-right tnum">{d.overdue > 0 ? <span className="text-caution">{d.overdue}</span> : "0"}</td>
                  <td className="px-4 py-2.5 text-right">{d.avgScore != null ? <ScoreBadge total={d.avgScore} band={d.avgScore >= 75 ? "strong" : d.avgScore >= 50 ? "watch" : "caution"} size="sm" /> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Promoters */}
      <section className="mt-12">
        <SectionHeading title="Most active builders" sub={`Promoters with the most registered projects in ${s.name}.`} action={<Link href={`/promoters?state=${s.slug}`} className="btn btn-sm">All builders</Link>} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {promoters.map((p) => (
            <Link key={p.id} href={`/promoters/${p.slug}`} className="card card-hover p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="font-display font-bold leading-snug">{p.name}</div>
                {p.trackScore != null ? <ScoreBadge total={p.trackScore} band={p.trackScore >= 75 ? "strong" : p.trackScore >= 50 ? "watch" : "caution"} size="sm" /> : <span className="pill pill-unrated">No history</span>}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div><div className="font-bold tnum">{p.projectCount}</div><div className="text-fg-subtle">projects</div></div>
                <div><div className="font-bold tnum text-strong">{p.onTimeCount}</div><div className="text-fg-subtle">on time</div></div>
                <div><div className="font-bold tnum text-caution">{p.delayedCount}</div><div className="text-fg-subtle">delayed</div></div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {overdue.items.length > 0 && (
        <section className="mt-12">
          <SectionHeading title="Overdue with open complaints" action={<Link href={`/state/${s.slug}/projects?overdue=1&sort=complaints`} className="btn btn-sm">See all</Link>} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{overdue.items.map((p) => <ProjectCard key={p.id} p={p} showState={false} />)}</div>
        </section>
      )}
      {best.items.length > 0 && (
        <section className="mt-12">
          <SectionHeading title="Strong records, still selling" action={<Link href={`/state/${s.slug}/projects?band=strong&status=registered&sort=score_desc`} className="btn btn-sm">See all</Link>} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{best.items.map((p) => <ProjectCard key={p.id} p={p} showState={false} />)}</div>
        </section>
      )}
      <section className="mt-12">
        <SectionHeading title="Recently registered" action={<Link href={`/state/${s.slug}/projects?sort=newest`} className="btn btn-sm">See all</Link>} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{recent.items.map((p) => <ProjectCard key={p.id} p={p} showState={false} />)}</div>
      </section>

      {/* About the portal */}
      <section className="card mt-12 p-6">
        <h2 className="font-display text-lg font-bold">About the {s.authority} register</h2>
        <p className="mt-2 text-sm text-fg-muted">{s.ingestion}</p>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div><div className="text-xs uppercase tracking-wide text-fg-subtle">Portal technology</div><div className="mt-1 font-medium">{s.tech.replace("-", " ")}</div></div>
          <div><div className="text-xs uppercase tracking-wide text-fg-subtle">Registration number format</div><div className="mono mt-1 text-[13px]">{s.regNumberExample}</div></div>
          <div><div className="text-xs uppercase tracking-wide text-fg-subtle">Official search</div><a href={s.projectSearchUrl} className="mt-1 inline-flex items-center gap-1 text-brand hover:underline" target="_blank" rel="noopener noreferrer">{new URL(s.portalUrl).host} <ExternalLink className="h-3 w-3" /></a></div>
        </div>
        <p className="mt-4 text-xs text-fg-subtle">
          Other states: {STATES.filter((x) => x.slug !== s.slug && x.coverage !== "planned").map((x, i) => (<span key={x.slug}>{i > 0 && ", "}<Link href={`/state/${x.slug}`} className="hover:text-fg underline-offset-2 hover:underline">{x.name}</Link></span>))}
        </p>
      </section>
    </Container>
  );
}
