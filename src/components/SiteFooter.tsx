import Link from "next/link";
import { COVERED_STATES } from "@/lib/states";
import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-bg-elev">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="font-display text-lg font-bold">
            Rera<span className="text-brand">Scanner</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-fg-muted">
            Independent project intelligence built from the public registers of India&apos;s state Real Estate Regulatory Authorities. We take no money from
            builders and never alter a score.
          </p>
          <p className="mt-4 text-xs text-fg-subtle">
            Rera Scanner is not affiliated with any RERA authority. Always confirm details on the official state portal before you transact.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold">States</h3>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-fg-muted md:grid-cols-1">
            {COVERED_STATES.map((s) => (
              <li key={s.slug}>
                <Link className="hover:text-fg" href={`/state/${s.slug}`}>
                  {s.name}
                </Link>
              </li>
            ))}
            <li>
              <Link className="text-brand hover:underline" href="/state">
                All states →
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Understand</h3>
          <ul className="mt-3 space-y-2 text-sm text-fg-muted">
            <li><Link className="hover:text-fg" href="/methodology">How the Trust Score works</Link></li>
            <li><Link className="hover:text-fg" href="/data-sources">Where the data comes from</Link></li>
            <li><Link className="hover:text-fg" href="/guides">Homebuyer guides</Link></li>
            <li><Link className="hover:text-fg" href="/guides/how-to-read-a-rera-number">How to read a RERA number</Link></li>
            <li><Link className="hover:text-fg" href="/guides/file-a-rera-complaint">How to file a RERA complaint</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Tools</h3>
          <ul className="mt-3 space-y-2 text-sm text-fg-muted">
            <li><Link className="hover:text-fg" href="/compare">Compare projects</Link></li>
            <li><Link className="hover:text-fg" href="/watchlist">Your watchlist</Link></li>
            <li><Link className="hover:text-fg" href="/promoters">Builder directory</Link></li>
            <li><Link className="hover:text-fg" href="/developers">Public API</Link></li>
            <li><a className="hover:text-fg" href={`mailto:${SITE.contactEmail}`}>Report a data issue</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-fg-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} Rera Scanner. Data © the respective state RERA authorities, reproduced under their public-record terms.</span>
          <span>Scores are our analysis, not a regulatory rating.</span>
        </div>
      </div>
    </footer>
  );
}
