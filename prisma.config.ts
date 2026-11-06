import "dotenv/config";

import { defineConfig } from "prisma/config";

/**
 * Prisma 7 moved the connection URL out of schema.prisma and into this file.
 *
 * The fallback matters: `npm install` runs `prisma generate` via the
 * postinstall script, which loads this config. On a fresh clone there is no
 * .env yet, and `env("DATABASE_URL")` would throw and fail the install.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  },
});
