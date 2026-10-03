import { Code, GraduationCap, Home, List, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { nav } from '../data/profile';
import { Link } from '../lib/router';
import { cn } from '../lib/utils';
import ThemeToggle from './ThemeToggle';

interface BottomNavProps {
  /** The section in view on the home page, or `"index"` on the projects page. */
  activeKey: string;
}

/**
 * The phone's navigation — the floating pill, unchanged in composition.
 *
 * It now carries five destinations and the theme switch, which is the most that
 * will fit: six 44px controls plus gaps is wider than a 320px viewport, and 44px
 * is not negotiable. The spacing therefore tightens below 360px and relaxes
 * above it, rather than the targets shrinking. See the note in the README.
 *
 * Other changes:
 *  · `aria-current` exposes the active destination to assistive tech instead of
 *    leaving it implied by colour alone, and each link carries a screen-reader
 *    label — the icons are decorative, so the links previously had no accessible
 *    name at all.
 *  · `bottom-nav-offset` lifts the pill clear of the iOS home indicator.
 *  · The sliding indicator is measured from the live element rather than driven
 *    by a layout animation, so no animation library is needed to move a pill.
 *  · The theme switch sits outside the `<nav>`: it is a control, not a
 *    destination, and a `<nav>` should contain navigation.
 */
const ICONS: Record<string, LucideIcon> = {
  home: Home,
  background: GraduationCap,
  work: Code,
  index: List,
  about: User,
};

export default function BottomNav({ activeKey }: BottomNavProps) {
  const navRef = useRef<HTMLElement>(null);
  const [indicator, setIndicator] = useState<{ x: number; width: number } | null>(null);

  /* Measure the active cell from the DOM — no hard-coded geometry, so it stays
     correct if a label or icon size ever changes. */
  const measure = useCallback(() => {
    const container = navRef.current;
    const active = container?.querySelector<HTMLElement>('[data-active="true"]');
    if (!container || !active) return;
    const containerRect = container.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    setIndicator({
      x: activeRect.left - containerRect.left - container.clientLeft,
      width: activeRect.width,
    });
  }, []);

  useLayoutEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
    /*
     * `activeKey` is a deliberate re-run trigger, not a value the effect reads:
     * the indicator has to be re-measured after React has moved `data-active`
     * onto a different cell. Removing it would freeze the pill on the first
     * destination it ever measured.
     */
    // oxlint-disable-next-line react/exhaustive-effect-dependencies
  }, [activeKey, measure]);

  /* Web fonts land after first paint and can shift the cells; re-measure once. */
  useEffect(() => {
    if (!document.fonts?.ready) return;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
    };
  }, [measure]);

  return (
    <div className="bottom-nav-offset pointer-events-none fixed left-0 right-0 z-50 flex justify-center px-3 min-[360px]:px-4 md:hidden">
      <div className="pointer-events-auto relative flex items-center rounded-full border border-line bg-surface/80 p-1 shadow-2xl backdrop-blur-xl min-[360px]:p-2">
        <nav ref={navRef} aria-label="Primary" className="flex items-center">
          {indicator ? (
            <span
              aria-hidden="true"
              className="nav-indicator pointer-events-none absolute top-1 bottom-1 left-0 rounded-full bg-wash-strong min-[360px]:top-2 min-[360px]:bottom-2"
              style={{ transform: `translateX(${indicator.x}px)`, width: indicator.width }}
            />
          ) : null}

          {nav.map(({ id, label, href }) => {
            const Icon = ICONS[id];
            const isActive = activeKey === id;
            return (
              <Link
                key={id}
                to={href}
                data-active={isActive ? 'true' : undefined}
                aria-current={isActive ? 'location' : undefined}
                className={cn(
                  'relative flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-300',
                  isActive ? 'text-foreground' : 'text-foreground-dim hover:text-foreground',
                )}
              >
                <Icon size={20} aria-hidden="true" />
                <span className="sr-only">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Hairline, then the switch. Two groups in one pill, not six peers. */}
        <span aria-hidden="true" className="mx-1 h-6 w-px bg-line min-[360px]:mx-1.5" />

        <ThemeToggle />
      </div>
    </div>
  );
}
