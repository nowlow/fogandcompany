"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import type { ActionState } from "@/actions/state";

export function SubmitButton({
  children,
  pendingLabel,
  className = "btn",
  disabled,
  name,
  value,
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending || disabled}
      className={className}
    >
      {pending ? (pendingLabel ?? "Working…") : children}
    </button>
  );
}

export function Notice({ state }: { state: ActionState }) {
  if (!state?.error && !state?.message) return null;
  const bad = Boolean(state.error);
  return (
    <p
      role="status"
      className={`mt-4 border-l-2 py-2 pl-3 text-[13.5px] leading-relaxed ${
        bad ? "border-orange text-orange-deep" : "border-bay text-bay"
      }`}
    >
      {state.error ?? state.message}
    </p>
  );
}

export function Labelled({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="eyebrow mb-1.5 block">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-ink-faint">{hint}</p> : null}
    </div>
  );
}
