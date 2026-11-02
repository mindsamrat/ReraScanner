"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Search, UserRound } from "lucide-react";
import clsx from "clsx";

interface Suggestion {
  kind: "project" | "promoter";
  label: string;
  sub: string;
  href: string;
}

export function SearchBox({ compact = false, defaultValue = "", autoFocus = false }: { compact?: boolean; defaultValue?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [dirty, setDirty] = useState(false); // only fetch suggestions once the user has typed
  const wrap = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!dirty || q.trim().length < 2) return;
    const t = setTimeout(async () => {
      abort.current?.abort();
      const ac = new AbortController();
      abort.current = ac;
      try {
        const res = await fetch(`/api/v1/suggest?q=${encodeURIComponent(q.trim())}`, { signal: ac.signal });
        if (!res.ok) return;
        const data = (await res.json()) as { items: Suggestion[] };
        setItems(data.items);
        setOpen(true);
        setActive(-1);
      } catch {
        /* aborted */
      }
    }, 140);
    return () => clearTimeout(t);
  }, [q, dirty]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = q.trim();
    if (!v) return;
    setOpen(false);
    if (active >= 0 && items[active]) {
      router.push(items[active].href);
      return;
    }
    router.push(`/search?q=${encodeURIComponent(v)}`);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open || !items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(-1, a - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrap} className="relative">
      <form onSubmit={submit} role="search" className="relative">
        <Search className={clsx("pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle", compact ? "h-4 w-4" : "h-5 w-5")} />
        <input
          type="search"
          value={q}
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            setDirty(true);
            if (v.trim().length < 2) {
              setItems([]);
              setOpen(false);
            }
          }}
          onFocus={() => items.length && setOpen(true)}
          onKeyDown={onKey}
          autoFocus={autoFocus}
          placeholder={compact ? "Project, builder or RERA number" : "Search by project name, builder, locality or paste a RERA number…"}
          className={clsx("input", compact ? "!py-2 !pl-9 !text-sm" : "!py-4 !pl-11 !pr-28 !text-base shadow-pop")}
          aria-label="Search projects"
          role="combobox"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded={open}
          autoComplete="off"
        />
        {!compact && (
          <button type="submit" className="btn btn-primary absolute right-2 top-1/2 -translate-y-1/2">
            Search
          </button>
        )}
      </form>
      {open && items.length > 0 && (
        <ul id="search-suggestions" className="card absolute z-50 mt-1.5 w-full overflow-hidden p-1 shadow-pop" role="listbox">
          {items.map((it, i) => (
            <li key={it.href} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={clsx("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm", i === active ? "bg-brand-soft" : "hover:bg-bg-sunken")}
                onMouseEnter={() => setActive(i)}
                onClick={() => {
                  setOpen(false);
                  router.push(it.href);
                }}
              >
                {it.kind === "project" ? <Building2 className="h-4 w-4 shrink-0 text-fg-subtle" /> : <UserRound className="h-4 w-4 shrink-0 text-fg-subtle" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{it.label}</span>
                  <span className="block truncate text-xs text-fg-subtle">{it.sub}</span>
                </span>
                <span className="pill pill-neutral">{it.kind}</span>
              </button>
            </li>
          ))}
          <li className="border-t border-line px-3 py-2 text-xs text-fg-subtle">
            Press Enter to see all results for “{q.trim()}”
          </li>
        </ul>
      )}
    </div>
  );
}
