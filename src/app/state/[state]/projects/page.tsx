import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container, Breadcrumbs } from "@/components/ui";
import { ProjectResults } from "@/components/ProjectResults";
import { facetCounts, listProjects } from "@/db/queries";
import { describeFilters, parseFilters, toSearchParams, type SP } from "@/lib/searchParams";
import { getState } from "@/lib/states";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: { params: Promise<{ state: string }>; searchParams: Promise<SP> }): Promise<Metadata> {
  const s = getState((await params).state);
  if (!s) return {};
  const sp = await searchParams;
  const district = typeof sp.district === "string" ? sp.district : undefined;
  const title = district ? `${district} RERA projects, ${s.name}` : `All ${s.name} RERA projects`;
  const hasFilters = Object.keys(sp).some((k) => !["page", "view", "sort"].includes(k) && k !== "district");
  return {
    title,
    description: `Browse ${s.authority} registered projects${district ? ` in ${district}` : ""} with registration status, completion dates, complaints and Trust Scores.`,
    robots: { index: !hasFilters, follow: true },
    alternates: { canonical: district ? `/state/${s.slug}/projects?district=${encodeURIComponent(district)}` : `/state/${s.slug}/projects` },
  };
}

export default async function StateProjectsPage({ params, searchParams }: { params: Promise<{ state: string }>; searchParams: Promise<SP> }) {
  const slug = (await params).state;
  const s = getState(slug);
  if (!s || s.coverage === "planned") notFound();
  const sp = await searchParams;
  const filters = parseFilters(sp, { state: slug });
  const urlParams = toSearchParams(sp);
  const [result, facets] = await Promise.all([listProjects(filters), facetCounts(filters)]);
  const view = sp.view === "table" ? "table" : "grid";
  const desc = describeFilters(filters);
  const basePath = `/state/${slug}/projects`;

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ href: "/state", label: "States" }, { href: `/state/${slug}`, label: s.name }, { label: "Projects" }]} />
      <h1 className="mt-4 font-display text-3xl font-800">
        {filters.district ? `${filters.district} projects` : `${s.name} projects`}
        {filters.q && <span className="text-fg-muted"> matching “{filters.q}”</span>}
      </h1>
      <p className="mt-2 text-sm text-fg-muted">{desc.length ? `Filtered: ${desc.join(" · ")}` : `Every project registered with ${s.authority}. Use the filters to narrow by district, status, type or Trust Score.`}</p>
      <div className="mt-8">
        <ProjectResults result={result} facets={facets} filters={filters} basePath={basePath} params={urlParams} hideState view={view} />
      </div>
    </Container>
  );
}
