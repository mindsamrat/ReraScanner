import type { MetadataRoute } from "next";
import { allProjectSlugs, allPromoterSlugs } from "@/db/queries";
import { COVERED_STATES } from "@/lib/states";
import { GUIDES } from "@/content/guides";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const base = SITE.url;
  const fixed: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/state`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/promoters`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/methodology`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/data-sources`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/developers`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/guides`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    ...GUIDES.map((g) => ({ url: `${base}/guides/${g.slug}`, lastModified: new Date(g.updated), changeFrequency: "monthly" as const, priority: 0.6 })),
    ...COVERED_STATES.flatMap((s) => [
      { url: `${base}/state/${s.slug}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.9 },
      { url: `${base}/state/${s.slug}/projects`, lastModified: now, changeFrequency: "daily" as const, priority: 0.7 },
    ]),
  ];
  const [projects, promoters] = await Promise.all([allProjectSlugs(), allPromoterSlugs()]);
  return [
    ...fixed,
    ...projects.map((p) => ({ url: `${base}/projects/${p.slug}`, lastModified: new Date(p.updatedAt), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...promoters.map((p) => ({ url: `${base}/promoters/${p.slug}`, lastModified: new Date(p.updatedAt), changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
