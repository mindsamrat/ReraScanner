import type { Metadata } from "next";
import Link from "next/link";
import { Container, Breadcrumbs } from "@/components/ui";
import { BANDS, WEIGHTS } from "@/lib/scoring/score";

export const metadata: Metadata = {
  title: "How the Trust Score works",
  description: "The full, open formula behind the Rera Scanner Trust Score: five weighted components computed only from official RERA filings, with published thresholds and worked examples.",
  alternates: { canonical: "/methodology" },
};

export default function MethodologyPage() {
  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: "Trust Score methodology" }]} />
      <div className="mx-auto mt-6 max-w-3xl">
        <span className="pill pill-brand">Open methodology · v1</span>
        <h1 className="mt-3 font-display text-3xl font-800 sm:text-4xl">How the Trust Score works</h1>
        <p className="mt-3 text-lg text-fg-muted">
          A 0–100 number computed from the public regulatory record of a project and nothing else. No builder pays to change it, no broker can submit to it, and every input used is shown on the project page so you can check our arithmetic.
        </p>

        <div className="card mt-8 p-5">
          <h2 className="font-display text-lg font-bold">The formula in one line</h2>
          <p className="mono mt-2 rounded-lg bg-bg-sunken p-3 text-sm">score = Σ (component_score × weight) / Σ weight, over components with data</p>
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-fg-subtle">
              <tr><th className="py-2">Component</th><th className="py-2 text-right">Weight</th><th className="py-2 pl-4">What it measures</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr><td className="py-2 font-semibold">Possession record</td><td className="py-2 text-right tnum">{WEIGHTS.possession}</td><td className="py-2 pl-4 text-fg-muted">Delivery against the <em>original</em> completion date declared at registration</td></tr>
              <tr><td className="py-2 font-semibold">Complaints & litigation</td><td className="py-2 text-right tnum">{WEIGHTS.complaints}</td><td className="py-2 pl-4 text-fg-muted">Complaints per 100 units, open complaints, tribunal appeals, disclosed litigation</td></tr>
              <tr><td className="py-2 font-semibold">Promoter track record</td><td className="py-2 text-right tnum">{WEIGHTS.promoter}</td><td className="py-2 pl-4 text-fg-muted">On-time delivery rate across the promoter&apos;s concluded projects in the state</td></tr>
              <tr><td className="py-2 font-semibold">Filings & compliance</td><td className="py-2 text-right tnum">{WEIGHTS.compliance}</td><td className="py-2 pl-4 text-fg-muted">Quarterly progress reports filed vs due, extensions, encumbrance, lapsed registration</td></tr>
              <tr><td className="py-2 font-semibold">Carpet area consistency</td><td className="py-2 text-right tnum">{WEIGHTS.area}</td><td className="py-2 pl-4 text-fg-muted">Registered carpet area vs carpet area in advertisements and listings</td></tr>
            </tbody>
          </table>
        </div>

        <div className="prose-rs mt-8">
          <h2>Bands</h2>
          <p>The total maps to one of three bands. A fourth state, Unrated, is used when less than half of the total weight had data behind it.</p>
          <div className="not-prose grid gap-3 sm:grid-cols-3">
            {BANDS.map((b) => (
              <div key={b.band} className="card p-4">
                <span className={`pill pill-${b.band}`}>{b.label} · {b.min}{b.band === "strong" ? "–100" : b.band === "watch" ? "–74" : "–49"}</span>
                <p className="mt-2 text-sm text-fg-muted">{b.description}</p>
              </div>
            ))}
          </div>

          <h2>1. Possession record ({WEIGHTS.possession} points)</h2>
          <p>We always measure against the original completion date the promoter declared when the project was registered. Extensions granted later are shown on the timeline but do not reset the clock, because the buyer who booked against the original date did not get an extension.</p>
          <ul>
            <li><strong>Completed on or before the original date</strong>: 100.</li>
            <li><strong>Completed late</strong>: starts at 100 and loses 80 points linearly over 36 months of delay, with a floor of 10. Six months late scores about 87; two years late scores about 47.</li>
            <li><strong>Past the latest deadline and still not complete</strong>: starts at 85 and loses points linearly over 36 months from the original date, down to 0.</li>
            <li><strong>Not yet due</strong>: 90, minus 2 points for every month the completion date has been pushed out (cap 40), minus 10 if more than one extension has been granted.</li>
            <li><strong>Registration lapsed, revoked or expired</strong>: 5.</li>
            <li><strong>No completion date published</strong> (common on WBRERA): the component is skipped and confidence drops.</li>
          </ul>

          <h2>2. Complaints & litigation ({WEIGHTS.complaints} points)</h2>
          <p>Complaints are normalised per 100 units so a 600-unit township is comparable with a 30-unit building. Starting from 100:</p>
          <ul>
            <li>minus 9 points per complaint per 100 units, capped at 45;</li>
            <li>minus 10 points per <em>open</em> complaint per 100 units, capped at 30;</li>
            <li>minus 5 points per appeal pending before the appellate tribunal, capped at 15;</li>
            <li>minus 15 if the promoter has disclosed pending litigation over the land or approvals.</li>
          </ul>
          <p>Only complaints recorded by the authority count. Reviews, social media and news coverage are not inputs.</p>

          <h2>3. Promoter track record ({WEIGHTS.promoter} points)</h2>
          <p>A project is <em>concluded</em> when it completed, lapsed, or is more than six months past its original date. For promoters with at least one concluded project: 40 + 60 × (on-time ÷ concluded). Promoters with several projects but nothing concluded get a neutral 70. Up to 25 points are deducted for open complaints across the promoter&apos;s whole portfolio. A promoter whose only project is the one being scored has no history, so this component is skipped.</p>
          <p>Promoters register per state, so the same group may appear under slightly different names in different states and is scored separately in each.</p>

          <h2>4. Filings & compliance ({WEIGHTS.compliance} points)</h2>
          <ul>
            <li>Up to 50 points off for quarterly progress reports not filed (proportional to the shortfall).</li>
            <li>12 points off per extension of registration, capped at 30.</li>
            <li>15 points off if an encumbrance (mortgage or charge) is recorded on the project land.</li>
            <li>40 points off if the registration has lapsed, expired or been revoked.</li>
          </ul>

          <h2>5. Carpet area consistency ({WEIGHTS.area} points)</h2>
          <p>Under RERA only carpet area may be used to sell, and the area registered with the authority is binding. Where we have an advertised carpet area for the same unit types we compare the two: within 3% scores 100; advertised larger than registered loses 6 points per percentage point of overstatement; advertised smaller than registered scores 95. With no advertisement data the component is skipped.</p>

          <h2>Confidence and the Unrated state</h2>
          <p>Each component reports whether its inputs were present. Confidence is the share of total weight with data. The total is the weighted mean over covered components only, so a missing component neither helps nor hurts the project. Below 50% confidence we show Unrated rather than a number.</p>

          <h2>Worked example</h2>
          <p>A 120-unit project promised for December 2024, still unfinished in November 2026 with one extension to June 2026, 4 complaints (2 open), 9 of 12 quarterly updates filed, no encumbrance, advertised area 8% larger than registered, by a promoter who delivered 2 of 3 earlier projects on time:</p>
          <table>
            <thead><tr><th>Component</th><th>Sub-score</th><th>Weight</th><th>Contribution</th></tr></thead>
            <tbody>
              <tr><td>Possession (23 months past original)</td><td>31</td><td>35</td><td>10.9</td></tr>
              <tr><td>Complaints (3.3 per 100 units, 1.7 open)</td><td>53</td><td>25</td><td>13.3</td></tr>
              <tr><td>Promoter (67% on time)</td><td>80</td><td>15</td><td>12.0</td></tr>
              <tr><td>Compliance (75% QPR, 1 extension)</td><td>76</td><td>15</td><td>11.4</td></tr>
              <tr><td>Area (+8%)</td><td>52</td><td>10</td><td>5.2</td></tr>
              <tr><td><strong>Total</strong></td><td></td><td>100</td><td><strong>53 → Watch</strong></td></tr>
            </tbody>
          </table>

          <h2>What the score is not</h2>
          <ul>
            <li>It is not a rating issued or endorsed by any RERA authority.</li>
            <li>It says nothing about construction quality, location, price or resale value.</li>
            <li>It can lag the portal by up to a sync cycle; the project page shows when the record was last read.</li>
            <li>A Strong score is not a guarantee. It means the public record is clean so far.</li>
          </ul>

          <h2>Changes to the formula</h2>
          <p>Any change to weights or thresholds is versioned here and all projects are rescored at once so numbers stay comparable. The current version is v1. The implementation is a single, readable file in the open repository (<code>src/lib/scoring/score.ts</code>) with unit tests.</p>
          <p>
            Questions or a case where the score misleads? <Link href="/data-sources">See how the data is gathered</Link> or write to us.
          </p>
        </div>
      </div>
    </Container>
  );
}
