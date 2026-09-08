import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * A syntactically valid placeholder keeps `next build` working on a machine
 * with no database configured; a real query then fails loudly instead of
 * silently doing nothing.
 */
const PLACEHOLDER = "postgresql://unset:unset@unset.invalid:5432/unset";

/**
 * One connection per serverless instance and no prepared statements — the
 * shape Supabase's transaction pooler (and every other PgBouncer-style pooler)
 * expects. Works unchanged against a plain Postgres, so the same code runs
 * locally and in production.
 */
const client = postgres(process.env.DATABASE_URL || PLACEHOLDER, {
  max: 1,
  prepare: false,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
