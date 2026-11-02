"use client";

import { useCallback, useSyncExternalStore } from "react";

export interface LocalItem {
  id: number;
  name: string;
  slug: string;
}

function makeStore(key: string, max: number) {
  const listeners = new Set<() => void>();
  let cache: LocalItem[] | null = null;
  const read = (): LocalItem[] => {
    if (cache) return cache;
    try {
      cache = JSON.parse(localStorage.getItem(key) ?? "[]") as LocalItem[];
    } catch {
      cache = [];
    }
    return cache;
  };
  const write = (items: LocalItem[]) => {
    cache = items;
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch {
      /* ignore quota / private mode */
    }
    listeners.forEach((l) => l());
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key === key) {
        cache = null;
        listeners.forEach((l) => l());
      }
    });
  }
  const empty: LocalItem[] = [];
  return {
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    get: read,
    getServer: () => empty,
    toggle: (item: LocalItem) => {
      const items = read();
      if (items.some((i) => i.id === item.id)) write(items.filter((i) => i.id !== item.id));
      else if (items.length < max) write([...items, item]);
    },
    remove: (id: number) => write(read().filter((i) => i.id !== id)),
    clear: () => write([]),
    max,
  };
}

const compareStore = makeStore("rs-compare", 3);
const watchStore = makeStore("rs-watchlist", 200);

function useStore(store: ReturnType<typeof makeStore>) {
  const items = useSyncExternalStore(store.subscribe, store.get, store.getServer);
  const has = useCallback((id: number) => items.some((i) => i.id === id), [items]);
  return { items, has, toggle: store.toggle, remove: store.remove, clear: store.clear, full: items.length >= store.max, max: store.max };
}

export function useCompare() {
  return useStore(compareStore);
}
export function useWatchlist() {
  return useStore(watchStore);
}
