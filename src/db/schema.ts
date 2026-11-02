import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

/**
 * Normalised schema. Every state portal exposes a different shape; the
 * ingestion adapters map portal records onto these tables so the UI, the
 * scoring engine and the public API only ever deal with one model.
 */

export const promoters = sqliteTable(
  "promoters",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    type: text("type"), // company | llp | partnership | individual | society | trust
    stateSlug: text("state_slug").notNull(),
    address: text("address"),
    website: text("website"),
    cin: text("cin"),
    pan: text("pan_masked"),
    // Aggregates recomputed by the scoring job
    projectCount: integer("project_count").notNull().default(0),
    completedCount: integer("completed_count").notNull().default(0),
    delayedCount: integer("delayed_count").notNull().default(0),
    onTimeCount: integer("on_time_count").notNull().default(0),
    openComplaints: integer("open_complaints").notNull().default(0),
    trackScore: integer("track_score"), // 0-100, null when insufficient history
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [index("promoters_state_idx").on(t.stateSlug), index("promoters_name_idx").on(t.name)],
);

export const projects = sqliteTable(
  "projects",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    reraNumber: text("rera_number").notNull().unique(),
    stateSlug: text("state_slug").notNull(),
    name: text("name").notNull(),
    type: text("type").notNull(), // residential | commercial | mixed | plotted
    status: text("status").notNull(), // registered | completed | lapsed | revoked | expired | withdrawn
    district: text("district").notNull(),
    taluka: text("taluka"),
    locality: text("locality"),
    pincode: text("pincode"),
    lat: real("lat"),
    lng: real("lng"),
    promoterId: integer("promoter_id")
      .notNull()
      .references(() => promoters.id),
    registrationDate: text("registration_date"),
    originalCompletionDate: text("original_completion_date"),
    revisedCompletionDate: text("revised_completion_date"),
    actualCompletionDate: text("actual_completion_date"),
    extensionCount: integer("extension_count").notNull().default(0),
    landAreaSqm: real("land_area_sqm"),
    totalBuildings: integer("total_buildings"),
    totalUnits: integer("total_units"),
    unitsBooked: integer("units_booked"),
    carpetAreaRegisteredSqm: real("carpet_area_registered_sqm"), // average per unit
    carpetAreaAdvertisedSqm: real("carpet_area_advertised_sqm"), // from brochures / listings
    complaintsTotal: integer("complaints_total").notNull().default(0),
    complaintsOpen: integer("complaints_open").notNull().default(0),
    appealsOpen: integer("appeals_open").notNull().default(0),
    qprFiled: integer("qpr_filed").notNull().default(0), // quarterly progress reports filed
    qprDue: integer("qpr_due").notNull().default(0),
    lastQprDate: text("last_qpr_date"),
    escrowBank: text("escrow_bank"),
    encumbrance: integer("encumbrance", { mode: "boolean" }).notNull().default(false),
    litigation: integer("litigation", { mode: "boolean" }).notNull().default(false),
    description: text("description"),
    sourceUrl: text("source_url").notNull(),
    sourceFetchedAt: text("source_fetched_at").notNull(),
    contentHash: text("content_hash").notNull(),
    // Score snapshot
    scoreTotal: integer("score_total"),
    scoreBand: text("score_band"), // strong | watch | caution | unrated
    scoreConfidence: real("score_confidence"),
    scoreBreakdown: text("score_breakdown", { mode: "json" }),
    scoredAt: text("scored_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    index("projects_state_idx").on(t.stateSlug),
    index("projects_district_idx").on(t.stateSlug, t.district),
    index("projects_promoter_idx").on(t.promoterId),
    index("projects_status_idx").on(t.status),
    index("projects_score_idx").on(t.scoreTotal),
    index("projects_name_idx").on(t.name),
  ],
);

export const complaints = sqliteTable(
  "complaints",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id),
    caseNumber: text("case_number").notNull(),
    filedOn: text("filed_on"),
    status: text("status").notNull(), // open | disposed | appeal
    category: text("category"), // delay | refund | quality | area | other
    summary: text("summary"),
    orderDate: text("order_date"),
    orderSummary: text("order_summary"),
    sourceUrl: text("source_url"),
  },
  (t) => [index("complaints_project_idx").on(t.projectId)],
);

export const extensions = sqliteTable(
  "extensions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id),
    kind: text("kind").notNull(), // extension | revision | force-majeure
    previousDate: text("previous_date"),
    newDate: text("new_date").notNull(),
    grantedOn: text("granted_on"),
    reason: text("reason"),
  },
  (t) => [index("extensions_project_idx").on(t.projectId)],
);

export const unitMix = sqliteTable(
  "unit_mix",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id),
    unitType: text("unit_type").notNull(), // 1BHK, 2BHK, Shop, Plot ...
    count: integer("count").notNull(),
    booked: integer("booked").notNull().default(0),
    carpetAreaSqm: real("carpet_area_sqm"),
    advertisedCarpetAreaSqm: real("advertised_carpet_area_sqm"),
  },
  (t) => [index("unit_mix_project_idx").on(t.projectId)],
);

export const documents = sqliteTable(
  "documents",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id),
    name: text("name").notNull(),
    kind: text("kind").notNull(), // certificate | approval | layout | title | qpr | order | other
    url: text("url").notNull(),
    publishedOn: text("published_on"),
  },
  (t) => [index("documents_project_idx").on(t.projectId)],
);

export const professionals = sqliteTable(
  "professionals",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id),
    role: text("role").notNull(), // architect | engineer | chartered-accountant | contractor
    name: text("name").notNull(),
    registrationNumber: text("registration_number"),
  },
  (t) => [index("professionals_project_idx").on(t.projectId), index("professionals_name_idx").on(t.name)],
);

export const syncRuns = sqliteTable("sync_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  stateSlug: text("state_slug").notNull(),
  adapter: text("adapter").notNull(),
  startedAt: text("started_at").notNull(),
  finishedAt: text("finished_at"),
  status: text("status").notNull(), // running | ok | failed | partial
  fetched: integer("fetched").notNull().default(0),
  inserted: integer("inserted").notNull().default(0),
  updated: integer("updated").notNull().default(0),
  unchanged: integer("unchanged").notNull().default(0),
  errors: integer("errors").notNull().default(0),
  message: text("message"),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Promoter = typeof promoters.$inferSelect;
export type NewPromoter = typeof promoters.$inferInsert;
export type Complaint = typeof complaints.$inferSelect;
export type Extension = typeof extensions.$inferSelect;
export type UnitMixRow = typeof unitMix.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Professional = typeof professionals.$inferSelect;
export type SyncRun = typeof syncRuns.$inferSelect;
