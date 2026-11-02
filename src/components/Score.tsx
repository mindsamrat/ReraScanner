import clsx from "clsx";
import { bandMeta, type Band, type ScoreResult } from "@/lib/scoring/score";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";

export function ScoreBadge({ total, band, size = "md" }: { total: number | null; band: string | null; size?: "sm" | "md" | "lg" }) {
  const b = (band ?? "unrated") as Band;
  const meta = bandMeta(b);
  return (
    <span className={clsx("pill", `pill-${b}`, size === "lg" && "!px-3 !py-1 !text-sm", size === "sm" && "!px-2 !py-0.5 !text-[11px]")} title={meta.description}>
      <span className="tnum font-bold">{total ?? "—"}</span>
      <span className="font-semibold opacity-90">{meta.label}</span>
    </span>
  );
}

export function ScoreRing({ total, band, size = 120, stroke = 10, label }: { total: number | null; band: string | null; size?: number; stroke?: number; label?: string }) {
  const b = (band ?? "unrated") as Band;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total == null ? 0 : total / 100;
  const color = `var(--${b === "unrated" ? "unrated" : b})`;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`Trust score ${total ?? "unrated"} out of 100, ${bandMeta(b).label}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} style={{ transition: "stroke-dasharray 600ms ease" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display text-3xl font-800 leading-none tnum" style={{ color }}>
            {total ?? "—"}
          </div>
          <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">{label ?? bandMeta(b).label}</div>
        </div>
      </div>
    </div>
  );
}

export function FlagIcon({ level, className }: { level: "good" | "warn" | "bad"; className?: string }) {
  if (level === "good") return <CheckCircle2 className={clsx("text-strong", className)} />;
  if (level === "warn") return <AlertTriangle className={clsx("text-watch", className)} />;
  return <XCircle className={clsx("text-caution", className)} />;
}

export function FlagChips({ score, max = 4, className }: { score: ScoreResult | null; max?: number; className?: string }) {
  if (!score) return null;
  const flags = score.components.flatMap((c) => c.flags);
  const order = { bad: 0, warn: 1, good: 2 } as const;
  const sorted = [...flags].sort((a, b) => order[a.level] - order[b.level]).slice(0, max);
  if (!sorted.length) return null;
  return (
    <div className={clsx("flex flex-wrap gap-1.5", className)}>
      {sorted.map((f, i) => (
        <span key={i} className={clsx("pill", f.level === "good" ? "pill-strong" : f.level === "warn" ? "pill-watch" : "pill-caution")}>
          <FlagIcon level={f.level} className="h-3 w-3" />
          {f.text}
        </span>
      ))}
    </div>
  );
}

export function ScoreBreakdown({ score }: { score: ScoreResult }) {
  return (
    <div className="space-y-5">
      {score.components.map((c) => {
        const color = c.score == null ? "var(--unrated)" : c.score >= 75 ? "var(--strong)" : c.score >= 50 ? "var(--watch)" : "var(--caution)";
        return (
          <div key={c.key}>
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{c.label}</h4>
                <span className="pill pill-neutral">weight {c.weight}</span>
              </div>
              <div className="tnum font-display text-lg font-bold" style={{ color }}>
                {c.covered && c.score != null ? `${c.score}` : <span className="text-fg-subtle text-sm font-medium">no data</span>}
              </div>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-sunken">
              <div className="h-full rounded-full" style={{ width: `${c.covered && c.score != null ? c.score : 0}%`, background: color }} />
            </div>
            <ul className="mt-2 space-y-1 text-sm text-fg-muted">
              {c.evidence.map((e, i) => (
                <li key={i} className="flex gap-2">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fg-subtle" />
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
