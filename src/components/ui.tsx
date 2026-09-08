import Link from "next/link";
import type { ReactNode } from "react";

export function Mark({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M9 18.5V4.5M23 18.5V4.5" />
      <path d="M1 9c4 0 5-4.5 8-4.5 4 0 3 9.5 7 9.5s3-9.5 7-9.5c3 0 4 4.5 8 4.5" />
      <path d="M1 18.5h30" />
      <path d="M3.5 22h8M15.5 22h13" opacity="0.4" />
    </svg>
  );
}

export function Eyebrow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={`eyebrow ${className}`}>{children}</p>;
}

export function Sheet({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return <Tag className={`sheet ${className}`}>{children}</Tag>;
}

export function SectionHeading({
  label,
  title,
  action,
}: {
  label?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-rule pb-3">
      <div>
        {label ? <Eyebrow className="mb-1.5">{label}</Eyebrow> : null}
        <h2 className="text-2xl tight sm:text-[1.7rem]">{title}</h2>
      </div>
      {action ? <div className="shrink-0 pb-1">{action}</div> : null}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  approved: "text-bay border-bay/35 bg-bay/5",
  pending: "text-sun border-sun/40 bg-sun/5",
  denied: "text-ink-soft border-rule bg-transparent",
  cancelled: "text-ink-soft border-rule bg-transparent",
  blocked: "text-orange border-orange/35 bg-orange/5",
};

const STATUS_WORDS: Record<string, string> = {
  approved: "Confirmed",
  pending: "Awaiting answer",
  denied: "Declined",
  cancelled: "Cancelled",
  blocked: "Held by host",
};

export function StatusChip({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center border px-2 py-[3px] text-[10.5px] font-semibold uppercase tracking-[0.16em] ${
        STATUS_STYLES[status] ?? STATUS_STYLES.cancelled
      }`}
    >
      {STATUS_WORDS[status] ?? status}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="border border-dashed border-rule px-5 py-8 text-center text-sm text-ink-soft">
      {children}
    </p>
  );
}

export function NavLink({
  href,
  children,
  active,
}: {
  href: string;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`relative pb-0.5 text-[13px] tracking-wide transition-colors ${
        active
          ? "text-ink after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-orange"
          : "text-ink-soft hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
