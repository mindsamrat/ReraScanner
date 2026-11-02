import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { Container, Breadcrumbs, EmptyState, StatusPill } from "@/components/ui";
import { ScoreRing } from "@/components/Score";
import { getProjectsByIds } from "@/db/queries";
import { formatDate, formatMonthYear, formatNumber, TYPE_LABEL } from "@/lib/format";
import { getState } from "@/lib/states";
import type { SP } from "@/lib/searchParams";
import { CompareToggle } from "@/components/CompareToggle";
import { WEIGHTS } from "@/lib/scoring/score";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compare RERA projects side by side",
  description: "Put up to three RERA projects next to each other: Trust Score components, possession dates, complaints, filings and carpet area.",
};

export default async function ComparePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const ids = (typeof sp.ids === "string" ? sp.ids : "")
    .split(",")
    .map((x) => Number(x))
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 3);
  const items = await getProjectsByIds(ids);

  if (!items.length) {
    return (
      <Container className="py-8">
        <Breadcrumbs items={[{ label: "Compare" }]} />
        <h1 className="mt-4 font-display text-3xl font-800">Compare projects</h1>
        <div className="mt-6">
          <EmptyState title="Nothing to compare yet" body="Use the Compare button on any project card or page to add up to three projects, then come back here." action={<Link href="/search" className="btn btn-primary">Find projects</Link>} />
        </div>
      </Container>
    );
  }

  const comps = Object.keys(WEIGHTS) as Array<keyof typeof WEIGHTS>;
  const row = (label: string, render: (d: (typeof items)[number]) => React.ReactNode, cls = "") => (
    <tr className="border-b border-line last:border-0">
      <th scope="row" className="w-44 py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-fg-subtle align-top">{label}</th>
      {items.map((d) => (
        <td key={d.project.id} className={`py-3 pr-4 align-top text-sm ${cls}`}>{render(d)}</td>
      ))}
    </tr>
  );

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: "Compare" }]} />
      <h1 className="mt-4 font-display text-3xl font-800">Compare projects</h1>
      <p className="mt-2 text-fg-muted">Side by side on the record. Higher is better for every score row.</p>
      <div className="card mt-6 overflow-x-auto p-4">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-line">
              <th />
              {items.map((d) => (
                <th key={d.project.id} className="py-3 pr-4 text-left align-top">
                  <Link href={`/projects/${d.project.slug}`} className="font-display text-lg font-bold hover:text-brand">{d.project.name}</Link>
                  <div className="mono mt-1 text-[11px] text-fg-subtle">{d.project.reraNumber}</div>
                  <div className="mt-1 text-xs text-fg-muted">{d.project.district}, {getState(d.project.stateSlug)?.name}</div>
                  <div className="mt-2"><CompareToggle id={d.project.id} name={d.project.name} slug={d.project.slug} /></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {row("Trust Score", (d) => <ScoreRing total={d.project.scoreTotal} band={d.project.scoreBand} size={96} stroke={8} />)}
            {comps.map((k) => (
              <Fragment key={k}>
                {row(`${d(k)} (${WEIGHTS[k]}%)`, (x) => {
                const c = x.score?.components.find((c) => c.key === k);
                if (!c || !c.covered || c.score == null) return <span className="text-fg-subtle">no data</span>;
                const color = c.score >= 75 ? "var(--strong)" : c.score >= 50 ? "var(--watch)" : "var(--caution)";
                return (
                  <div>
                    <div className="flex items-center gap-2"><span className="font-bold tnum" style={{ color }}>{c.score}</span></div>
                    <div className="mt-1 h-1.5 w-full max-w-[160px] rounded-full bg-bg-sunken"><div className="h-full rounded-full" style={{ width: `${c.score}%`, background: color }} /></div>
                    <div className="mt-1 text-xs text-fg-subtle">{c.flags[0]?.text}</div>
                  </div>
                );
              })}
              </Fragment>
            ))}
            {row("Promoter", (x) => <Link href={`/promoters/${x.promoter.slug}`} className="hover:text-brand">{x.promoter.name}</Link>)}
            {row("Status", (x) => <StatusPill status={x.project.status} />)}
            {row("Type", (x) => TYPE_LABEL[x.project.type])}
            {row("Registered", (x) => formatDate(x.project.registrationDate))}
            {row("Promised completion", (x) => formatMonthYear(x.project.originalCompletionDate))}
            {row("Revised completion", (x) => (x.project.revisedCompletionDate ? <span className="text-watch">{formatMonthYear(x.project.revisedCompletionDate)}</span> : "—"))}
            {row("Actual completion", (x) => (x.project.actualCompletionDate ? <span className="text-strong">{formatMonthYear(x.project.actualCompletionDate)}</span> : "Not yet"))}
            {row("Extensions", (x) => x.project.extensionCount)}
            {row("Units", (x) => `${formatNumber(x.project.totalUnits)}${x.project.unitsBooked != null && x.project.totalUnits ? ` (${Math.round((x.project.unitsBooked / x.project.totalUnits) * 100)}% booked)` : ""}`)}
            {row("Complaints", (x) => (
              <>
                {x.project.complaintsTotal} total{x.project.complaintsOpen > 0 && <span className="text-caution">, {x.project.complaintsOpen} open</span>}
              </>
            ))}
            {row("Quarterly updates", (x) => (x.project.qprDue ? `${x.project.qprFiled} / ${x.project.qprDue}` : "none due"))}
            {row("Carpet area RERA vs ads", (x) => {
              const r = x.project.carpetAreaRegisteredSqm, a = x.project.carpetAreaAdvertisedSqm;
              if (!r || !a) return <span className="text-fg-subtle">no ad data</span>;
              const diff = ((a - r) / r) * 100;
              return <span className={diff > 3 ? "text-caution" : "text-strong"}>{r} m² vs {a} m² ({diff > 0 ? "+" : ""}{diff.toFixed(0)}%)</span>;
            })}
            {row("Encumbrance / litigation", (x) => `${x.project.encumbrance ? "Encumbrance" : "No encumbrance"}${x.project.litigation ? ", litigation disclosed" : ""}`)}
          </tbody>
        </table>
      </div>
    </Container>
  );
}

function d(k: string) {
  return { possession: "Possession", complaints: "Complaints", promoter: "Promoter record", compliance: "Compliance", area: "Area honesty" }[k] ?? k;
}
