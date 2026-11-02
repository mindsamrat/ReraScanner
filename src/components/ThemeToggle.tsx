"use client";

import { Moon, Sun } from "lucide-react";
import { useDarkClass, useMounted } from "@/lib/useMounted";

export function ThemeToggle() {
  const mounted = useMounted();
  const dark = useDarkClass();
  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("rs-theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  };
  return (
    <button type="button" onClick={toggle} className="btn btn-sm !border-transparent !bg-transparent hover:!bg-bg-sunken" aria-label="Toggle colour theme">
      {mounted && dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
