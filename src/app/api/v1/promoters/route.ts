import type { NextRequest } from "next/server";
import { listPromoters } from "@/db/queries";
import { json } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/v1/promoters?state=&q=&sort=projects|track|name|complaints&page= */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const r = await listPromoters({
    state: sp.get("state") ?? undefined,
    q: sp.get("q") ?? undefined,
    sort: (sp.get("sort") as "projects" | "track" | "name" | "complaints" | null) ?? undefined,
    page: Number(sp.get("page") ?? 1) || 1,
    pageSize: Math.min(100, Number(sp.get("pageSize") ?? 30) || 30),
  });
  return json(r);
}
