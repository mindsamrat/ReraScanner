import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container, Breadcrumbs } from "@/components/ui";
import { ProjectResults } from "@/components/ProjectResults";
import { SearchBox } from "@/components/SearchBox";
import { facetCounts, getProjectByReraNumber, listProjects } from "@/db/queries";
import { parseFilters, toSearchParams, type SP } from "@/lib/searchParams";
import { detectStateFromRegNumber } from "@/lib/states";
import Link from "next/link";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  return {
    title: q ? `“${q}” — RERA project search` : "Search RERA projects",
    description: q ? `RERA-registered projects, builders and registration numbers matching “${q}”, with Trust Scores and complaint records.` : "Search every RERA-registered project in India by name, builder, locality or registration number.",
    robots: { index: !q, follow: true },
  };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const params = toSearchParams(sp);

  // Exact registration number: go straight to the project.
  if (filters.q && !sp.page) {
    const exact = await getProjectByReraNumber(filters.q);
    if (exact) redirect(`/projects/${exact.slug}`);
  }

  const [result, facets] = await Promise.all([listProjects(filters), facetCounts(filters)]);
  const view = sp.view === "table" ? "table" : "grid";
  const detected = filters.q ? detectStateFromRegNumber(filters.q) : undefined;

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: "Search" }]} />
      <div className="mt-4 max-w-2xl">
        <SearchBox defaultValue={filters.q ?? ""} />
      </div>
      <h1 className="mt-6 font-display text-2xl font-bold sm:text-3xl">{filters.q ? <>Results for “{filters.q}”</> : "All projects"}</h1>
      {detected && result.total === 0 && (
        <p className="mt-2 text-sm text-fg-muted">
          That looks like a {detected.authority} registration number. It is not in our index yet;{" "}
          <a href={detected.projectSearchUrl} target="_blank" rel="noopener noreferrer" className="text-brand underline underline-offset-2">
            check it on the official {detected.name} portal
          </a>
          .
        </p>
      )}
      {!filters.q && <p className="mt-2 text-sm text-fg-muted">Filter by state, status, type and Trust Score, or <Link href="/state" className="text-brand underline underline-offset-2">start from a state</Link>.</p>}
      <div className="mt-8">
        <ProjectResults result={result} facets={facets} filters={filters} basePath="/search" params={params} view={view} />
      </div>
    </Container>
  );
}
