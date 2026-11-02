"use client";

import Link from "next/link";
import { X, GitCompareArrows } from "lucide-react";
import { useCompare } from "@/lib/useLocalList";
import { useMounted } from "@/lib/useMounted";

export function CompareTray() {
  const { items, remove, clear } = useCompare();
  const mounted = useMounted();
  if (!mounted || items.length === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 sm:px-6">
      <div className="card mx-auto flex max-w-3xl flex-wrap items-center gap-2 p-2 pl-3 shadow-pop">
        <GitCompareArrows className="h-4 w-4 text-brand" />
        <span className="text-sm font-semibold">Compare</span>
        <div className="flex flex-1 flex-wrap gap-1.5">
          {items.map((it) => (
            <span key={it.id} className="pill pill-neutral !py-1">
              <span className="max-w-[160px] truncate">{it.name}</span>
              <button type="button" aria-label={`Remove ${it.name}`} onClick={() => remove(it.id)} className="rounded-full hover:text-caution">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <button type="button" className="btn btn-sm" onClick={clear}>
          Clear
        </button>
        <Link href={`/compare?ids=${items.map((i) => i.id).join(",")}`} className="btn btn-sm btn-primary">
          Compare {items.length}
        </Link>
      </div>
    </div>
  );
}
