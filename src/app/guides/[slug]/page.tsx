import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Breadcrumbs } from "@/components/ui";
import { Markdown } from "@/components/Markdown";
import { GUIDES, getGuide } from "@/content/guides";
import { formatDate } from "@/lib/format";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const g = getGuide((await params).slug);
  if (!g) return {};
  return { title: g.title, description: g.description, alternates: { canonical: `/guides/${g.slug}` }, openGraph: { type: "article", title: g.title, description: g.description } };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const g = getGuide((await params).slug);
  if (!g) notFound();
  const jsonLd = { "@context": "https://schema.org", "@type": "Article", headline: g.title, description: g.description, dateModified: g.updated, author: { "@type": "Organization", name: SITE.name }, mainEntityOfPage: `${SITE.url}/guides/${g.slug}` };
  const others = GUIDES.filter((x) => x.slug !== g.slug);
  return (
    <Container className="py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs items={[{ href: "/guides", label: "Guides" }, { label: g.title }]} />
      <article className="mx-auto mt-6 max-w-3xl">
        <h1 className="font-display text-3xl font-800 leading-tight sm:text-4xl">{g.title}</h1>
        <p className="mt-3 text-lg text-fg-muted">{g.description}</p>
        <div className="mt-3 text-xs text-fg-subtle">{g.readingMinutes} min read · Updated {formatDate(g.updated)}</div>
        <div className="mt-8">
          <Markdown source={g.body} />
        </div>
        <div className="card mt-12 p-5">
          <h2 className="font-display font-bold">More guides</h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/guides/${o.slug}`} className="text-brand hover:underline">{o.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      </article>
    </Container>
  );
}
