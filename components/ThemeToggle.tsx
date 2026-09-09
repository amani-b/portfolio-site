"use client";

import { useSyncExternalStore } from "react";

/**
 * Light/dark toggle. The theme lives as a `light`/`dark` class on <html>,
 * applied before first paint by an inline script in layout.tsx (stored
 * preference, else system). This button flips the class and persists the
 * choice. Theme state is read from the DOM via useSyncExternalStore — no
 * duplicated React state. The glyph span carries suppressHydrationWarning
 * because the server render can't know the theme.
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

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title="Toggle light / dark"
      className="inline-flex h-5 w-5 items-center justify-center font-mono text-sm leading-none transition-colors duration-150 hover:text-accent"
    >
      <span aria-hidden="true" suppressHydrationWarning>
        {theme === "dark" ? "☀" : "☾"}
      </span>
    </button>
  );
}
