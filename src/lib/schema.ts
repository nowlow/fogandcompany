import {
  pgTable,
  text,
  timestamp,
  primaryKey,
  integer,
  date,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

/* ------------------------------------------------------------------ *
 * Auth.js core tables
 * ------------------------------------------------------------------ */

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),

  /* app-specific columns */
  // "guest" | "host"
  role: text("role").notNull().default("guest"),
  // "profile" (needs to pick a name) | "pending" | "approved" | "denied"
  status: text("status").notNull().default("profile"),
  // the name the host sees / what goes on the calendar
  displayName: text("displayName"),
  relationship: text("relationship"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  decidedAt: timestamp("decidedAt", { mode: "date" }),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

/* ------------------------------------------------------------------ *
 * App tables
 * ------------------------------------------------------------------ */

export type Companion = { name: string; email?: string | null };

/**
 * A stay. `startDate` is the arrival day, `endDate` is the departure day.
 * Two trips conflict when start < other.end && other.start < end, so a guest
 * can leave on the same morning another one arrives.
 */
export const trips = pgTable(
  "trip",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startDate: date("startDate", { mode: "string" }).notNull(),
    endDate: date("endDate", { mode: "string" }).notNull(),
    // "pending" | "approved" | "denied" | "cancelled"
    status: text("status").notNull().default("pending"),
    note: text("note"),
    companions: jsonb("companions").$type<Companion[]>().notNull().default([]),
    calendarEventId: text("calendarEventId"),
    // set when the host denies / cancels, or when the guest cancels
    resolutionNote: text("resolutionNote"),
    cancelledBy: text("cancelledBy"), // "guest" | "host" | "block"
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("trip_dates_idx").on(t.startDate, t.endDate)],
);

/** Dates the host keeps for themselves. Same half-open range semantics. */
export const blocks = pgTable(
  "block",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    startDate: date("startDate", { mode: "string" }).notNull(),
    endDate: date("endDate", { mode: "string" }).notNull(),
    reason: text("reason"),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (b) => [index("block_dates_idx").on(b.startDate, b.endDate)],
);

/** Single row, id = "singleton". */
export const settings = pgTable("settings", {
  id: text("id").primaryKey().default("singleton"),
  address: text("address"),
  addressNote: text("addressNote"),
  welcomeNote: text("welcomeNote"),
  calendarId: text("calendarId"),
  calendarName: text("calendarName"),
  googleRefreshToken: text("googleRefreshToken"),
  googleAccountEmail: text("googleAccountEmail"),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type Block = typeof blocks.$inferSelect;
export type Settings = typeof settings.$inferSelect;
