import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * A syntactically valid placeholder keeps `next build` working on a machine
 * with no database configured; a real query then fails loudly instead of
 * silently doing nothing.
 */
const PLACEHOLDER = "postgresql://unset:unset@unset.invalid/unset";

const url = process.env.DATABASE_URL || PLACEHOLDER;

/** Neon's HTTP driver is serverless-friendly; anything else goes over TCP. */
const isNeon = /neon\.(tech|build)|unset\.invalid/.test(url);

function connect(): NeonHttpDatabase<typeof schema> {
  if (isNeon) return drizzleNeon(neon(url), { schema });

  // postgres.js and neon-http expose the same query surface for everything
  // this app does, so one type covers both call sites.
  // One connection per serverless instance; `prepare: false` keeps poolers
  // like PgBouncer happy.
  const client = postgres(url, { max: 1, prepare: false });
  return drizzlePostgres(client, { schema }) as unknown as NeonHttpDatabase<
    typeof schema
  >;
}

export const db = connect();
