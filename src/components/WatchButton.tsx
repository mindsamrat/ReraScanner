"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import clsx from "clsx";
import { useWatchlist } from "@/lib/useLocalList";
import { useMounted } from "@/lib/useMounted";

export function WatchButton({ id, name, slug, className }: { id: number; name: string; slug: string; className?: string }) {
  const { toggle, has } = useWatchlist();
  const mounted = useMounted();
  const on = mounted && has(id);
  return (
    <button type="button" onClick={() => toggle({ id, name, slug })} className={clsx("btn", on && "!border-brand !bg-brand-soft !text-brand", className)}>
      {on ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      {on ? "Watching" : "Watch this project"}
    </button>
  );
}
