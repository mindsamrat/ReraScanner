import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

export function Pagination({ page, pages, basePath, params }: { page: number; pages: number; basePath: string; params: URLSearchParams }) {
  if (pages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams(params);
    if (p <= 1) sp.delete("page");
    else sp.set("page", String(p));
    const s = sp.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const windowed: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(pages, page + 2); p++) windowed.push(p);
  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      <PageLink href={href(page - 1)} disabled={page <= 1} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </PageLink>
      {windowed[0] > 1 && (
        <>
          <PageLink href={href(1)}>1</PageLink>
          {windowed[0] > 2 && <span className="px-1 text-fg-subtle">…</span>}
        </>
      )}
      {windowed.map((p) => (
        <PageLink key={p} href={href(p)} active={p === page}>
          {p}
        </PageLink>
      ))}
      {windowed.at(-1)! < pages && (
        <>
          {windowed.at(-1)! < pages - 1 && <span className="px-1 text-fg-subtle">…</span>}
          <PageLink href={href(pages)}>{pages}</PageLink>
        </>
      )}
      <PageLink href={href(page + 1)} disabled={page >= pages} aria-label="Next page">
        <ChevronRight className="h-4 w-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({ href, children, active, disabled, ...rest }: { href: string; children: React.ReactNode; active?: boolean; disabled?: boolean; "aria-label"?: string }) {
  const cls = clsx("btn btn-sm min-w-9 tnum", active && "!border-brand !bg-brand !text-brand-ink", disabled && "pointer-events-none opacity-40");
  return disabled ? (
    <span className={cls} {...rest}>
      {children}
    </span>
  ) : (
    <Link href={href} className={cls} aria-current={active ? "page" : undefined} {...rest}>
      {children}
    </Link>
  );
}
