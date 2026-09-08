import { and, count, eq, gte } from "drizzle-orm";
import { db } from "./db";
import { trips, users } from "./schema";
import { today } from "./dates";

/** Things waiting on the host: unanswered requests + people at the door. */
export async function frontDeskCount(): Promise<number> {
  const [requests, people] = await Promise.all([
    db
      .select({ n: count() })
      .from(trips)
      .where(and(eq(trips.status, "pending"), gte(trips.endDate, today()))),
    db.select({ n: count() }).from(users).where(eq(users.status, "pending")),
  ]);
  return (requests[0]?.n ?? 0) + (people[0]?.n ?? 0);
}
