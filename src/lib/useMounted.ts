"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** True after hydration, false during SSR, without a setState-in-effect. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

/** Tracks whether the <html> element currently carries the `dark` class. */
export function useDarkClass(): boolean {
  return useSyncExternalStore(
    (cb) => {
      if (typeof document === "undefined") return noop();
      const obs = new MutationObserver(cb);
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      return () => obs.disconnect();
    },
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
}
