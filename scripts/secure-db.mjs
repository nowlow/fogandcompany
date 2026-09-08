/**
 * Supabase publishes every table in the `public` schema through PostgREST, so
 * a table with row-level security switched off is readable by anyone holding
 * the project's anon key. This app never talks to PostgREST — it connects as
 * the owner over Postgres — so the safe setting is: RLS on, no policies, and
 * no grants to the API roles. That denies the REST API everything and leaves
 * the app untouched.
 *
 * Idempotent. Run it after `npm run db:push`, and again after adding tables.
 * Harmless on a plain Postgres, where the API roles simply don't exist.
 */
import postgres from "postgres";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("Set DATABASE_URL (or DIRECT_URL) first.");
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false });

try {
  const tables = await sql`
    select tablename from pg_tables where schemaname = 'public' order by tablename
  `;

  if (!tables.length) {
    console.error("No tables in `public` — run `npm run db:push` first.");
    process.exit(1);
  }

  await sql.unsafe(`
    do $$
    declare t record;
    begin
      for t in select tablename from pg_tables where schemaname = 'public'
      loop
        execute format('alter table public.%I enable row level security', t.tablename);
      end loop;

      if exists (select 1 from pg_roles where rolname = 'anon') then
        revoke all on all tables in schema public from anon, authenticated;
        revoke all on all sequences in schema public from anon, authenticated;
      end if;
    end $$;
  `);

  const open = await sql`
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity = false
  `;

  console.log(
    `row-level security on: ${tables.map((t) => t.tablename).join(", ")}`,
  );
  console.log(
    open.length
      ? `still open: ${open.map((r) => r.relname).join(", ")}`
      : "nothing in `public` is reachable through the Supabase API.",
  );
} catch (error) {
  console.error("Could not lock the database down:", error.message);
  process.exit(1);
} finally {
  await sql.end();
}
