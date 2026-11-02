"use client";

import { GitCompareArrows, Check } from "lucide-react";
import clsx from "clsx";
import { useCompare } from "@/lib/useLocalList";
import { useMounted } from "@/lib/useMounted";

export function CompareToggle({ id, name, slug, className }: { id: number; name: string; slug: string; className?: string }) {
  const { toggle, has, full } = useCompare();
  const mounted = useMounted();
  const on = mounted && has(id);
  const disabled = mounted && !on && full;
  return (
    <button
      type="button"
      onClick={() => toggle({ id, name, slug })}
      disabled={disabled}
      className={clsx("btn btn-sm", on && "!border-brand !bg-brand-soft !text-brand", disabled && "opacity-50", className)}
      title={disabled ? "You can compare up to 3 projects" : on ? "Remove from compare" : "Add to compare"}
    >
      {on ? <Check className="h-3.5 w-3.5" /> : <GitCompareArrows className="h-3.5 w-3.5" />}
      {on ? "Comparing" : "Compare"}
    </button>
  );
}
