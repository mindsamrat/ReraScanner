import type { Metadata } from "next";
import Link from "next/link";
import { Container, Breadcrumbs, EmptyState } from "@/components/ui";
import { ScoreBadge } from "@/components/Score";
import { Pagination } from "@/components/Pagination";
import { listPromoters } from "@/db/queries";
import { COVERED_STATES, STATE_BY_SLUG } from "@/lib/states";
import type { SP } from "@/lib/searchParams";
import { toSearchParams } from "@/lib/searchParams";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Builder directory — RERA promoter track records",
  description: "Every promoter with a RERA-registered project, ranked by portfolio size and on-time delivery record.",
};

export default async function PromotersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const state = typeof sp.state === "string" ? sp.state : undefined;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const sort = (typeof sp.sort === "string" ? sp.sort : "projects") as "projects" | "track" | "name" | "complaints";
  const page = Number(sp.page ?? 1) || 1;
  const result = await listPromoters({ state, q, sort, page });
  const params = toSearchParams(sp);

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: "Builders" }]} />
      <h1 className="mt-4 font-display text-3xl font-800">Builder directory</h1>
      <p className="mt-2 max-w-2xl text-fg-muted">
        A promoter&apos;s past is the best predictor of your project&apos;s future. The track score is the share of concluded projects delivered on time, minus a penalty for open complaints across the portfolio.
      </p>
      <form method="get" className="card mt-6 flex flex-wrap items-end gap-3 p-4" action="/promoters">
        <label className="flex-1 min-w-[200px] text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-fg-subtle">Name</span>
          <input name="q" defaultValue={q ?? ""} className="input !py-2 !text-sm" placeholder="Search builders" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-fg-subtle">State</span>
          <select name="state" defaultValue={state ?? ""} className="input !w-auto !py-2 !text-sm">
            <option value="">All states</option>
            {COVERED_STATES.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-fg-subtle">Sort</span>
          <select name="sort" defaultValue={sort} className="input !w-auto !py-2 !text-sm">
            <option value="projects">Most projects</option>
            <option value="track">Best track record</option>
            <option value="complaints">Most open complaints</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
        <button className="btn btn-primary">Apply</button>
      </form>

      <p className="mt-6 text-sm text-fg-muted">{result.total.toLocaleString("en-IN")} builders</p>
      {result.items.length === 0 ? (
        <div className="mt-4"><EmptyState title="No builders matched" body="Try a shorter name or clear the state filter." /></div>
      ) : (
        <div className="card mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-fg-subtle">
              <tr className="border-b border-line">
                <th className="px-4 py-2.5 font-semibold">Builder</th>
                <th className="hidden px-4 py-2.5 font-semibold md:table-cell">State</th>
                <th className="px-4 py-2.5 text-right font-semibold">Projects</th>
                <th className="hidden px-4 py-2.5 text-right font-semibold sm:table-cell">On time</th>
                <th className="hidden px-4 py-2.5 text-right font-semibold sm:table-cell">Delayed</th>
                <th className="hidden px-4 py-2.5 text-right font-semibold lg:table-cell">Open complaints</th>
                <th className="hidden px-4 py-2.5 text-right font-semibold lg:table-cell">Avg project score</th>
                <th className="px-4 py-2.5 text-right font-semibold">Track record</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0 hover:bg-bg-sunken/60">
                  <td className="px-4 py-3">
                    <Link href={`/promoters/${p.slug}`} className="font-semibold hover:text-brand">{p.name}</Link>
                    <div className="text-xs text-fg-subtle capitalize">{p.type ?? ""}</div>
                  </td>
                  <td className="hidden px-4 py-3 text-fg-muted md:table-cell">{STATE_BY_SLUG[p.stateSlug]?.name}</td>
                  <td className="px-4 py-3 text-right tnum">{p.projectCount}</td>
                  <td className="hidden px-4 py-3 text-right tnum text-strong sm:table-cell">{p.onTimeCount}</td>
                  <td className="hidden px-4 py-3 text-right tnum text-caution sm:table-cell">{p.delayedCount}</td>
                  <td className="hidden px-4 py-3 text-right tnum lg:table-cell">{p.openComplaints}</td>
                  <td className="hidden px-4 py-3 text-right lg:table-cell">{p.avgScore != null ? <ScoreBadge total={p.avgScore} band={p.avgScore >= 75 ? "strong" : p.avgScore >= 50 ? "watch" : "caution"} size="sm" /> : "—"}</td>
                  <td className="px-4 py-3 text-right">{p.trackScore != null ? <ScoreBadge total={p.trackScore} band={p.trackScore >= 75 ? "strong" : p.trackScore >= 50 ? "watch" : "caution"} size="sm" /> : <span className="pill pill-unrated">No history</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-8"><Pagination page={result.page} pages={result.pages} basePath="/promoters" params={params} /></div>
    </Container>
  );
}
