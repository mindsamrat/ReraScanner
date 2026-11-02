import type { Client } from "@libsql/client";

/**
 * Idempotent schema creation. We ship plain SQL instead of drizzle-kit
 * migration folders so a fresh clone can run `npm run db:seed` with zero setup.
 * Keep this in sync with ./schema.ts.
 */
export const DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS promoters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT,
    state_slug TEXT NOT NULL,
    address TEXT,
    website TEXT,
    cin TEXT,
    pan_masked TEXT,
    project_count INTEGER NOT NULL DEFAULT 0,
    completed_count INTEGER NOT NULL DEFAULT 0,
    delayed_count INTEGER NOT NULL DEFAULT 0,
    on_time_count INTEGER NOT NULL DEFAULT 0,
    open_complaints INTEGER NOT NULL DEFAULT 0,
    track_score INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS promoters_state_idx ON promoters(state_slug)`,
  `CREATE INDEX IF NOT EXISTS promoters_name_idx ON promoters(name)`,
  `CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    rera_number TEXT NOT NULL UNIQUE,
    state_slug TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    district TEXT NOT NULL,
    taluka TEXT,
    locality TEXT,
    pincode TEXT,
    lat REAL,
    lng REAL,
    promoter_id INTEGER NOT NULL REFERENCES promoters(id),
    registration_date TEXT,
    original_completion_date TEXT,
    revised_completion_date TEXT,
    actual_completion_date TEXT,
    extension_count INTEGER NOT NULL DEFAULT 0,
    land_area_sqm REAL,
    total_buildings INTEGER,
    total_units INTEGER,
    units_booked INTEGER,
    carpet_area_registered_sqm REAL,
    carpet_area_advertised_sqm REAL,
    complaints_total INTEGER NOT NULL DEFAULT 0,
    complaints_open INTEGER NOT NULL DEFAULT 0,
    appeals_open INTEGER NOT NULL DEFAULT 0,
    qpr_filed INTEGER NOT NULL DEFAULT 0,
    qpr_due INTEGER NOT NULL DEFAULT 0,
    last_qpr_date TEXT,
    escrow_bank TEXT,
    encumbrance INTEGER NOT NULL DEFAULT 0,
    litigation INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    source_url TEXT NOT NULL,
    source_fetched_at TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    score_total INTEGER,
    score_band TEXT,
    score_confidence REAL,
    score_breakdown TEXT,
    scored_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS projects_state_idx ON projects(state_slug)`,
  `CREATE INDEX IF NOT EXISTS projects_district_idx ON projects(state_slug, district)`,
  `CREATE INDEX IF NOT EXISTS projects_promoter_idx ON projects(promoter_id)`,
  `CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status)`,
  `CREATE INDEX IF NOT EXISTS projects_score_idx ON projects(score_total)`,
  `CREATE INDEX IF NOT EXISTS projects_name_idx ON projects(name)`,
  `CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    case_number TEXT NOT NULL,
    filed_on TEXT,
    status TEXT NOT NULL,
    category TEXT,
    summary TEXT,
    order_date TEXT,
    order_summary TEXT,
    source_url TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS complaints_project_idx ON complaints(project_id)`,
  `CREATE TABLE IF NOT EXISTS extensions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    kind TEXT NOT NULL,
    previous_date TEXT,
    new_date TEXT NOT NULL,
    granted_on TEXT,
    reason TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS extensions_project_idx ON extensions(project_id)`,
  `CREATE TABLE IF NOT EXISTS unit_mix (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    unit_type TEXT NOT NULL,
    count INTEGER NOT NULL,
    booked INTEGER NOT NULL DEFAULT 0,
    carpet_area_sqm REAL,
    advertised_carpet_area_sqm REAL
  )`,
  `CREATE INDEX IF NOT EXISTS unit_mix_project_idx ON unit_mix(project_id)`,
  `CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    url TEXT NOT NULL,
    published_on TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS documents_project_idx ON documents(project_id)`,
  `CREATE TABLE IF NOT EXISTS professionals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    registration_number TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS professionals_project_idx ON professionals(project_id)`,
  `CREATE INDEX IF NOT EXISTS professionals_name_idx ON professionals(name)`,
  `CREATE TABLE IF NOT EXISTS sync_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    state_slug TEXT NOT NULL,
    adapter TEXT NOT NULL,
    started_at TEXT NOT NULL,
    finished_at TEXT,
    status TEXT NOT NULL,
    fetched INTEGER NOT NULL DEFAULT 0,
    inserted INTEGER NOT NULL DEFAULT 0,
    updated INTEGER NOT NULL DEFAULT 0,
    unchanged INTEGER NOT NULL DEFAULT 0,
    errors INTEGER NOT NULL DEFAULT 0,
    message TEXT
  )`,
  // Full-text search over the fields people actually type into the search box.
  `CREATE VIRTUAL TABLE IF NOT EXISTS projects_fts USING fts5(
    project_id UNINDEXED,
    name,
    rera_number,
    promoter_name,
    district,
    locality,
    tokenize = 'unicode61 remove_diacritics 2'
  )`,
];

export async function migrate(client: Client): Promise<void> {
  for (const stmt of DDL) {
    await client.execute(stmt);
  }
}

/** Rebuild the FTS index from scratch (cheap at our scale, simplest to reason about). */
export async function rebuildSearchIndex(client: Client): Promise<void> {
  await client.execute(`DELETE FROM projects_fts`);
  await client.execute(`
    INSERT INTO projects_fts (project_id, name, rera_number, promoter_name, district, locality)
    SELECT p.id, p.name, p.rera_number, pr.name, p.district, COALESCE(p.locality, '')
    FROM projects p JOIN promoters pr ON pr.id = p.promoter_id
  `);
}
