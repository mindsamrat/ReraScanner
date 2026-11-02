import clsx from "clsx";
import type { FacetCounts, ProjectFilters } from "@/db/queries";
import { STATUS_LABEL, TYPE_LABEL } from "@/lib/format";
import { bandMeta, type Band } from "@/lib/scoring/score";
import { COVERED_STATES } from "@/lib/states";

/**
 * Server-rendered filter sidebar. Plain GET form so every filtered view has a
 * shareable URL and works without JavaScript.
 */
export function Filters({ facets, filters, basePath, hideState = false }: { facets: FacetCounts; filters: ProjectFilters; basePath: string; hideState?: boolean }) {
  const checked = (arr: string[] | undefined, v: string) => !!arr?.includes(v);
  return (
    <form method="get" action={basePath} className="space-y-6 text-sm" id="filters">
      {filters.q && <input type="hidden" name="q" value={filters.q} />}
      {filters.sort && <input type="hidden" name="sort" value={filters.sort} />}

      {!hideState && (
        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">State</legend>
          <select name="state" defaultValue={filters.state ?? ""} className="input !py-2 !text-sm">
            <option value="">All states</option>
            {COVERED_STATES.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </fieldset>
      )}

      {facets.district.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">District</legend>
          <select name="district" defaultValue={filters.district ?? ""} className="input !py-2 !text-sm">
            <option value="">All districts</option>
            {facets.district.map((d) => (
              <option key={d.value} value={d.value}>
                {d.value} ({d.n})
              </option>
            ))}
          </select>
        </fieldset>
      )}

      <FacetGroup name="band" legend="Trust Score" options={["strong", "watch", "caution", "unrated"].map((b) => ({ value: b, label: bandMeta(b as Band).label, n: facets.band.find((x) => x.value === b)?.n ?? 0, cls: `pill-${b}` }))} checked={(v) => checked(filters.band, v)} />
      <FacetGroup name="status" legend="Registration status" options={facets.status.map((s) => ({ value: s.value, label: STATUS_LABEL[s.value] ?? s.value, n: s.n }))} checked={(v) => checked(filters.status, v)} />
      <FacetGroup name="type" legend="Project type" options={facets.type.map((s) => ({ value: s.value, label: TYPE_LABEL[s.value] ?? s.value, n: s.n }))} checked={(v) => checked(filters.type, v)} />

      <fieldset className="space-y-2">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Signals</legend>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="overdue" value="1" defaultChecked={!!filters.overdue} className="accent-[var(--brand)]" />
          Past promised completion date
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="complaints" value="1" defaultChecked={!!filters.hasComplaints} className="accent-[var(--brand)]" />
          Has buyer complaints
        </label>
      </fieldset>

      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary btn-sm flex-1">
          Apply filters
        </button>
        <a href={basePath + (filters.q ? `?q=${encodeURIComponent(filters.q)}` : "")} className="btn btn-sm">
          Reset
        </a>
      </div>
    </form>
  );
}

function FacetGroup({ name, legend, options, checked }: { name: string; legend: string; options: Array<{ value: string; label: string; n: number; cls?: string }>; checked: (v: string) => boolean }) {
  if (!options.length) return null;
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">{legend}</legend>
      <div className="space-y-1.5">
        {options.map((o) => (
          <label key={o.value} className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-1 py-0.5 hover:bg-bg-sunken">
            <span className="flex items-center gap-2">
              <input type="checkbox" name={name} value={o.value} defaultChecked={checked(o.value)} className="accent-[var(--brand)]" />
              <span className={clsx(o.cls && `pill ${o.cls}`)}>{o.label}</span>
            </span>
            <span className="tnum text-xs text-fg-subtle">{o.n}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function SortSelect({ current, basePath, params }: { current: string; basePath: string; params: URLSearchParams }) {
  const opts: Array<[string, string]> = [
    ["relevance", "Relevance"],
    ["score_desc", "Trust Score: high to low"],
    ["score_asc", "Trust Score: low to high"],
    ["newest", "Newest registrations"],
    ["oldest", "Oldest registrations"],
    ["completion", "Completion date"],
    ["complaints", "Most complaints"],
    ["name", "Name A–Z"],
  ];
  return (
    <form method="get" action={basePath} className="flex items-center gap-2 text-sm">
      {[...params.entries()].filter(([k]) => k !== "sort" && k !== "page").map(([k, v], i) => (
        <input key={`${k}-${i}`} type="hidden" name={k} value={v} />
      ))}
      <label htmlFor="sort" className="text-fg-subtle">
        Sort
      </label>
      <select id="sort" name="sort" defaultValue={current} className="input !w-auto !py-1.5 !text-sm">
        {opts.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <button type="submit" className="btn btn-sm">
        Go
      </button>
    </form>
  );
}
