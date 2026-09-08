import type { ReactNode } from "react";
import Link from "next/link";
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
      <main className="mx-auto max-w-[1180px] px-6 pb-16 pt-6 sm:px-10">
        {children}
      </main>

      <footer className="mx-auto flex max-w-[1180px] gap-5 px-6 pb-10 text-[11.5px] text-ink-faint sm:px-10">
        <Link href="/privacy" className="hover:text-orange">
          Privacy
        </Link>
        <Link href="/usage" className="hover:text-orange">
          House rules
        </Link>
      </footer>
    </div>
  );
}
