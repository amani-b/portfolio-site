"use client";

import { usePathname } from "next/navigation";
import TransitionLink from "@/components/TransitionLink";
import ThemeToggle from "@/components/ThemeToggle";

const links = [
  { href: "/", label: "Work" },
  { href: "/projects", label: "Index" },
  { href: "/about", label: "About" },
];

/**
 * Minimal notebook header: name set in display type, nav in mono micro-caps.
 * The active route gets the site's only accent device — a solid orange dot —
 * so state is communicated without recoloring text.
 *
 * On small screens the header restructures rather than shrinking the desktop
 * layout: the toggle moves up beside the name, and the nav gets its own full
 * row underneath. That guarantees a real gap between the identity and nav
 * regardless of content width, and gives the nav room to breathe instead of
 * cramming three links plus a switch onto one baseline.
 */
export default function Header() {
  const pathname = usePathname();

  const navLinks = links.map((link) => {
    const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
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
      <div className="mx-auto w-full max-w-6xl px-6">
        {/*
          Mobile (<sm): stacked rows — name + toggle on top, nav on its own
          full-width row below. Desktop (sm+): the original single row, with
          the toggle back inside the nav.
        */}
        <div className="sm:flex sm:items-baseline sm:justify-between sm:py-5">
          <div className="flex items-center justify-between py-4 sm:py-0">
            <TransitionLink
              href="/"
              className="whitespace-nowrap font-display text-base font-semibold tracking-tight transition-colors duration-150 hover:text-accent sm:text-lg"
            >
              Alex Carter
            </TransitionLink>
            <div className="sm:hidden">
              <ThemeToggle />
            </div>
          </div>
          <nav
            aria-label="Primary"
            className="flex items-center gap-5 pb-3.5 font-mono text-[11px] uppercase tracking-[0.18em] sm:gap-7 sm:pb-0"
          >
            {navLinks}
            <span className="hidden sm:inline-block">
              <ThemeToggle />
            </span>
          </nav>
        </div>
      </div>
    </header>
  );
}
