import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Data pages read from a local SQLite database and are rendered per request
  // (see `export const dynamic` in each route). Cache Components is left off so
  // the classic rendering model applies and no `use cache` plumbing is needed.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  serverExternalPackages: ["@libsql/client", "libsql"],
};

export default nextConfig;
