import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Container, Breadcrumbs, SectionHeading } from "@/components/ui";
import { ScoreBadge } from "@/components/Score";
import { stateStats } from "@/db/queries";
import { STATES } from "@/lib/states";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "RERA authorities by state",
  description: "Every state Real Estate Regulatory Authority in India, with project counts, average Trust Scores and links to the official portals.",
};

export default async function StatesPage() {
  const stats = Object.fromEntries((await stateStats()).map((s) => [s.stateSlug, s]));
  const regions = ["West", "North", "South", "East", "Central", "North-East"] as const;
  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: "States" }]} />
      <h1 className="mt-4 font-display text-3xl font-800">RERA authorities by state</h1>
      <p className="mt-2 max-w-2xl text-fg-muted">
        The Real Estate (Regulation and Development) Act, 2016 is implemented by each state and union territory separately, so there are {STATES.length} registers rather than one. We index the
        larger ones today and list every official portal so you can always verify at source.
      </p>
      {regions.map((region) => {
        const list = STATES.filter((s) => s.region === region);
        if (!list.length) return null;
        return (
          <section key={region} className="mt-12">
            <SectionHeading title={region} />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((s) => {
                const st = stats[s.slug];
                const indexed = s.coverage !== "planned";
                return (
                  <div key={s.slug} className="card flex flex-col p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display font-bold">
                          {indexed ? (
                            <Link href={`/state/${s.slug}`} className="hover:text-brand">
                              {s.name}
                            </Link>
                          ) : (
                            s.name
                          )}
                        </h3>
                        <div className="text-xs text-fg-subtle">{s.authority}</div>
                      </div>
                      {indexed ? <span className="pill pill-strong">Indexed</span> : <span className="pill pill-neutral">Planned</span>}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-fg-muted">{indexed ? `${formatNumber(st?.total ?? 0)} projects` : "Portal only"}</span>
                      {st?.avgScore != null && <ScoreBadge total={st.avgScore} band={st.avgScore >= 75 ? "strong" : st.avgScore >= 50 ? "watch" : "caution"} size="sm" />}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs">
                      <span className="text-fg-subtle">Reg. no. like <span className="mono">{s.regNumberExample.length > 22 ? s.regNumberExample.slice(0, 22) + "…" : s.regNumberExample}</span></span>
                      <a href={s.portalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline">
                        Portal <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </Container>
  );
}
