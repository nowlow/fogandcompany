import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Schema changes go over a direct or session-mode connection; transaction
  // poolers can't hold the locks DDL needs. Falls back to DATABASE_URL.
  dbCredentials: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL! },
} satisfies Config;
