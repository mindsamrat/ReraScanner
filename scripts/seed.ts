/**
 * Seed the database with the deterministic sample dataset and score it.
 *
 *   npm run db:seed            # full sample
 *   npm run db:seed -- --reset # drop the file first
 */
import fs from "node:fs";
import path from "node:path";
import { databaseUrl, getClient, getDb } from "../src/db/client";
import { migrate } from "../src/db/migrate";
import { runAdapter } from "../src/ingest/pipeline";
import { sampleAdapter } from "../src/ingest/adapters/sample";
import { generateSample } from "../src/ingest/sample/generate";
import { scoreAll } from "../src/ingest/scoreAll";

async function main() {
  const reset = process.argv.includes("--reset");
  const url = databaseUrl();
  if (url.startsWith("file:")) {
    const file = url.slice(5);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (reset && fs.existsSync(file)) {
      fs.rmSync(file);
      console.log(`removed ${file}`);
    }
  }
  const client = getClient();
  await migrate(client);
  const all = generateSample({ fetchedAt: new Date().toISOString() });
  const states = [...new Set(all.map((p) => p.stateSlug))];
  console.log(`generated ${all.length} sample projects across ${states.length} states`);
  for (const s of states) {
    const stats = await runAdapter(sampleAdapter(s, all), { log: console.log });
    console.log(`${s}: +${stats.inserted} new, ~${stats.updated} updated, =${stats.unchanged} unchanged`);
  }
  const db = getDb();
  const scored = await scoreAll(db, console.log);
  console.log(`done: ${scored.projects} projects, ${scored.promoters} promoters scored`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
