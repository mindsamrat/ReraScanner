import type { NextRequest } from "next/server";
import { getProjectsByIds } from "@/db/queries";
import { json, error, projectToApi } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/v1/projects?ids=1,2,3 — batch lookup (max 50). */
export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 50);
  if (!ids.length) return error(400, "ids query parameter required, e.g. ?ids=1,2,3");
  const items = await getProjectsByIds(ids);
  return json({ items: items.map((d) => projectToApi(d.project, d.promoter)) });
}
