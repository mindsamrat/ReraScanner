import { districtStats, stateStats } from "@/db/queries";
import { json, error } from "@/lib/api";
import { getState } from "@/lib/states";

export const dynamic = "force-dynamic";

/** GET /api/v1/states/:state — statistics for one state including per-district breakdown. */
export async function GET(_req: Request, { params }: { params: Promise<{ state: string }> }) {
  const slug = (await params).state;
  const s = getState(slug);
  if (!s) return error(404, "unknown state");
  const [[stats], districts] = await Promise.all([stateStats(slug), districtStats(slug)]);
  return json({ state: s, stats: stats ?? null, districts });
}
