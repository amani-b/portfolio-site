"use client";

import { usePathname } from "next/navigation";
import TransitionLink from "@/components/TransitionLink";

const links = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
];

/**
 * Header with the route-aware active state DESIGN.md reserved Ultramarine for
 * (DESIGN-V2 Finding C fix): active link gets Ultramarine + 2px rule + aria-current.
 * Nav links use TransitionLink so route changes get the View Transition crossfade.
 */
export default function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b-2 border-line bg-paper">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-step-2">
        <TransitionLink
          href="/"
          className="inline-block font-display text-lg font-semibold tracking-tight transition-transform duration-150 ease-[cubic-bezier(0.2,0.9,0.3,1)] hover:text-ultramarine active:translate-x-0.5 active:translate-y-0.5"
        >
          Alex Carter
        </TransitionLink>
        <nav className="flex gap-6 text-sm">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <TransitionLink
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "border-b-2 border-ultramarine pb-0.5 font-medium text-ultramarine"
                    : "inline-block border-b-2 border-transparent pb-0.5 transition-transform duration-150 ease-[cubic-bezier(0.2,0.9,0.3,1)] hover:text-ultramarine hover:underline hover:underline-offset-4 active:translate-x-0.5 active:translate-y-0.5"
                }
              >
                {link.label}
              </TransitionLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

