import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "guest" | "host";
      status: "profile" | "pending" | "approved" | "denied";
      displayName: string | null;
    } & DefaultSession["user"];
  }
}

export {};
