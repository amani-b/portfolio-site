"use client";

import { usePathname } from "next/navigation";
import TransitionLink from "@/components/TransitionLink";
import ThemeToggle from "@/components/ThemeToggle";

/**
 * Bottom tab bar — the phone's primary navigation.
 *
 * The desktop header keeps its nav on the top baseline; on a phone that
 * baseline is the single hardest place to reach one-handed, so navigation
 * moves to the bottom edge and the header sheds its second row entirely.
 *
 * The bar is the same three destinations as the header, in the same order,
 * plus the theme switch — no new IA, just relocated into the thumb arc.
 * State is carried by the site's one accent device: a hairline rule that
 * draws itself, the same gesture as `.rule-draw` on a link, rotated to the
 * horizontal. Icons are hairline linework at the same stroke weight as the
 * theme switch, so the bar reads as part of the notebook rather than a
 * platform tab bar dropped on top of it.
 */

type IconProps = { className?: string };

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Work — a ruled notebook page. */
function WorkIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...STROKE} className={className} aria-hidden="true">
      <path d="M5.5 3.5h13v17h-13z" />
      <path d="M9 8.75h6M9 12h6M9 15.25h3.5" />
    </svg>
  );
}

/** Index — a ruled list with its marks in the margin. */
function IndexIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...STROKE} className={className} aria-hidden="true">
      <path d="M3.75 6.5h2.5M3.75 12h2.5M3.75 17.5h2.5" />
      <path d="M10 6.5h10.25M10 12h10.25M10 17.5h10.25" />
    </svg>
  );
}

/** About — a person, drawn as one continuous line. */
function AboutIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...STROKE} className={className} aria-hidden="true">
      <circle cx="12" cy="8.25" r="3.6" />
      <path d="M4.9 20.4c.95-3.5 3.7-5.5 7.1-5.5s6.15 2 7.1 5.5" />
    </svg>
  );
}

const items = [
  { href: "/", label: "Work", Icon: WorkIcon },
  { href: "/projects", label: "Index", Icon: IndexIcon },
  { href: "/about", label: "About", Icon: AboutIcon },
];

/** One shared cell rhythm so the switch lines up with the three destinations. */
const CELL = "relative flex h-[3.75rem] flex-col items-center justify-center gap-1";
const SLOT = "flex h-8 items-center justify-center";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="tabbar tabbar-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper md:hidden"
    >
      <ul className="flex items-stretch">
        {items.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <TransitionLink
                href={href}
                aria-current={active ? "page" : undefined}
                className={`${CELL} press`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ${
                    active ? "bg-accent-wash opacity-100" : "opacity-0"
                  }`}
                />
                {active ? (
                  <span
                    aria-hidden="true"
                    className="tab-rule pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-accent"
                  />
                ) : null}
                <span className={SLOT}>
                  <Icon
                    className={`relative h-[1.375rem] w-[1.375rem] transition-colors duration-200 ${
                      active ? "tab-pop text-accent" : "text-ink-soft"
                    }`}
                  />
                </span>
                <span
                  className={`relative font-mono text-[10px] tracking-[0.16em] uppercase transition-colors duration-200 ${
                    active ? "text-accent" : "text-ink-soft"
                  }`}
                >
                  {label}
                </span>
              </TransitionLink>
            </li>
          );
        })}

        {/* Theme lives with the nav rather than in the header: same reason —
            it is a thing you reach for with a thumb, not a thing you read. */}
        <li className="flex-1">
          <div className={CELL}>
            <span className={SLOT}>
              <ThemeToggle />
            </span>
            <span className="font-mono text-[10px] tracking-[0.16em] text-ink-soft uppercase">
              Theme
            </span>
          </div>
        </li>
      </ul>
    </nav>
  );
}
