import { getProjectByReraNumber, getProjectBySlug } from "@/db/queries";
import { json, error, projectToApi } from "@/lib/api";
import { detectStateFromRegNumber } from "@/lib/states";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/projects/by-number/:reraNumber — full record including score components,
 * complaints, extensions, unit mix, documents and professionals.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ number: string }> }) {
  const raw = decodeURIComponent((await params).number);
  const p = await getProjectByReraNumber(raw);
  if (!p) {
    const s = detectStateFromRegNumber(raw);
    return error(404, s ? `not indexed; looks like a ${s.authority} number, verify at ${s.projectSearchUrl}` : "not indexed and format not recognised");
  }
  const d = (await getProjectBySlug(p.slug))!;
  return json({
    ...projectToApi(d.project, d.promoter, true),
    complaints: d.complaints,
    extensions: d.extensions,
    unitMix: d.unitMix,
    documents: d.documents,
    professionals: d.professionals,
    promoterDetail: d.promoter,
  });
}
