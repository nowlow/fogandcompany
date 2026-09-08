import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { accounts, sessions, users, verificationTokens } from "./schema";
import { HOST_EMAIL } from "./constants";

const env = (...names: string[]) => {
  for (const n of names) if (process.env[n]) return process.env[n] as string;
  return undefined;
};

const googleId = env("GOOGLE_CLIENT_ID", "AUTH_GOOGLE_ID");
const googleSecret = env("GOOGLE_CLIENT_SECRET", "AUTH_GOOGLE_SECRET");
const githubId = env("GITHUB_CLIENT_ID", "AUTH_GITHUB_ID");
const githubSecret = env("GITHUB_CLIENT_SECRET", "AUTH_GITHUB_SECRET");

const providers: NextAuthConfig["providers"] = [];

if (googleId && googleSecret) {
  providers.push(
    Google({
      clientId: googleId,
      clientSecret: googleSecret,
      // Both providers hand back verified email addresses, so linking the same
      // person arriving through a second provider is safe here.
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

if (githubId && githubSecret) {
  providers.push(
    GitHub({
      clientId: githubId,
      clientSecret: githubSecret,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

/** Which sign-in buttons to render. */
export const enabledProviders = providers.map((p) => {
  const conf = typeof p === "function" ? p() : p;
  return { id: (conf as { id: string }).id, name: (conf as { name: string }).name };
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers,
  session: { strategy: "database", maxAge: 60 * 60 * 24 * 90 },
  trustHost: true,
  pages: { signIn: "/", error: "/" },
  callbacks: {
    session({ session, user }) {
      const row = user as typeof users.$inferSelect;
      session.user.id = row.id;
      session.user.role = row.role === "host" ? "host" : "guest";
      session.user.status =
        (row.status as "profile" | "pending" | "approved" | "denied") ??
        "profile";
      session.user.displayName = row.displayName ?? null;
      return session;
    },
  },
  events: {
    /** The host never waits in the lobby. */
    async createUser({ user }) {
      if (!user.id || user.email?.toLowerCase() !== HOST_EMAIL) return;
      await db
        .update(users)
        .set({
          role: "host",
          status: "approved",
          displayName: user.name ?? "Host",
          decidedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    },
  },
});
