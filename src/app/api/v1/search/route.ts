import type { NextRequest } from "next/server";
import { listProjects } from "@/db/queries";
import { parseFilters } from "@/lib/searchParams";
import { json, error } from "@/lib/api";
import { projectToApi } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/search?q=&state=&district=&status=&type=&band=&overdue=1&complaints=1&sort=&page=&pageSize=
 * Same filters as the website. Returns up to 100 projects per page.
 */
export async function GET(req: NextRequest) {
  const sp = Object.fromEntries([...req.nextUrl.searchParams.keys()].map((k) => [k, req.nextUrl.searchParams.getAll(k).length > 1 ? req.nextUrl.searchParams.getAll(k) : req.nextUrl.searchParams.get(k) ?? undefined]));
  const filters = parseFilters(sp);
  const pageSize = Math.min(100, Number(req.nextUrl.searchParams.get("pageSize") ?? 24) || 24);
  if (filters.page && filters.page > 500) return error(400, "page too large");
  const r = await listProjects({ ...filters, pageSize });
  return json({
    query: filters,
    total: r.total,
    page: r.page,
    pageSize: r.pageSize,
    pages: r.pages,
    items: r.items.map((p) => projectToApi(p)),
  });
}
