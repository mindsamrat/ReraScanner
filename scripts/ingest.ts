/**
 * Live ingestion from a state RERA portal.
 *
 *   npm run ingest -- --state gujarat
 *   npm run ingest -- --state maharashtra --district Pune --limit 50
 *   npm run ingest -- --state karnataka --dry-run     # fetch & print, don't write
 *   npm run ingest -- --all                           # every adapter in the registry
 *
 * After ingestion the scoring job runs automatically unless --no-score is passed.
 * Set INGEST_DELAY_MS to control politeness (default 1500ms between requests).
 */
import { ADAPTERS, getAdapter } from "../src/ingest/adapters";
import { runAdapter } from "../src/ingest/pipeline";
import { scoreAll } from "../src/ingest/scoreAll";
import { getDb } from "../src/db/client";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const flag = (name: string) => process.argv.includes(`--${name}`);

async function main() {
  const all = flag("all");
  const state = arg("state");
  const slugs = all ? Object.keys(ADAPTERS) : state ? [state] : [];
  if (!slugs.length) {
    console.error("usage: npm run ingest -- --state <slug> [--district <name>] [--limit n] [--dry-run] | --all");
    console.error("known states:", Object.keys(ADAPTERS).join(", "));
    process.exit(1);
  }
  const opts = { district: arg("district"), limit: arg("limit") ? Number(arg("limit")) : undefined, dryRun: flag("dry-run"), log: console.log };
  for (const slug of slugs) {
    const adapter = getAdapter(slug);
    if (!adapter) {
      console.error(`no adapter for ${slug}`);
      continue;
    }
    if (adapter.capabilities.needsBrowser && !flag("browser")) {
      console.warn(`${adapter.id}: this portal usually needs a browser session (CAPTCHA / heavy postbacks). Trying plain HTTP; pass --browser to use Playwright.`);
    }
    console.log(`\n== ${adapter.id} (${slug}) ==\n${adapter.notes}`);
    try {
      const stats = await runAdapter(adapter, opts);
      console.log(`${adapter.id}: fetched ${stats.fetched}, +${stats.inserted} new, ~${stats.updated} updated, =${stats.unchanged} unchanged, ${stats.errors} errors`);
    } catch (err) {
      console.error(`${adapter.id}: failed: ${(err as Error).message}`);
    }
  }
  if (!flag("dry-run") && !flag("no-score")) {
    console.log("\nrecomputing scores…");
    const r = await scoreAll(getDb(), console.log);
    console.log(`scored ${r.projects} projects, ${r.promoters} promoters`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
