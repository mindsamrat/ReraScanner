/**
 * The normalised record every adapter must produce. The pipeline (./pipeline.ts)
 * upserts these into the database; nothing downstream knows which portal a
 * record came from beyond `stateSlug` and `sourceUrl`.
 */

export type ProjectType = "residential" | "commercial" | "mixed" | "plotted";
export type ProjectStatus = "registered" | "completed" | "lapsed" | "revoked" | "expired" | "withdrawn";

export interface NormalizedPromoter {
  name: string;
  type?: string | null;
  address?: string | null;
  website?: string | null;
  cin?: string | null;
  panMasked?: string | null;
}

export interface NormalizedComplaint {
  caseNumber: string;
  filedOn?: string | null;
  status: "open" | "disposed" | "appeal";
  category?: "delay" | "refund" | "quality" | "area" | "other" | null;
  summary?: string | null;
  orderDate?: string | null;
  orderSummary?: string | null;
  sourceUrl?: string | null;
}

export interface NormalizedExtension {
  kind: "extension" | "revision" | "force-majeure";
  previousDate?: string | null;
  newDate: string;
  grantedOn?: string | null;
  reason?: string | null;
}

export interface NormalizedUnitMix {
  unitType: string;
  count: number;
  booked?: number;
  carpetAreaSqm?: number | null;
  advertisedCarpetAreaSqm?: number | null;
}

export interface NormalizedDocument {
  name: string;
  kind: "certificate" | "approval" | "layout" | "title" | "qpr" | "order" | "other";
  url: string;
  publishedOn?: string | null;
}

export interface NormalizedProfessional {
  role: "architect" | "engineer" | "chartered-accountant" | "contractor";
  name: string;
  registrationNumber?: string | null;
}

export interface NormalizedProject {
  reraNumber: string;
  stateSlug: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  district: string;
  taluka?: string | null;
  locality?: string | null;
  pincode?: string | null;
  lat?: number | null;
  lng?: number | null;
  promoter: NormalizedPromoter;
  registrationDate?: string | null; // ISO yyyy-mm-dd
  originalCompletionDate?: string | null;
  revisedCompletionDate?: string | null;
  actualCompletionDate?: string | null;
  extensionCount?: number;
  landAreaSqm?: number | null;
  totalBuildings?: number | null;
  totalUnits?: number | null;
  unitsBooked?: number | null;
  carpetAreaRegisteredSqm?: number | null;
  carpetAreaAdvertisedSqm?: number | null;
  complaints?: NormalizedComplaint[];
  appealsOpen?: number;
  qprFiled?: number;
  qprDue?: number;
  lastQprDate?: string | null;
  escrowBank?: string | null;
  encumbrance?: boolean;
  litigation?: boolean;
  description?: string | null;
  extensions?: NormalizedExtension[];
  unitMix?: NormalizedUnitMix[];
  documents?: NormalizedDocument[];
  professionals?: NormalizedProfessional[];
  sourceUrl: string;
  sourceFetchedAt: string; // ISO datetime
}

export interface ListOptions {
  /** Hard cap on records, useful for smoke tests. */
  limit?: number;
  /** Restrict to one district where the portal supports it. */
  district?: string;
  /** Only records changed since this ISO date, where the portal supports it. */
  since?: string;
}

export interface AdapterCapabilities {
  listing: boolean;
  detail: boolean;
  complaints: boolean;
  unitInventory: boolean;
  quarterlyUpdates: boolean;
  incremental: boolean;
  needsBrowser: boolean;
}

/**
 * One adapter per state portal. `list()` yields lightweight references and
 * `detail()` turns a reference into a full normalised record. Adapters never
 * touch the database; the pipeline does.
 */
export interface PortalAdapter {
  id: string;
  stateSlug: string;
  capabilities: AdapterCapabilities;
  /** Short note on the portal's technology and any gotchas. Shown on /data-sources. */
  notes: string;
  list(opts?: ListOptions): AsyncGenerator<ProjectRef>;
  detail(ref: ProjectRef): Promise<NormalizedProject>;
}

export interface ProjectRef {
  reraNumber: string;
  name?: string;
  district?: string;
  /** Opaque, adapter-specific pointer (URL, internal id, form payload). */
  handle: string;
  /** Allows change detection before fetching the detail page. */
  listingHash?: string;
}
