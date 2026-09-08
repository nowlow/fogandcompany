import type { ReactNode } from "react";
import { Nav } from "./Nav";
import type { User } from "@/lib/schema";

export function Shell({
  user,
  pendingCount,
  children,
}: {
  user: User;
  pendingCount?: number;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <Nav
        name={user.displayName ?? user.name ?? "You"}
        host={user.role === "host"}
        pendingCount={pendingCount}
      />
      <main className="mx-auto max-w-[1180px] px-6 pb-28 pt-10 sm:px-10">
        {children}
      </main>
    </div>
  );
}
