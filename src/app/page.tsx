import Link from "next/link";
import { ArrowRight, ShieldCheck, Scale, FileSearch, TimerReset, Gauge, Building2 } from "lucide-react";
import { SearchBox } from "@/components/SearchBox";
import { Container, SectionHeading, StatTile } from "@/components/ui";
import { ProjectCard } from "@/components/ProjectCard";
import { ScoreBadge } from "@/components/Score";
import { globalStats, listProjects, stateStats } from "@/db/queries";
import { STATE_BY_SLUG, STATES, COVERED_STATES } from "@/lib/states";
import { formatNumber, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [stats, states, overdue, strong] = await Promise.all([
    globalStats(),
    stateStats(),
    listProjects({ overdue: true, sort: "complaints", pageSize: 6 }),
    listProjects({ band: ["strong"], status: ["registered"], sort: "score_desc", pageSize: 6 }),
  ]);
  const statsBySlug = Object.fromEntries(states.map((s) => [s.stateSlug, s]));

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line bg-bg-elev">
        <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
        <Container className="relative py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center fade-up">
            <span className="pill pill-brand mb-5">Built only from official RERA filings</span>
            <h1 className="font-display text-4xl font-800 leading-[1.08] sm:text-6xl">
              Check any RERA project <span className="text-brand">before</span> you pay a rupee.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-fg-muted sm:text-lg">
              Search {formatNumber(stats.projects)} registered projects across {stats.states} states. See every possession delay, complaint and missing filing, then
              read a transparent 0–100 Trust Score you can audit line by line.
            </p>
            <div className="mx-auto mt-8 max-w-2xl text-left">
              <SearchBox autoFocus />
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-subtle">
                <span>Try:</span>
                {["Heights Pune", "P517", "Whitefield", "Kokapet", "Vighnesh Estates"].map((t) => (
                  <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="underline underline-offset-2 hover:text-fg">
                    {t}
                  </Link>
                ))}
                <span className="ml-auto">Paste a RERA number to jump straight to the project.</span>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Projects indexed" value={formatNumber(stats.projects)} hint={`${stats.states} states live`} />
            <StatTile label="Builders profiled" value={formatNumber(stats.promoters)} hint="With delivery track records" />
            <StatTile label="Past promised date" value={formatNumber(stats.overdue)} hint="Still not complete" tone="caution" href="/search?overdue=1&sort=complaints" />
            <StatTile label="Open complaints" value={formatNumber(stats.openComplaints)} hint="Pending before authorities" tone="watch" href="/search?complaints=1&sort=complaints" />
          </div>
          <p className="mt-4 text-center text-xs text-fg-subtle">Register last synced {relativeTime(stats.lastSynced)}.</p>
        </Container>
      </section>

      {/* States */}
      <Container className="py-16">
        <SectionHeading title="Browse by state" sub="Each state runs its own RERA portal. We bring them into one place with one scoring model." action={<Link href="/state" className="btn btn-sm">All {STATES.length} authorities <ArrowRight className="h-4 w-4" /></Link>} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {COVERED_STATES.map((s) => {
            const st = statsBySlug[s.slug];
            return (
              <Link key={s.slug} href={`/state/${s.slug}`} className="card card-hover p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-display font-bold">{s.name}</div>
                    <div className="text-xs text-fg-subtle">{s.authority}</div>
                  </div>
                  <span className="mono rounded bg-bg-sunken px-1.5 py-0.5 text-[11px] text-fg-muted">{s.code}</span>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <div className="font-display text-2xl font-800 tnum">{formatNumber(st?.total ?? 0)}</div>
                    <div className="text-xs text-fg-subtle">projects</div>
                  </div>
                  {st?.avgScore != null && (
                    <div className="text-right">
                      <div className="text-xs text-fg-subtle">avg score</div>
                      <ScoreBadge total={st.avgScore} band={st.avgScore >= 75 ? "strong" : st.avgScore >= 50 ? "watch" : "caution"} size="sm" />
                    </div>
                  )}
                </div>
                {st && st.overdue > 0 && <div className="mt-2 text-xs text-caution">{st.overdue} past promised date</div>}
              </Link>
            );
          })}
        </div>
      </Container>

      {/* How it works */}
      <section className="border-y border-line bg-bg-elev">
        <Container className="py-16">
          <SectionHeading title="What we check on every project" sub="Five signals from the regulator's own record. Nothing from builders, brokers or paid listings." action={<Link href="/methodology" className="btn btn-sm">Read the methodology</Link>} />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[
              { icon: TimerReset, title: "Possession record", w: 35, body: "Did the project finish when the promoter told the regulator it would? Delays are measured against the original date, not the latest extension." },
              { icon: Scale, title: "Complaints & litigation", w: 25, body: "Buyer complaints filed with the authority, open appeals before the tribunal and disclosed litigation, normalised per 100 units." },
              { icon: Building2, title: "Builder track record", w: 15, body: "On-time delivery rate across every project the same promoter has registered in the state, plus their portfolio-wide open complaints." },
              { icon: FileSearch, title: "Filings & compliance", w: 15, body: "Quarterly progress reports actually filed versus due, extensions granted, encumbrances on the land and lapsed registrations." },
              { icon: Gauge, title: "Carpet area honesty", w: 10, body: "The carpet area registered with RERA compared against what the brochure and listings advertise. Overstating is a red flag." },
            ].map((c) => (
              <div key={c.title} className="card p-5">
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-brand">
                    <c.icon className="h-5 w-5" />
                  </span>
                  <span className="pill pill-neutral">{c.w}%</span>
                </div>
                <h3 className="mt-3 font-display font-bold">{c.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{c.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-fg-muted">
            <ShieldCheck className="h-5 w-5 text-strong" />
            Every score shows which inputs were available. When the record is thin, we say <span className="pill pill-unrated">Unrated</span> instead of guessing.
          </div>
        </Container>
      </section>

      {/* Lists */}
      <Container className="py-16">
        <SectionHeading title="Overdue and under pressure" sub="Projects past their promised completion date with the most open complaints right now." action={<Link href="/search?overdue=1&sort=complaints" className="btn btn-sm">See all overdue</Link>} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {overdue.items.map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </div>
      </Container>
      <Container className="pb-16">
        <SectionHeading title="Strong records, still selling" sub="Registered projects whose promoters have delivered on time before and have a clean complaint record." action={<Link href="/search?band=strong&status=registered&sort=score_desc" className="btn btn-sm">See all strong</Link>} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {strong.items.map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </div>
      </Container>

      {/* CTA */}
      <Container className="pb-8">
        <div className="card overflow-hidden bg-gradient-to-br from-brand-soft to-bg-elev p-8 sm:p-12">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="font-display text-2xl font-800 sm:text-3xl">Where does this data come from?</h2>
              <p className="mt-3 text-fg-muted">
                From the {STATES.length} state regulators themselves. We explain each portal, how often it is read and exactly which fields we take. No scraped broker listings, no builder submissions.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/data-sources" className="btn btn-primary">Data sources</Link>
                <Link href="/developers" className="btn">Public API</Link>
              </div>
            </div>
            <ul className="grid gap-2 text-sm">
              {["maharashtra", "gujarat", "karnataka", "uttarpradesh"].map((s) => (
                <li key={s} className="flex items-center justify-between rounded-lg bg-bg-elev/70 px-3 py-2">
                  <span className="font-medium">{STATE_BY_SLUG[s].authority}</span>
                  <span className="text-xs text-fg-subtle">{STATE_BY_SLUG[s].tech.replace("-", " ")}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </>
  );
}
