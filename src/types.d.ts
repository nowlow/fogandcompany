import type { DefaultSession } from "next-auth";
import type { User as Row } from "@/lib/schema";

declare module "next-auth" {
  /** The whole user row travels on the session, see the session callback. */
  interface Session {
    user: Row & DefaultSession["user"];
  }
}

export {};
