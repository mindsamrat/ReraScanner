import type { Metadata } from "next";
import Link from "next/link";
import { Clock } from "lucide-react";
import { Container, Breadcrumbs } from "@/components/ui";
import { GUIDES } from "@/content/guides";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Homebuyer guides",
  description: "Plain-language guides to checking a RERA project, reading registration numbers, filing complaints and understanding lapsed registrations.",
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: "Guides" }]} />
      <h1 className="mt-4 font-display text-3xl font-800">Homebuyer guides</h1>
      <p className="mt-2 max-w-2xl text-fg-muted">Short, practical explainers written from the Act and the authorities&apos; own rules. No legal jargon, no sales pitch.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {GUIDES.map((g) => (
          <Link key={g.slug} href={`/guides/${g.slug}`} className="card card-hover p-5">
            <h2 className="font-display text-lg font-bold leading-snug">{g.title}</h2>
            <p className="mt-2 text-sm text-fg-muted">{g.description}</p>
            <div className="mt-4 flex items-center gap-3 text-xs text-fg-subtle">
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{g.readingMinutes} min read</span>
              <span>Updated {formatDate(g.updated)}</span>
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
