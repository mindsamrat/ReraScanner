/** Runs before `next build`: seeds the sample DB if none exists so a fresh clone builds. */
import fs from "node:fs";
import { databaseUrl } from "../src/db/client";
import { execSync } from "node:child_process";

const url = databaseUrl();
if (url.startsWith("file:")) {
  const file = url.slice(5);
  if (!fs.existsSync(file)) {
    console.log(`no database at ${file}; seeding sample data`);
    execSync("npx tsx scripts/seed.ts", { stdio: "inherit" });
  } else {
    console.log(`database present at ${file}`);
  }
}
