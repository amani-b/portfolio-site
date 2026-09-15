"use client";

import { usePathname } from "next/navigation";
import TransitionLink from "@/components/TransitionLink";
import ThemeToggle from "@/components/ThemeToggle";

const links = [
  { href: "/", label: "Work" },
  { href: "/projects", label: "Index" },
  { href: "/about", label: "About" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * Minimal notebook header: name set in display type, nav in mono micro-caps.
 * The active route gets the site's only accent device — a solid orange dot —
 * so state is communicated without recoloring text.
 *
 * Two compositions, one rule each:
 *
 * - Phone: a single slim line. The name anchors the left, and the section
 *   you are currently in sits on the right in mono micro-caps — which both
 *   balances the row and replaces the nav's state signal now that the nav
 *   itself lives in the bottom bar, where a thumb can reach it.
 * - Desktop (md and up): the original single row, name against nav, with the
 *   theme switch back on the nav baseline.
 */
export default function Header() {
  const pathname = usePathname();
  const current = links.find((link) => isActive(pathname, link.href)) ?? links[0];

  const navLinks = links.map((link) => {
    const active = isActive(pathname, link.href);
    return (
      <TransitionLink
        key={link.href}
        href={link.href}
        aria-current={active ? "page" : undefined}
        className="group inline-flex items-center gap-1.5 transition-colors duration-150 hover:text-accent"
      >
        <span
          aria-hidden="true"
          className={`inline-block h-1.5 w-1.5 rounded-full transition-opacity duration-150 ${
            active ? "bg-accent opacity-100" : "bg-accent opacity-0 group-hover:opacity-40"
          }`}
        />
        {link.label}
      </TransitionLink>
    );
  });

  return (
    <header className="border-b border-line">
      <div className="mx-auto w-full max-w-6xl px-5 md:px-6">
        {/* ————— Phone ————— */}
        <div className="flex items-baseline justify-between py-3.5 md:hidden">
          <TransitionLink
            href="/"
            className="press font-display text-base font-semibold tracking-tight whitespace-nowrap"
          >
            Amanuel Berhanu
          </TransitionLink>
          <span
            aria-hidden="true"
            className="font-mono text-[11px] tracking-[0.18em] text-ink-soft uppercase"
          >
            {current.label}
          </span>
        </div>

        {/* ————— Desktop ————— */}
        <div className="hidden md:flex md:items-baseline md:justify-between md:py-5">
          <TransitionLink
            href="/"
            className="font-display text-lg font-semibold tracking-tight whitespace-nowrap transition-colors duration-150 hover:text-accent"
          >
            Amanuel Berhanu
          </TransitionLink>
          <nav
            aria-label="Primary"
            className="flex items-center gap-7 font-mono text-[11px] tracking-[0.18em] uppercase"
          >
            {navLinks}
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
