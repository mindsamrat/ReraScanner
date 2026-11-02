/** Recompute promoter aggregates and all project scores without re-ingesting. */
import { getClient, getDb } from "../src/db/client";
import { migrate } from "../src/db/migrate";
import { scoreAll } from "../src/ingest/scoreAll";

async function main() {
  await migrate(getClient());
  const r = await scoreAll(getDb(), console.log);
  console.log(`scored ${r.projects} projects, ${r.promoters} promoters`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
