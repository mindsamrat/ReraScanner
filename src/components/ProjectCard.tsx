import Link from "next/link";
import { MapPin, CalendarClock, MessageSquareWarning } from "lucide-react";
import type { ProjectListItem } from "@/db/queries";
import { ScoreBadge, FlagChips } from "./Score";
import { StatusPill } from "./ui";
import { formatMonthYear, TYPE_LABEL } from "@/lib/format";
import { STATE_BY_SLUG } from "@/lib/states";
import type { ScoreResult } from "@/lib/scoring/score";
import { CompareToggle } from "./CompareToggle";

export function ProjectCard({ p, showState = true }: { p: ProjectListItem; showState?: boolean }) {
  const score = p.scoreBreakdown as ScoreResult | null;
  const deadline = p.revisedCompletionDate ?? p.originalCompletionDate;
  return (
    <article className="card card-hover relative flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/projects/${p.slug}`} className="font-display text-base font-bold leading-snug hover:text-brand">
            <span className="absolute inset-0" aria-hidden />
            {p.name}
          </Link>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-fg-subtle">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">
              {p.locality ? `${p.locality}, ` : ""}
              {p.district}
              {showState ? `, ${STATE_BY_SLUG[p.stateSlug]?.name ?? p.stateSlug}` : ""}
            </span>
          </div>
        </div>
        <ScoreBadge total={p.scoreTotal} band={p.scoreBand} />
      </div>
      <div className="mt-3 mono text-[12px] text-fg-muted">{p.reraNumber}</div>
      <div className="mt-2 text-sm text-fg-muted">
        by{" "}
        <Link href={`/promoters/${p.promoterSlug}`} className="relative z-10 font-medium text-fg hover:text-brand">
          {p.promoterName}
        </Link>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
        <StatusPill status={p.status} />
        <span className="pill pill-neutral">{TYPE_LABEL[p.type] ?? p.type}</span>
        {deadline && (
          <span className="pill pill-neutral">
            <CalendarClock className="h-3 w-3" />
            {p.status === "completed" ? `Done ${formatMonthYear(p.actualCompletionDate)}` : `Due ${formatMonthYear(deadline)}`}
          </span>
        )}
        {p.complaintsOpen > 0 && (
          <span className="pill pill-caution">
            <MessageSquareWarning className="h-3 w-3" />
            {p.complaintsOpen} open
          </span>
        )}
      </div>
      <FlagChips score={score} max={2} className="mt-3" />
      <div className="relative z-10 mt-auto flex items-center justify-between pt-4">
        <span className="text-xs text-fg-subtle">{p.totalUnits ? `${p.totalUnits} units` : ""}</span>
        <CompareToggle id={p.id} name={p.name} slug={p.slug} />
      </div>
    </article>
  );
}

export function ProjectRow({ p, showState = true }: { p: ProjectListItem; showState?: boolean }) {
  const deadline = p.revisedCompletionDate ?? p.originalCompletionDate;
  return (
    <tr className="border-b border-line last:border-0 hover:bg-bg-sunken/60">
      <td className="px-3 py-3">
        <Link href={`/projects/${p.slug}`} className="font-semibold hover:text-brand">
          {p.name}
        </Link>
        <div className="mono mt-0.5 text-[11px] text-fg-subtle">{p.reraNumber}</div>
      </td>
      <td className="hidden px-3 py-3 text-sm text-fg-muted md:table-cell">
        <Link href={`/promoters/${p.promoterSlug}`} className="hover:text-brand">
          {p.promoterName}
        </Link>
      </td>
      <td className="hidden px-3 py-3 text-sm text-fg-muted lg:table-cell">
        {p.district}
        {showState ? `, ${STATE_BY_SLUG[p.stateSlug]?.code ?? ""}` : ""}
      </td>
      <td className="hidden px-3 py-3 sm:table-cell">
        <StatusPill status={p.status} />
      </td>
      <td className="hidden px-3 py-3 text-sm text-fg-muted tnum lg:table-cell">{p.status === "completed" ? formatMonthYear(p.actualCompletionDate) : formatMonthYear(deadline)}</td>
      <td className="hidden px-3 py-3 text-sm tnum md:table-cell">
        {p.complaintsTotal}
        {p.complaintsOpen > 0 && <span className="ml-1 text-caution">({p.complaintsOpen} open)</span>}
      </td>
      <td className="px-3 py-3 text-right">
        <ScoreBadge total={p.scoreTotal} band={p.scoreBand} size="sm" />
      </td>
    </tr>
  );
}
