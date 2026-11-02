import clsx from "clsx";
import type { Project } from "@/db/schema";
import { formatDate } from "@/lib/format";
import { fmtMonths, monthsBetween } from "@/lib/scoring/score";

/**
 * Horizontal possession timeline: registration → original promise → revisions → today / actual.
 * Rendered server-side as plain divs so it works without JS and scales to any width.
 */
export function PossessionTimeline({ p }: { p: Project }) {
  const reg = p.registrationDate ? new Date(p.registrationDate) : null;
  const orig = p.originalCompletionDate ? new Date(p.originalCompletionDate) : null;
  const rev = p.revisedCompletionDate ? new Date(p.revisedCompletionDate) : null;
  const act = p.actualCompletionDate ? new Date(p.actualCompletionDate) : null;
  const today = new Date();

  if (!reg || !orig) {
    return <p className="text-sm text-fg-muted">The authority has not published a registration or completion date for this project, so a timeline cannot be drawn.</p>;
  }

  const points: Array<{ date: Date; label: string; kind: "reg" | "orig" | "rev" | "act" | "today" }> = [
    { date: reg, label: "Registered", kind: "reg" },
    { date: orig, label: "Promised completion", kind: "orig" },
  ];
  if (rev && rev.getTime() !== orig.getTime()) points.push({ date: rev, label: "Revised completion", kind: "rev" });
  if (act) points.push({ date: act, label: "Completed", kind: "act" });
  else points.push({ date: today, label: "Today", kind: "today" });

  const min = Math.min(...points.map((x) => x.date.getTime()));
  const max = Math.max(...points.map((x) => x.date.getTime()));
  const span = Math.max(1, max - min);
  const pos = (d: Date) => ((d.getTime() - min) / span) * 100;

  const latest = rev ?? orig;
  const end = act ?? today;
  const slipFromOriginal = monthsBetween(orig, end);
  const status =
    act && slipFromOriginal <= 0.5
      ? { tone: "strong", text: "Delivered on time" }
      : act
        ? { tone: "watch", text: `Delivered ${fmtMonths(slipFromOriginal)} after the original promise` }
        : end > latest
          ? { tone: "caution", text: `${fmtMonths(monthsBetween(latest, end))} past the latest promised date, still not complete` }
          : end > orig
            ? { tone: "watch", text: `Original date passed; revised completion is ${fmtMonths(monthsBetween(end, latest))} away` }
            : { tone: "strong", text: `${fmtMonths(monthsBetween(end, latest))} to the promised completion date` };

  return (
    <div>
      <div className="relative mt-10 mb-12 h-2 rounded-full bg-bg-sunken">
        {/* promised window */}
        <div className="absolute inset-y-0 rounded-full bg-brand/30" style={{ left: `${pos(reg)}%`, width: `${pos(orig) - pos(reg)}%` }} />
        {/* overrun */}
        {end > orig && <div className={clsx("absolute inset-y-0 rounded-r-full", act && slipFromOriginal <= 0.5 ? "bg-strong/40" : "bg-caution/50")} style={{ left: `${pos(orig)}%`, width: `${pos(end) - pos(orig)}%` }} />}
        {points.map((pt, i) => (
          <div key={i} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${pos(pt.date)}%` }}>
            <div
              className={clsx(
                "h-4 w-4 rounded-full border-2 border-bg-elev shadow",
                pt.kind === "reg" && "bg-fg-subtle",
                pt.kind === "orig" && "bg-brand",
                pt.kind === "rev" && "bg-watch",
                pt.kind === "act" && "bg-strong",
                pt.kind === "today" && "bg-fg",
              )}
            />
            <div className={clsx("absolute left-1/2 w-28 -translate-x-1/2 text-center text-[11px] leading-tight", i % 2 === 0 ? "-top-9" : "top-6")}>
              <div className="font-semibold text-fg">{pt.label}</div>
              <div className="text-fg-subtle tnum">{formatDate(pt.date.toISOString(), { month: "short", year: "numeric" })}</div>
            </div>
          </div>
        ))}
      </div>
      <p className={clsx("text-sm font-medium", status.tone === "strong" && "text-strong", status.tone === "watch" && "text-watch", status.tone === "caution" && "text-caution")}>{status.text}</p>
    </div>
  );
}
