import type { NextRequest } from "next/server";
import { suggest } from "@/db/queries";
import { json } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/v1/suggest?q= — typeahead for the search box. */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return json({ items: [] });
  const items = await suggest(q, 8);
  return json({ items }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=600" } });
}
