"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mark, NavLink } from "./ui";
import { endSession } from "@/actions/auth";
import { APP_NAME } from "@/lib/constants";

export function Nav({
  name,
  host,
  pendingCount = 0,
}: {
  name: string;
  host: boolean;
  pendingCount?: number;
}) {
  const path = usePathname();
  const links = [
    { href: "/stay", label: "Book a stay" },
    { href: "/trips", label: "My trips" },
    ...(host
      ? [
          { href: "/host", label: "Front desk" },
          { href: "/host/people", label: "People" },
          { href: "/host/settings", label: "Settings" },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1180px] items-center gap-6 px-6 py-3.5 sm:px-10">
        <Link href="/stay" className="flex shrink-0 items-center gap-2.5">
          <Mark className="h-4 w-auto text-orange" />
          <span className="hidden text-[12.5px] font-semibold tracking-[0.16em] uppercase sm:inline">
            {APP_NAME}
          </span>
        </Link>

        <nav className="flex flex-1 items-center gap-5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {links.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              active={path === link.href}
            >
              {link.label}
              {link.href === "/host" && pendingCount > 0 ? (
                <span className="num ml-1.5 inline-flex h-[17px] min-w-[17px] items-center justify-center bg-orange px-1 text-[10px] text-card">
                  {pendingCount}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <span className="hidden text-[12.5px] text-ink-soft sm:inline">
            {name}
          </span>
          <form action={endSession}>
            <button type="submit" className="btn-quiet">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
