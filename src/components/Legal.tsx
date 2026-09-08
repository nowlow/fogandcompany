import Link from "next/link";
import type { ReactNode } from "react";
import { Mark } from "./ui";
import { APP_NAME } from "@/lib/constants";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto min-h-dvh max-w-[680px] px-6 py-10 sm:px-10">
      <Link href="/" className="flex items-center gap-2.5">
        <Mark className="h-4 w-auto text-orange" />
        <span className="text-[12.5px] font-semibold tracking-[0.16em] uppercase">
          {APP_NAME}
        </span>
      </Link>

      <h1 className="mt-10 text-[2.4rem] leading-none tight">
        {title}
        <em className="wonky not-italic text-orange">.</em>
      </h1>
      <p className="eyebrow mt-3">Last updated {updated}</p>

      <div className="mt-10 space-y-8">{children}</div>

      <footer className="mt-16 flex gap-5 border-t border-rule pt-5 text-[12px] text-ink-faint">
        <Link href="/privacy" className="hover:text-orange">
          Privacy
        </Link>
        <Link href="/usage" className="hover:text-orange">
          House rules
        </Link>
        <Link href="/" className="hover:text-orange">
          Back to the door
        </Link>
      </footer>
    </main>
  );
}

export function Clause({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-[1.3rem] leading-snug tight">{heading}</h2>
      <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-ink-soft [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4 [&_strong]:text-ink [&_strong]:font-semibold">
        {children}
      </div>
    </section>
  );
}
