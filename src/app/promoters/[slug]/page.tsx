import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Breadcrumbs, SectionHeading, StatTile, KeyValue } from "@/components/ui";
import { ScoreRing } from "@/components/Score";
import { ProjectCard } from "@/components/ProjectCard";
import { getPromoterBySlug } from "@/db/queries";
import { getState } from "@/lib/states";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const d = await getPromoterBySlug((await params).slug);
  if (!d) return {};
  const s = getState(d.promoter.stateSlug);
  return {
    title: `${d.promoter.name} — RERA projects and delivery record`,
    description: `${d.promoter.name} has ${d.promoter.projectCount} projects registered with ${s?.authority}. ${d.promoter.onTimeCount} delivered on time, ${d.promoter.delayedCount} delayed, ${d.promoter.openComplaints} open complaints.`,
    alternates: { canonical: `/promoters/${d.promoter.slug}` },
  };
}

export default async function PromoterPage({ params }: { params: Promise<{ slug: string }> }) {
  const d = await getPromoterBySlug((await params).slug);
  if (!d) notFound();
  const { promoter: pr, projects } = d;
  const s = getState(pr.stateSlug)!;
  const concluded = pr.completedCount + pr.delayedCount;
  const onTimeRate = concluded ? Math.round((pr.onTimeCount / concluded) * 100) : null;
  const active = projects.filter((p) => p.status === "registered");
  const done = projects.filter((p) => p.status === "completed");
  const bad = projects.filter((p) => ["lapsed", "revoked", "expired"].includes(p.status));
  const band = pr.trackScore == null ? "unrated" : pr.trackScore >= 75 ? "strong" : pr.trackScore >= 50 ? "watch" : "caution";

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ href: "/promoters", label: "Builders" }, { label: pr.name }]} />
      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <span className="pill pill-neutral capitalize">{pr.type ?? "promoter"}</span>
          <h1 className="mt-3 font-display text-3xl font-800 sm:text-4xl">{pr.name}</h1>
          <p className="mt-2 text-fg-muted">{pr.address}</p>
          <p className="mt-1 text-sm text-fg-muted">
            Registered promoter with{" "}
            <Link href={`/state/${s.slug}`} className="text-brand hover:underline">
              {s.authority}
            </Link>
            .
          </p>
        </div>
        <aside className="card flex items-center gap-5 p-5">
          <ScoreRing total={pr.trackScore} band={band} label={pr.trackScore == null ? "No history" : undefined} />
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">Track record</div>
            <p className="mt-1 text-sm text-fg-muted">
              {pr.trackScore == null ? "Fewer than two concluded projects, so there is no delivery history to score yet." : `${onTimeRate}% of ${concluded} concluded projects delivered on their original date.`}
            </p>
          </div>
        </aside>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatTile label="Projects" value={formatNumber(pr.projectCount)} />
        <StatTile label="Under construction" value={formatNumber(active.length)} tone="brand" />
        <StatTile label="Completed" value={formatNumber(pr.completedCount)} tone="strong" />
        <StatTile label="Delayed or lapsed" value={formatNumber(pr.delayedCount)} tone="caution" hint="past original date" />
        <StatTile label="Open complaints" value={formatNumber(pr.openComplaints)} tone="watch" hint="across portfolio" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-10">
          {bad.length > 0 && (
            <section>
              <SectionHeading title="Lapsed or revoked registrations" sub="Projects that did not complete within their registered timeline." />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{bad.map((p) => <ProjectCard key={p.id} p={p} showState={false} />)}</div>
            </section>
          )}
          <section>
            <SectionHeading title={`Under construction (${active.length})`} />
            {active.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{active.map((p) => <ProjectCard key={p.id} p={p} showState={false} />)}</div> : <p className="text-sm text-fg-muted">None.</p>}
          </section>
          <section>
            <SectionHeading title={`Completed (${done.length})`} />
            {done.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{done.map((p) => <ProjectCard key={p.id} p={p} showState={false} />)}</div> : <p className="text-sm text-fg-muted">None yet.</p>}
          </section>
        </div>
        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="font-display font-bold">Promoter details</h2>
            <KeyValue
              rows={[
                { k: "Entity type", v: <span className="capitalize">{pr.type ?? "—"}</span> },
                { k: "Registered address", v: pr.address ?? "—" },
                { k: "CIN", v: pr.cin ?? "—", mono: true },
                { k: "Website", v: pr.website ? <a href={pr.website} className="text-brand hover:underline" rel="nofollow noopener noreferrer" target="_blank">{pr.website.replace(/^https?:\/\//, "")}</a> : "—" },
                { k: "Authority", v: s.authority },
              ]}
            />
          </section>
          <section className="card p-5 text-sm text-fg-muted">
            <h2 className="font-display font-bold text-fg">How to read this</h2>
            <p className="mt-2">A project counts as delayed if it completed more than two weeks after its original RERA date, if its registration lapsed, or if it is more than six months past its original date and still unfinished.</p>
            <p className="mt-2">Promoters register separately in each state, so the same group may appear under slightly different names elsewhere.</p>
          </section>
        </aside>
      </div>
    </Container>
  );
}
