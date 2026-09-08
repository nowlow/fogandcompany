/**
 * A real Postgres for local development — no Docker, no system install.
 * Downloads a standalone server on first run, keeps its data in .localdb/,
 * and listens on 5432 so DATABASE_URL just works. Delete .localdb/ to reset.
 */
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";

const dataDir = process.env.LOCAL_DB_DIR ?? ".localdb";
const port = Number(process.env.LOCAL_DB_PORT ?? 5432);
const fresh = !existsSync(dataDir);

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "postgres",
  port,
  persistent: true,
});

if (fresh) {
  console.log("first run — setting up a database in", dataDir);
  await pg.initialise();
}

await pg.start();
console.log(
  `local postgres ready on postgres://postgres:postgres@localhost:${port}/postgres`,
);
console.log("run `npm run db:push` in another shell to create the tables.");

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
