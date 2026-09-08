"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const POLL_MS = 8_000;
/** Stop polling once the tab has been sitting untouched this long. */
const IDLE_MS = 5 * 60_000;

/**
 * Keeps the page in step with what other people are doing, without a reload.
 *
 * There is no socket to push down on serverless, so this polls a version
 * stamp and only refreshes when it actually changed. It sleeps whenever the
 * tab is hidden or the person has stopped touching it, which matters: a poll
 * that never sleeps would keep the database awake around the clock and eat
 * the free tier's compute hours.
 */
export function Live() {
  const router = useRouter();
  const version = useRef<string | null>(null);
  const lastActive = useRef(Date.now());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;

    const awake = () =>
      document.visibilityState === "visible" &&
      Date.now() - lastActive.current < IDLE_MS;

    const check = async () => {
      if (stopped || !awake()) return;
      try {
        const res = await fetch("/api/pulse", { cache: "no-store" });
        if (!res.ok) return;
        const { v } = (await res.json()) as { v: string };
        if (!v) return;
        if (version.current === null) version.current = v;
        else if (version.current !== v) {
          version.current = v;
          router.refresh();
        }
      } catch {
        // offline or mid-deploy; the next tick tries again
      }
    };

    const loop = async () => {
      await check();
      if (!stopped) timer = setTimeout(loop, POLL_MS);
    };

    const touch = () => {
      lastActive.current = Date.now();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        touch();
        void check();
      }
    };

    for (const event of ["pointerdown", "keydown", "scroll", "focus"] as const) {
      window.addEventListener(event, touch, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    timer = setTimeout(loop, POLL_MS);

    return () => {
      stopped = true;
      clearTimeout(timer);
      for (const event of ["pointerdown", "keydown", "scroll", "focus"] as const) {
        window.removeEventListener(event, touch);
      }
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [router]);

  return null;
}
