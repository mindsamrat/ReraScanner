import { getPromoterBySlug } from "@/db/queries";
import { json, error, projectToApi } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/v1/promoters/:slug — promoter aggregates and their projects. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const d = await getPromoterBySlug((await params).slug);
  if (!d) return error(404, "promoter not found");
  return json({ promoter: d.promoter, projects: d.projects.map((p) => projectToApi(p)) });
}
