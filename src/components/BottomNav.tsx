import { Code, GraduationCap, Home, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { nav } from '../data/profile';
import { cn } from '../lib/utils';

interface BottomNavProps {
  activeSection: string;
}

/**
 * The phone's navigation — the floating pill, unchanged in composition.
 *
 * Three changes:
 *  · `aria-current` exposes the active destination to assistive tech instead of
 *    leaving it implied by colour alone, and each link carries a screen-reader
 *    label — the icons are decorative, so the links previously had no accessible
 *    name at all.
 *  · `bottom-nav-offset` lifts the pill clear of the iOS home indicator.
 *  · The sliding indicator is measured from the live element rather than driven
 *    by a layout animation, so no animation library is needed to move a pill.
 */
const ICONS: Record<string, LucideIcon> = {
  home: Home,
  background: GraduationCap,
  projects: Code,
  about: User,
};

export default function BottomNav({ activeSection }: BottomNavProps) {
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
     * `activeSection` is a deliberate re-run trigger, not a value the effect
     * reads: the indicator has to be re-measured after React has moved
     * `data-active` onto a different cell. Removing it would freeze the pill on
     * the first section it ever measured.
     */
    // oxlint-disable-next-line react/exhaustive-effect-dependencies
  }, [activeSection, measure]);

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
    <div className="bottom-nav-offset pointer-events-none fixed left-0 right-0 z-50 flex justify-center px-4 md:hidden">
      <nav
        ref={navRef}
        aria-label="Primary"
        className="pointer-events-auto relative flex items-center gap-1 rounded-full border border-white/10 bg-surface/80 p-2 shadow-2xl backdrop-blur-xl"
      >
        {indicator ? (
          <span
            aria-hidden="true"
            className="nav-indicator pointer-events-none absolute top-2 bottom-2 left-0 rounded-full bg-white/10"
            style={{ transform: `translateX(${indicator.x}px)`, width: indicator.width }}
          />
        ) : null}

        {nav.map(({ id, label }) => {
          const Icon = ICONS[id];
          const isActive = activeSection === id;
          return (
            <a
              key={id}
              href={`#${id}`}
              data-active={isActive ? 'true' : undefined}
              aria-current={isActive ? 'location' : undefined}
              className={cn(
                'relative flex items-center justify-center rounded-full p-3 transition-colors duration-300',
                isActive ? 'text-foreground' : 'text-foreground-dim hover:text-foreground',
              )}
            >
              <Icon size={20} aria-hidden="true" />
              <span className="sr-only">{label}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
