"use client";

import { useEffect, useState } from "react";
import { useMounted } from "@/lib/useMounted";
import Link from "next/link";
import { X } from "lucide-react";
import { useWatchlist } from "@/lib/useLocalList";
import { ScoreBadge } from "@/components/Score";
import { EmptyState, StatusPill } from "@/components/ui";

interface ApiProject {
  id: number;
  slug: string;
  name: string;
  reraNumber: string;
  state: string;
  district: string;
  status: string;
  promoter: { name: string; slug: string };
  score: { total: number | null; band: string | null };
  complaints: { total: number; open: number };
  dates: { originalCompletion: string | null; revisedCompletion: string | null; actualCompletion: string | null };
}

export function WatchlistClient() {
  const { items, remove } = useWatchlist();
  const [data, setData] = useState<ApiProject[]>([]);
  const mounted = useMounted();
  const ids = items.map((i) => i.id).join(",");

  useEffect(() => {
    if (!ids) return;
    const ac = new AbortController();
    fetch(`/api/v1/projects?ids=${ids}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((j: { items: ApiProject[] }) => setData(j.items))
      .catch(() => {});
    return () => ac.abort();
  }, [ids]);

  if (!mounted) return <div className="card h-40 animate-pulse" />;
  if (!items.length) {
    return <EmptyState title="Your watchlist is empty" body="Open any project and press “Watch this project”. It will appear here with its latest score and status." action={<Link href="/search" className="btn btn-primary">Find a project</Link>} />;
  }
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-fg-subtle">
          <tr className="border-b border-line">
            <th className="px-4 py-2.5 font-semibold">Project</th>
            <th className="hidden px-4 py-2.5 font-semibold md:table-cell">Builder</th>
            <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Status</th>
            <th className="hidden px-4 py-2.5 font-semibold lg:table-cell">Completion</th>
            <th className="hidden px-4 py-2.5 text-right font-semibold md:table-cell">Complaints</th>
            <th className="px-4 py-2.5 text-right font-semibold">Score</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((it) => {
            const p = data.find((d) => d.id === it.id);
            return (
              <tr key={it.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/projects/${it.slug}`} className="font-semibold hover:text-brand">{it.name}</Link>
                  {p && <div className="mono mt-0.5 text-[11px] text-fg-subtle">{p.reraNumber} · {p.district}</div>}
                </td>
                <td className="hidden px-4 py-3 text-fg-muted md:table-cell">{p ? <Link href={`/promoters/${p.promoter.slug}`} className="hover:text-brand">{p.promoter.name}</Link> : "—"}</td>
                <td className="hidden px-4 py-3 sm:table-cell">{p ? <StatusPill status={p.status} /> : "—"}</td>
                <td className="hidden px-4 py-3 text-fg-muted lg:table-cell">{p ? (p.dates.actualCompletion ?? p.dates.revisedCompletion ?? p.dates.originalCompletion ?? "—")?.slice(0, 7) : "—"}</td>
                <td className="hidden px-4 py-3 text-right tnum md:table-cell">{p ? <>{p.complaints.total}{p.complaints.open > 0 && <span className="text-caution"> ({p.complaints.open} open)</span>}</> : "—"}</td>
                <td className="px-4 py-3 text-right">{p ? <ScoreBadge total={p.score.total} band={p.score.band} size="sm" /> : "—"}</td>
                <td className="px-2 py-3 text-right">
                  <button type="button" onClick={() => remove(it.id)} className="btn btn-sm !border-transparent" aria-label={`Remove ${it.name}`}>
                    <X className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
