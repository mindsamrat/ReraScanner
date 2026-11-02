import type { ListOptions, NormalizedProject, PortalAdapter, ProjectRef } from "../types";
import { generateSample } from "../sample/generate";

/**
 * Adapter that "fetches" from the deterministic sample generator. It goes
 * through exactly the same pipeline as live adapters so the ingestion path is
 * exercised on every seed.
 */
export function sampleAdapter(stateSlug: string, all?: NormalizedProject[]): PortalAdapter {
  const records = (all ?? generateSample()).filter((p) => p.stateSlug === stateSlug);
  const byNumber = new Map(records.map((p) => [p.reraNumber, p]));
  return {
    id: `sample:${stateSlug}`,
    stateSlug,
    capabilities: { listing: true, detail: true, complaints: true, unitInventory: true, quarterlyUpdates: true, incremental: false, needsBrowser: false },
    notes: "Deterministic fictional dataset used for development and demos.",
    async *list(opts?: ListOptions) {
      let n = 0;
      for (const p of records) {
        if (opts?.district && p.district !== opts.district) continue;
        yield { reraNumber: p.reraNumber, name: p.name, district: p.district, handle: p.reraNumber } satisfies ProjectRef;
        if (opts?.limit && ++n >= opts.limit) return;
      }
    },
    async detail(ref: ProjectRef) {
      const p = byNumber.get(ref.handle);
      if (!p) throw new Error(`sample record ${ref.handle} not found`);
      return p;
    },
  };
}
