"use client";

import { useSyncExternalStore } from "react";

/**
 * Light/dark switch — a sliding pill consistent with the notebook language:
 * hairline border, raised paper track, solid-ink knob, hairline SVG glyph. The theme
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

/**
 * Sun and moon drawn as inline SVG in the site's hairline linework
 * (1.25 stroke, round caps — same weight as the rules and borders),
 * sized to the knob and optically centered, replacing the old Unicode
 * glyphs which never matched the mono font's weight or alignment.
 */

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1v1.8M8 13.2V15M15 8h-1.8M2.8 8H1M13.06 2.94l-1.27 1.27M4.21 11.79l-1.27 1.27M13.06 13.06l-1.27-1.27M4.21 4.21L2.94 2.94" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M13.2 9.6a5.6 5.6 0 1 1-6.8-6.8 5.6 5.6 0 0 0 6.8 6.8Z" />
    </svg>
  );
}

const GLYPH = "h-3 w-3 sm:h-3.5 sm:w-3.5";

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const dark = theme === "dark";

  return (
    /*
     * The button carries a 44px touch target; the pill inside it is unchanged.
     * The negative margin cancels the padding's layout footprint, so the
     * header's rhythm is exactly what it was while a thumb gets a real target.
     */
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="group -my-2 inline-flex shrink-0 items-center justify-center py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:my-0 sm:py-0"
    >
      <span className="relative inline-flex h-7 w-12 items-center rounded-full border border-line bg-paper-raised px-0.5 transition-colors duration-200 group-hover:border-line-strong sm:h-8 sm:w-[4.5rem] sm:px-1">
        {/* track glyphs — the destination of the knob is always the visible one */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-3 hidden transition-colors duration-200 sm:block ${
            dark ? "text-ink-soft" : "text-paper-raised"
          }`}
          suppressHydrationWarning
        >
          <SunIcon className={GLYPH} />
        </span>
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute right-3 hidden transition-colors duration-200 sm:block ${
            dark ? "text-paper-raised" : "text-ink-soft"
          }`}
          suppressHydrationWarning
        >
          <MoonIcon className={GLYPH} />
        </span>
        {/* knob */}
        <span
          aria-hidden="true"
          className={`relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-ink text-paper transition-transform duration-300 ease-[cubic-bezier(0.2,0.9,0.3,1)] group-active:scale-95 sm:h-6 sm:w-6 ${
            dark ? "translate-x-5 sm:translate-x-[1.75rem]" : "translate-x-0"
          }`}
          suppressHydrationWarning
        >
          {dark ? <MoonIcon className={GLYPH} /> : <SunIcon className={GLYPH} />}
        </span>
      </span>
    </button>
  );
}
