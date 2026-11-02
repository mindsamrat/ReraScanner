"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function MobileNav({ items }: { items: Array<{ href: string; label: string }> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button type="button" className="btn btn-sm !border-transparent !bg-transparent hover:!bg-bg-sunken" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full border-b border-line bg-bg-elev shadow-pop">
          <nav className="mx-auto grid max-w-7xl gap-1 px-4 py-3" aria-label="Mobile">
            {items.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium text-fg-muted hover:bg-bg-sunken hover:text-fg">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
