import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * A cheap stamp of everything a signed-in page renders. Counts catch
 * deletions, the max timestamps catch edits — all as aggregates in one round
 * trip, so a poll costs far less than re-rendering a page.
 */
export async function GET() {
  const user = await currentUser();
  if (!user || user.status !== "approved") {
    return Response.json({ v: "" }, { status: 401 });
  }

  const rows = (await db.execute(sql`
    select
      (select count(*) from "trip")                                        as t_n,
      (select coalesce(max(extract(epoch from "updatedAt")), 0) from "trip")   as t_at,
      (select count(*) from "block")                                       as b_n,
      (select coalesce(max(extract(epoch from "createdAt")), 0) from "block")  as b_at,
      (select count(*) from "user")                                        as u_n,
      (select coalesce(max(extract(epoch from coalesce("decidedAt", "createdAt"))), 0) from "user") as u_at,
      (select coalesce(max(extract(epoch from "updatedAt")), 0) from "settings") as s_at
  `)) as unknown as Record<string, string | number>[];

  const r = rows[0] ?? {};
  const v = ["t_n", "t_at", "b_n", "b_at", "u_n", "u_at", "s_at"]
    .map((k) => String(r[k] ?? 0))
    .join(".");

  return Response.json(
    { v },
    { headers: { "Cache-Control": "no-store" } },
  );
}
