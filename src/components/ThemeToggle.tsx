import { Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { cn } from '../lib/utils';

/**
 * The light/dark switch — a sliding pill in this app's material: `rounded-full`
 * like the bottom-nav pill, a hairline `--line` border, a `--surface` track, and
 * a knob that inverts the foreground.
 *
 * Theme state lives in exactly one place: the `light`/`dark` class on <html>,
 * applied before first paint by the inline script in index.html. This component
 * reads that class through `useSyncExternalStore` rather than keeping a React
 * copy, so the DOM is the source of truth and two mounted switches (the mobile
 * header and the desktop nav are both rendered at all times, one hidden by CSS)
 * can never disagree — flipping one notifies the other.
 *
 * The knob's own glyph shows the theme you are in; the track's two glyphs sit
 * exactly under the knob's two resting positions, so the active one is simply
 * covered. No conditional colouring is needed to express "which is selected".
 */

type Theme = 'light' | 'dark';

const listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/**
 * Never used in this app — there is no server render — but `useSyncExternalStore`
 * requires it, and returning the light default keeps the contract honest.
 */
function getServerSnapshot(): Theme {
  return 'light';
}

function setTheme(next: Theme) {
  const root = document.documentElement.classList;
  root.toggle('dark', next === 'dark');
  root.toggle('light', next === 'light');
  try {
    localStorage.setItem('theme', next);
  } catch {
    /* Storage unavailable (private mode, blocked cookies). The theme still
       switches for this session; it just will not be remembered. */
  }
  listeners.forEach((notify) => notify());
}

const GLYPH = 13;

export default function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const dark = theme === 'dark';
  const label = dark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={label}
      title={label}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      /*
       * The button carries a 44px touch target while the pill inside it stays
       * 28px. The negative margin cancels the padding's layout footprint, so
       * the header's and the nav's rhythm are exactly what they were while a
       * thumb gets a real target. On the desktop nav the padding is dropped
       * again: a pointer needs 24px, not 44, and the nav is a single baseline.
       */
      className={cn(
        'group -my-2 inline-flex shrink-0 items-center justify-center py-2 md:my-0 md:py-0',
        className,
      )}
    >
      <span className="relative inline-flex h-7 w-12 items-center rounded-full border border-line bg-surface px-0.5 transition-colors duration-200 group-hover:border-line-strong md:w-14">
        {/* The two resting positions, drawn on the track. The knob covers one.
            Both slots are inset by the track's own padding, so they line up with
            the knob at either end whatever the track's width. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 bottom-0 left-0.5 flex w-5 items-center justify-center text-foreground-dim"
        >
          <Sun size={GLYPH} strokeWidth={1.75} />
        </span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0.5 bottom-0 flex w-5 items-center justify-center text-foreground-dim"
        >
          <Moon size={GLYPH} strokeWidth={1.75} />
        </span>
        <span
          aria-hidden="true"
          className={cn(
            'relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background transition-transform duration-300 ease-[cubic-bezier(0.2,0.9,0.3,1)] group-active:scale-95',
            dark ? 'translate-x-6 md:translate-x-8' : 'translate-x-0',
          )}
        >
          {dark ? <Moon size={GLYPH} strokeWidth={2} /> : <Sun size={GLYPH} strokeWidth={2} />}
        </span>
      </span>
    </button>
  );
}
