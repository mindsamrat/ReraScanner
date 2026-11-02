import { stateStats } from "@/db/queries";
import { json } from "@/lib/api";
import { STATES } from "@/lib/states";

export const dynamic = "force-dynamic";

/** GET /api/v1/states — every authority with portal info and index statistics. */
export async function GET() {
  const stats = Object.fromEntries((await stateStats()).map((s) => [s.stateSlug, s]));
  return json({
    items: STATES.map((s) => ({
      slug: s.slug,
      name: s.name,
      code: s.code,
      authority: s.authority,
      portalUrl: s.portalUrl,
      projectSearchUrl: s.projectSearchUrl,
      portalTech: s.tech,
      regNumberExample: s.regNumberExample,
      coverage: s.coverage,
      stats: stats[s.slug] ?? null,
    })),
  });
}
