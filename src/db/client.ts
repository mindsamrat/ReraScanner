import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import path from "node:path";
import * as schema from "./schema";

export type Db = LibSQLDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __reraClient?: Client; __reraDb?: Db };

export function databaseUrl(): string {
  const url = process.env.DATABASE_URL ?? "file:./data/rerascanner.db";
  if (url.startsWith("file:")) {
    const p = url.slice("file:".length);
    if (!path.isAbsolute(p)) return `file:${path.resolve(/*turbopackIgnore: true*/ process.cwd(), p)}`;
  }
  return url;
}

export function getClient(): Client {
  if (!globalForDb.__reraClient) {
    globalForDb.__reraClient = createClient({
      url: databaseUrl(),
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
  }
  return globalForDb.__reraClient;
}

export function getDb(): Db {
  if (!globalForDb.__reraDb) {
    globalForDb.__reraDb = drizzle(getClient(), { schema });
  }
  return globalForDb.__reraDb;
}

export { schema };
