import Link from "next/link";
import { ScanSearch } from "lucide-react";
import { SearchBox } from "./SearchBox";
import { ThemeToggle } from "./ThemeToggle";
import { MobileNav } from "./MobileNav";

const NAV = [
  { href: "/state", label: "States" },
  { href: "/promoters", label: "Builders" },
  { href: "/compare", label: "Compare" },
  { href: "/methodology", label: "Trust Score" },
  { href: "/data-sources", label: "Data sources" },
  { href: "/guides", label: "Guides" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-display text-lg font-800 tracking-tight" aria-label="Rera Scanner home">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-ink">
            <ScanSearch className="h-5 w-5" strokeWidth={2.4} />
          </span>
          <span className="font-bold">
            Rera<span className="text-brand">Scanner</span>
          </span>
        </Link>

        <div className="hidden flex-1 md:block md:max-w-xl">
          <SearchBox compact />
        </div>

        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-md px-3 py-2 text-sm font-medium text-fg-muted hover:bg-bg-sunken hover:text-fg">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 lg:ml-2">
          <Link href="/watchlist" className="hidden rounded-md px-3 py-2 text-sm font-medium text-fg-muted hover:bg-bg-sunken hover:text-fg sm:block">
            Watchlist
          </Link>
          <ThemeToggle />
          <MobileNav items={[...NAV, { href: "/watchlist", label: "Watchlist" }]} />
        </div>
      </div>
      <div className="border-t border-line px-4 py-2 md:hidden">
        <SearchBox compact />
      </div>
    </header>
  );
}
