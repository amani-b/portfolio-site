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
 */
export default function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex w-full max-w-6xl items-baseline justify-between px-6 py-5">
        <TransitionLink
          href="/"
          className="font-display text-lg font-semibold tracking-tight transition-colors duration-150 hover:text-accent"
        >
          Alex Carter
        </TransitionLink>
        <nav aria-label="Primary" className="flex gap-5 font-mono text-[11px] uppercase tracking-[0.18em] sm:gap-7">
          {links.map((link) => {
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
          })}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
