"use client";

import { useSyncExternalStore } from "react";

/**
 * Light/dark switch — a sliding pill consistent with the notebook language:
 * hairline border, raised paper track, solid-ink knob, mono glyph. The theme
 * lives as a `light`/`dark` class on <html>, applied before first paint by an
 * inline script in layout.tsx (stored preference, else system). Theme state is
 * read from the DOM via useSyncExternalStore — no duplicated React state. The
 * glyph span carries suppressHydrationWarning because the server render can't
 * know the theme.
 */

type Theme = "light" | "dark";

const listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

function setTheme(next: Theme) {
  const root = document.documentElement.classList;
  root.toggle("dark", next === "dark");
  root.toggle("light", next === "light");
  try {
    localStorage.setItem("theme", next);
  } catch {
    // storage unavailable (private mode etc.) — theme still switches for the session
  }
  listeners.forEach((notify) => notify());
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const dark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="group relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-line bg-paper-raised px-0.5 transition-colors duration-200 hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:h-8 sm:w-[4.5rem] sm:px-1"
    >
      {/* track glyphs — the destination of the knob is always the visible one */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-3 hidden font-mono text-xs transition-colors duration-200 sm:block ${
          dark ? "text-ink-soft" : "text-paper-raised"
        }`}
        suppressHydrationWarning
      >
        ☀
      </span>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute right-3 hidden font-mono text-xs transition-colors duration-200 sm:block ${
          dark ? "text-paper-raised" : "text-ink-soft"
        }`}
        suppressHydrationWarning
      >
        ☾
      </span>
      {/* knob */}
      <span
        aria-hidden="true"
        className={`relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-ink font-mono text-[11px] text-paper transition-transform duration-300 ease-[cubic-bezier(0.2,0.9,0.3,1)] group-active:scale-95 sm:h-6 sm:w-6 sm:text-xs ${
          dark ? "translate-x-5 sm:translate-x-[1.75rem]" : "translate-x-0"
        }`}
        suppressHydrationWarning
      >
        {dark ? "☾" : "☀"}
      </span>
    </button>
  );
}
