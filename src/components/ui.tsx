import Link from "next/link";
import clsx from "clsx";
import { ChevronRight } from "lucide-react";

export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("mx-auto w-full max-w-7xl px-4 sm:px-6", className)}>{children}</div>;
}

export function Breadcrumbs({ items }: { items: Array<{ href?: string; label: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-fg-subtle">
      <Link href="/" className="hover:text-fg">
        Home
      </Link>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5" />
          {it.href ? (
            <Link href={it.href} className="hover:text-fg">
              {it.label}
            </Link>
          ) : (
            <span className="text-fg-muted">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function StatTile({ label, value, hint, tone, href }: { label: string; value: React.ReactNode; hint?: string; tone?: "strong" | "watch" | "caution" | "brand"; href?: string }) {
  const inner = (
    <div className={clsx("card h-full p-4", href && "card-hover")}>
      <div className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">{label}</div>
      <div className={clsx("mt-1 font-display text-2xl font-800 tnum", tone === "strong" && "text-strong", tone === "watch" && "text-watch", tone === "caution" && "text-caution", tone === "brand" && "text-brand")}>{value}</div>
      {hint && <div className="mt-1 text-xs text-fg-subtle">{hint}</div>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export function SectionHeading({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-xl font-bold sm:text-2xl">{title}</h2>
        {sub && <p className="mt-1 text-sm text-fg-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="card grid place-items-center px-6 py-16 text-center">
      <h3 className="font-display text-lg font-bold">{title}</h3>
      {body && <p className="mt-2 max-w-md text-sm text-fg-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function KeyValue({ rows }: { rows: Array<{ k: string; v: React.ReactNode; mono?: boolean }> }) {
  return (
    <dl className="divide-y divide-line">
      {rows.map((r) => (
        <div key={r.k} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-3 py-2.5 text-sm">
          <dt className="text-fg-subtle">{r.k}</dt>
          <dd className={clsx("text-fg break-words", r.mono && "mono text-[13px]")}>{r.v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = { registered: "pill-brand", completed: "pill-strong", lapsed: "pill-caution", revoked: "pill-caution", expired: "pill-caution", withdrawn: "pill-neutral" };
  const label: Record<string, string> = { registered: "Registered", completed: "Completed", lapsed: "Lapsed", revoked: "Revoked", expired: "Expired", withdrawn: "Withdrawn" };
  return <span className={clsx("pill", map[status] ?? "pill-neutral")}>{label[status] ?? status}</span>;
}
