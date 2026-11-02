import type { FacetCounts, Paginated, ProjectFilters, ProjectListItem } from "@/db/queries";
import { Filters, SortSelect } from "./Filters";
import { Pagination } from "./Pagination";
import { ProjectCard, ProjectRow } from "./ProjectCard";
import { EmptyState } from "./ui";
import Link from "next/link";
import { LayoutGrid, Rows3 } from "lucide-react";
import clsx from "clsx";

/** Shared results layout for /search and /state/[state]/projects. */
export function ProjectResults({ result, facets, filters, basePath, params, hideState, view }: { result: Paginated<ProjectListItem>; facets: FacetCounts; filters: ProjectFilters; basePath: string; params: URLSearchParams; hideState?: boolean; view: "grid" | "table" }) {
  const viewHref = (v: "grid" | "table") => {
    const sp = new URLSearchParams(params);
    sp.set("view", v);
    return `${basePath}?${sp.toString()}`;
  };
  const from = (result.page - 1) * result.pageSize + 1;
  const to = Math.min(result.total, result.page * result.pageSize);
  return (
    <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <details className="card p-4 lg:[&>summary]:hidden" open>
          <summary className="cursor-pointer text-sm font-semibold lg:hidden">Filters</summary>
          <div className="mt-3 lg:mt-0">
            <Filters facets={facets} filters={filters} basePath={basePath} hideState={hideState} />
          </div>
        </details>
      </aside>
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-fg-muted">
            {result.total === 0 ? "No projects" : (
              <>
                Showing <span className="font-semibold text-fg tnum">{from}–{to}</span> of <span className="font-semibold text-fg tnum">{result.total.toLocaleString("en-IN")}</span> projects
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-line-strong p-0.5">
              <Link href={viewHref("grid")} aria-label="Grid view" className={clsx("rounded-md p-1.5", view === "grid" ? "bg-bg-sunken text-fg" : "text-fg-subtle")}>
                <LayoutGrid className="h-4 w-4" />
              </Link>
              <Link href={viewHref("table")} aria-label="Table view" className={clsx("rounded-md p-1.5", view === "table" ? "bg-bg-sunken text-fg" : "text-fg-subtle")}>
                <Rows3 className="h-4 w-4" />
              </Link>
            </div>
            <SortSelect current={filters.sort ?? (filters.q ? "relevance" : "newest")} basePath={basePath} params={params} />
          </div>
        </div>

        {result.items.length === 0 ? (
          <EmptyState
            title="Nothing matched"
            body={filters.q ? `We couldn't find a project, builder or RERA number matching “${filters.q}”. Check the spelling, try fewer words, or search the official state portal.` : "Try removing a filter."}
            action={<Link href="/data-sources" className="btn">See official portals</Link>}
          />
        ) : view === "table" ? (
          <div className="card overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs uppercase tracking-wide text-fg-subtle">
                <tr className="border-b border-line">
                  <th className="px-3 py-2.5 font-semibold">Project</th>
                  <th className="hidden px-3 py-2.5 font-semibold md:table-cell">Builder</th>
                  <th className="hidden px-3 py-2.5 font-semibold lg:table-cell">Location</th>
                  <th className="hidden px-3 py-2.5 font-semibold sm:table-cell">Status</th>
                  <th className="hidden px-3 py-2.5 font-semibold lg:table-cell">Completion</th>
                  <th className="hidden px-3 py-2.5 font-semibold md:table-cell">Complaints</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Score</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((p) => (
                  <ProjectRow key={p.id} p={p} showState={!hideState} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {result.items.map((p) => (
              <ProjectCard key={p.id} p={p} showState={!hideState} />
            ))}
          </div>
        )}

        <div className="mt-8">
          <Pagination page={result.page} pages={result.pages} basePath={basePath} params={params} />
        </div>
      </section>
    </div>
  );
}
