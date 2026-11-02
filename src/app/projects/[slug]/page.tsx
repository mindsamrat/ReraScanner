import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, MapPin, Share2, AlertTriangle } from "lucide-react";
import { Container, Breadcrumbs, KeyValue, SectionHeading, StatusPill } from "@/components/ui";
import { ScoreRing, ScoreBreakdown, FlagChips, ScoreBadge } from "@/components/Score";
import { PossessionTimeline } from "@/components/Timeline";
import { ProjectCard } from "@/components/ProjectCard";
import { WatchButton } from "@/components/WatchButton";
import { CompareToggle } from "@/components/CompareToggle";
import { getProjectBySlug, similarProjects } from "@/db/queries";
import { getState } from "@/lib/states";
import { formatArea, formatDate, formatMonthYear, formatNumber, relativeTime, TYPE_LABEL } from "@/lib/format";
import { bandMeta } from "@/lib/scoring/score";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const d = await getProjectBySlug((await params).slug);
  if (!d) return {};
  const { project: p, promoter } = d;
  const s = getState(p.stateSlug);
  const title = `${p.name} · ${s?.authority ?? "RERA"} ${p.reraNumber} · ${p.locality ? `${p.locality}, ` : ""}${p.district}`;
  const desc = `${p.name} by ${promoter.name}: ${p.status} ${TYPE_LABEL[p.type]?.toLowerCase()} project in ${p.district}, ${s?.name}. Trust Score ${p.scoreTotal ?? "unrated"}. Promised completion ${formatMonthYear(p.originalCompletionDate)}, ${p.complaintsTotal} complaints on record.`;
  return { title, description: desc, alternates: { canonical: `/projects/${p.slug}` }, openGraph: { title, description: desc, type: "article" } };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const d = await getProjectBySlug((await params).slug);
  if (!d) notFound();
  const { project: p, promoter, score, complaints, extensions, unitMix, documents, professionals } = d;
  const s = getState(p.stateSlug)!;
  const similar = await similarProjects(p, 3);
  const booked = p.totalUnits && p.unitsBooked != null ? Math.round((p.unitsBooked / p.totalUnits) * 100) : null;
  const areaDiff = p.carpetAreaRegisteredSqm && p.carpetAreaAdvertisedSqm ? ((p.carpetAreaAdvertisedSqm - p.carpetAreaRegisteredSqm) / p.carpetAreaRegisteredSqm) * 100 : null;
  const sharePath = `/projects/${p.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: p.name,
    identifier: p.reraNumber,
    url: `${SITE.url}${sharePath}`,
    address: { "@type": "PostalAddress", addressLocality: p.locality ?? p.district, addressRegion: s.name, postalCode: p.pincode ?? undefined, addressCountry: "IN" },
    geo: p.lat && p.lng ? { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lng } : undefined,
    additionalProperty: [
      { "@type": "PropertyValue", name: "RERA registration number", value: p.reraNumber },
      { "@type": "PropertyValue", name: "Registration status", value: p.status },
      { "@type": "PropertyValue", name: "Rera Scanner Trust Score", value: p.scoreTotal ?? "unrated" },
    ],
  };

  return (
    <Container className="py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs items={[{ href: "/state", label: "States" }, { href: `/state/${s.slug}`, label: s.name }, { href: `/state/${s.slug}/projects?district=${encodeURIComponent(p.district)}`, label: p.district }, { label: p.name }]} />

      {/* Header */}
      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={p.status} />
            <span className="pill pill-neutral">{TYPE_LABEL[p.type]}</span>
            <span className="mono rounded bg-bg-sunken px-2 py-0.5 text-xs text-fg-muted">{p.reraNumber}</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-800 leading-tight sm:text-4xl">{p.name}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-fg-muted">
            <MapPin className="h-4 w-4" />
            {p.locality ? `${p.locality}, ` : ""}
            {p.district}, {s.name}
            {p.pincode ? ` · ${p.pincode}` : ""}
          </p>
          <p className="mt-1 text-fg-muted">
            Promoter:{" "}
            <Link href={`/promoters/${promoter.slug}`} className="font-semibold text-fg hover:text-brand">
              {promoter.name}
            </Link>
            {promoter.trackScore != null && (
              <span className="ml-2 align-middle">
                <ScoreBadge total={promoter.trackScore} band={promoter.trackScore >= 75 ? "strong" : promoter.trackScore >= 50 ? "watch" : "caution"} size="sm" />
              </span>
            )}
          </p>
          {p.description && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-fg-muted">{p.description}</p>}
          <FlagChips score={score} max={6} className="mt-4" />
          <div className="mt-5 flex flex-wrap gap-2">
            <WatchButton id={p.id} name={p.name} slug={p.slug} />
            <CompareToggle id={p.id} name={p.name} slug={p.slug} className="!px-4 !py-[0.6rem] !text-sm !rounded-[10px]" />
            <a href={s.projectSearchUrl} target="_blank" rel="noopener noreferrer" className="btn">
              Verify on {s.authority} <ExternalLink className="h-4 w-4" />
            </a>
            <a href={`https://wa.me/?text=${encodeURIComponent(`${p.name} (${p.reraNumber}) — Trust Score ${p.scoreTotal ?? "unrated"}: ${SITE.url}${sharePath}`)}`} target="_blank" rel="noopener noreferrer" className="btn" aria-label="Share on WhatsApp">
              <Share2 className="h-4 w-4" /> Share
            </a>
          </div>
        </div>

        {/* Score card */}
        <aside className="card p-5">
          <div className="flex items-center gap-5">
            <ScoreRing total={p.scoreTotal} band={p.scoreBand} />
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">Rera Scanner Trust Score</div>
              <div className="mt-1 font-display text-lg font-bold">{bandMeta((p.scoreBand ?? "unrated") as never).label}</div>
              <p className="mt-1 text-sm text-fg-muted">{score?.headline}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-fg-subtle">
            <span>Data coverage {score ? Math.round(score.confidence * 100) : 0}%</span>
            <span>Scored {relativeTime(p.scoredAt)}</span>
          </div>
          <Link href="/methodology" className="mt-3 block text-center text-xs text-brand hover:underline">
            How this score is calculated →
          </Link>
        </aside>
      </div>

      {/* Key facts */}
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Registered" value={formatDate(p.registrationDate)} />
        <Fact label="Promised completion" value={formatMonthYear(p.originalCompletionDate)} sub={p.revisedCompletionDate ? `revised to ${formatMonthYear(p.revisedCompletionDate)}` : undefined} tone={p.revisedCompletionDate ? "watch" : undefined} />
        <Fact label={p.actualCompletionDate ? "Completed" : "Units booked"} value={p.actualCompletionDate ? formatMonthYear(p.actualCompletionDate) : booked != null ? `${booked}%` : "—"} sub={p.actualCompletionDate ? undefined : p.totalUnits ? `${formatNumber(p.unitsBooked)} of ${formatNumber(p.totalUnits)} units` : undefined} />
        <Fact label="Complaints" value={`${p.complaintsTotal}`} sub={p.complaintsOpen > 0 ? `${p.complaintsOpen} open${p.appealsOpen ? `, ${p.appealsOpen} on appeal` : ""}` : p.complaintsTotal ? "all disposed" : "none on record"} tone={p.complaintsOpen > 0 ? "caution" : undefined} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-10">
          {/* Timeline */}
          <section className="card p-6">
            <SectionHeading title="Possession timeline" sub="Dates as declared to the regulator. The grey window is the originally promised build period." />
            <PossessionTimeline p={p} />
            {extensions.length > 0 && (
              <div className="mt-6 border-t border-line pt-4">
                <h3 className="text-sm font-semibold">Extensions and revisions on record</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {extensions.map((e) => (
                    <li key={e.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className={`pill ${e.kind === "force-majeure" ? "pill-neutral" : "pill-watch"}`}>{e.kind === "force-majeure" ? "Force majeure" : e.kind === "revision" ? "Revision" : "Extension"}</span>
                      <span className="text-fg-muted">
                        {formatMonthYear(e.previousDate)} → <span className="font-medium text-fg">{formatMonthYear(e.newDate)}</span>
                      </span>
                      {e.reason && <span className="text-fg-subtle">· {e.reason}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Score breakdown */}
          {score && (
            <section className="card p-6">
              <SectionHeading title="Score breakdown" sub="Each component is scored 0–100 and weighted. The total is the weighted mean of the components that had data." />
              <ScoreBreakdown score={score} />
            </section>
          )}

          {/* Complaints */}
          <section className="card p-6">
            <SectionHeading title={`Complaints (${complaints.length})`} sub={complaints.length ? "Complaints filed against this project with the authority, newest first." : "No complaints against this project appear on the authority's record."} />
            {complaints.length > 0 && (
              <ul className="divide-y divide-line">
                {complaints.slice(0, 25).map((c) => (
                  <li key={c.id} className="py-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="mono text-fg-muted">{c.caseNumber}</span>
                      <span className={`pill ${c.status === "open" ? "pill-caution" : c.status === "appeal" ? "pill-watch" : "pill-strong"}`}>{c.status === "appeal" ? "On appeal" : c.status === "open" ? "Open" : "Disposed"}</span>
                      {c.category && <span className="pill pill-neutral capitalize">{c.category}</span>}
                      <span className="text-fg-subtle">filed {formatDate(c.filedOn)}</span>
                    </div>
                    {c.summary && <p className="mt-1.5 text-sm text-fg-muted">{c.summary}</p>}
                    {c.orderSummary && (
                      <p className="mt-1 text-sm">
                        <span className="font-semibold">Order {formatDate(c.orderDate)}:</span> <span className="text-fg-muted">{c.orderSummary}</span>
                      </p>
                    )}
                  </li>
                ))}
                {complaints.length > 25 && <li className="pt-3 text-sm text-fg-subtle">{complaints.length - 25} more on the official portal.</li>}
              </ul>
            )}
          </section>

          {/* Inventory */}
          {unitMix.length > 0 && (
            <section className="card p-6">
              <SectionHeading title="Inventory and carpet area" sub="Unit mix as registered. Where we found advertised areas we show the difference." />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-fg-subtle">
                    <tr className="border-b border-line">
                      <th className="py-2 pr-3 font-semibold">Unit type</th>
                      <th className="py-2 pr-3 text-right font-semibold">Units</th>
                      <th className="py-2 pr-3 text-right font-semibold">Booked</th>
                      <th className="py-2 pr-3 text-right font-semibold">RERA carpet</th>
                      <th className="py-2 text-right font-semibold">Advertised</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unitMix.map((u) => {
                      const diff = u.carpetAreaSqm && u.advertisedCarpetAreaSqm ? ((u.advertisedCarpetAreaSqm - u.carpetAreaSqm) / u.carpetAreaSqm) * 100 : null;
                      return (
                        <tr key={u.id} className="border-b border-line last:border-0">
                          <td className="py-2 pr-3 font-medium">{u.unitType}</td>
                          <td className="py-2 pr-3 text-right tnum">{u.count}</td>
                          <td className="py-2 pr-3 text-right tnum">{u.count ? `${Math.round((u.booked / u.count) * 100)}%` : "—"}</td>
                          <td className="py-2 pr-3 text-right tnum">{u.carpetAreaSqm ? `${u.carpetAreaSqm} m²` : "—"}</td>
                          <td className="py-2 text-right tnum">
                            {u.advertisedCarpetAreaSqm ? (
                              <>
                                {u.advertisedCarpetAreaSqm} m² {diff != null && Math.abs(diff) > 3 && <span className={diff > 0 ? "text-caution" : "text-strong"}>({diff > 0 ? "+" : ""}{diff.toFixed(0)}%)</span>}
                              </>
                            ) : (
                              <span className="text-fg-subtle">n/a</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {areaDiff != null && areaDiff > 3 && (
                <p className="mt-3 flex items-start gap-2 text-sm text-caution">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  On average the advertised carpet area is {areaDiff.toFixed(0)}% larger than what is registered with {s.authority}. Under RERA only the registered carpet area is binding; ask for it in writing.
                </p>
              )}
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="font-display font-bold">Registration details</h2>
            <KeyValue
              rows={[
                { k: "Registration number", v: p.reraNumber, mono: true },
                { k: "Authority", v: <a href={s.portalUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">{s.authority}</a> },
                { k: "Status", v: <StatusPill status={p.status} /> },
                { k: "Project type", v: TYPE_LABEL[p.type] },
                { k: "Land area", v: formatArea(p.landAreaSqm) },
                { k: "Buildings", v: p.totalBuildings ?? "—" },
                { k: "Total units", v: formatNumber(p.totalUnits) },
                { k: "Escrow bank", v: p.escrowBank ?? "—" },
                { k: "Encumbrance", v: p.encumbrance ? <span className="text-watch">Yes, on record</span> : "None recorded" },
                { k: "Litigation disclosed", v: p.litigation ? <span className="text-caution">Yes</span> : "No" },
                { k: "Quarterly updates", v: p.qprDue ? `${p.qprFiled} of ${p.qprDue} filed${p.lastQprDate ? `, last ${formatMonthYear(p.lastQprDate)}` : ""}` : "None due yet" },
              ]}
            />
          </section>

          <section className="card p-5">
            <h2 className="font-display font-bold">Promoter</h2>
            <Link href={`/promoters/${promoter.slug}`} className="mt-2 block font-semibold hover:text-brand">
              {promoter.name}
            </Link>
            <div className="mt-1 text-xs text-fg-subtle">{promoter.address}</div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-bg-sunken p-2"><div className="font-bold tnum">{promoter.projectCount}</div><div className="text-fg-subtle">projects</div></div>
              <div className="rounded-lg bg-bg-sunken p-2"><div className="font-bold tnum text-strong">{promoter.onTimeCount}</div><div className="text-fg-subtle">on time</div></div>
              <div className="rounded-lg bg-bg-sunken p-2"><div className="font-bold tnum text-caution">{promoter.delayedCount}</div><div className="text-fg-subtle">delayed</div></div>
            </div>
            {promoter.cin && <div className="mono mt-3 text-[11px] text-fg-subtle">CIN {promoter.cin}</div>}
          </section>

          {professionals.length > 0 && (
            <section className="card p-5">
              <h2 className="font-display font-bold">Professionals on record</h2>
              <ul className="mt-2 space-y-2 text-sm">
                {professionals.map((pr) => (
                  <li key={pr.id}>
                    <div className="text-xs uppercase tracking-wide text-fg-subtle">{pr.role.replace("-", " ")}</div>
                    <div className="font-medium">{pr.name}</div>
                    {pr.registrationNumber && <div className="mono text-[11px] text-fg-subtle">{pr.registrationNumber}</div>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {documents.length > 0 && (
            <section className="card p-5">
              <h2 className="font-display font-bold">Documents</h2>
              <p className="mt-1 text-xs text-fg-subtle">Filed with the authority. Links open the official portal.</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {documents.map((doc) => (
                  <li key={doc.id}>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-brand hover:underline">
                      {doc.name} <ExternalLink className="h-3 w-3" />
                    </a>
                    {doc.publishedOn && <span className="ml-2 text-xs text-fg-subtle">{formatMonthYear(doc.publishedOn)}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card p-5 text-xs text-fg-subtle">
            <div className="font-semibold text-fg">Source</div>
            <p className="mt-1">
              Read from the {s.authority} public register, last fetched {relativeTime(p.sourceFetchedAt)}. Scores are Rera Scanner&apos;s analysis of that record and are not a regulatory rating. Spotted an error?{" "}
              <a href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent(`Data issue: ${p.reraNumber}`)}`} className="text-brand hover:underline">
                Tell us
              </a>
              .
            </p>
          </section>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-14">
          <SectionHeading title={`Other ${TYPE_LABEL[p.type]?.toLowerCase()} projects in ${p.district}`} action={<Link href={`/state/${s.slug}/projects?district=${encodeURIComponent(p.district)}&type=${p.type}`} className="btn btn-sm">See all</Link>} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((sp) => (
              <ProjectCard key={sp.id} p={sp} showState={false} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}

function Fact({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: string; tone?: "watch" | "caution" }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">{label}</div>
      <div className="mt-1 font-display text-xl font-bold tnum">{value}</div>
      {sub && <div className={`mt-0.5 text-xs ${tone === "watch" ? "text-watch" : tone === "caution" ? "text-caution" : "text-fg-subtle"}`}>{sub}</div>}
    </div>
  );
}
