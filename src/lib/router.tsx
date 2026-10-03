import {
  useSyncExternalStore,
  type AnchorHTMLAttributes,
  type MouseEvent,
} from 'react';

/**
 * A two-route router, written by hand.
 *
 * The site was a single page; it now has a second document at `/projects`. A
 * routing library (react-router and friends) was not added, for the same reason
 * an animation library was not: this needs `pushState`, `popstate`, and one
 * component that intercepts a plain left-click. That is the whole surface.
 *
 * Why real URLs rather than a hash route: `/projects` is a destination worth
 * linking to, sharing, and bookmarking, and a `#/projects` URL is none of those
 * things. It costs one rewrite rule in `vercel.json` (see the note there) and
 * nothing at runtime.
 *
 * The path is held in a module variable and read through `useSyncExternalStore`,
 * so the DOM's location is the single source of truth — the same pattern the
 * theme switch uses, and for the same reason.
 */

const listeners = new Set<() => void>();

/** `"/projects/"` and `"/projects"` are the same route. */
function normalize(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

let current = normalize(window.location.pathname);

function emit() {
  listeners.forEach((notify) => notify());
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): string {
  return current;
}

/** Required by `useSyncExternalStore`; this app has no server render. */
function getServerSnapshot(): string {
  return '/';
}

/*
 * The only place the path is re-read from outside a click: the back/forward
 * buttons. Registered once, at module load, because there is exactly one
 * document and one history.
 */
window.addEventListener('popstate', () => {
  const next = normalize(window.location.pathname);
  if (next === current) return;
  current = next;
  emit();
});

export const ROUTES = { home: '/', projects: '/projects' } as const;

/** The current pathname, normalized. Re-renders the caller when it changes. */
export function usePath(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function navigate(to: string) {
  /* Resolved against the current URL, not the origin: a relative `#entry-x`
     must keep the pathname it was written on. Resolving against the origin
     would turn it into `/`, which is a different route. */
  const url = new URL(to, window.location.href);
  const next = normalize(url.pathname);
  window.history.pushState(null, '', url.pathname + url.search + url.hash);
  if (next === current) return;
  current = next;
  emit();
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  /** An app path, optionally with a hash: `"/projects"`, `"/#about"`. */
  to: string;
};

/**
 * An `<a>` that stays an `<a>`.
 *
 * The `href` is always real, so middle-click, "open in new tab", and anything
 * that reads links (a crawler, a screen reader's link list) all behave. Only a
 * plain unmodified left-click on a *different* pathname is intercepted; every
 * other case falls through to the browser untouched.
 *
 * A same-path hash link (`/#about` while already on `/`) is deliberately NOT
 * intercepted: the browser's own handling already smooth-scrolls and respects
 * `scroll-padding-top`, and reimplementing it would mean reimplementing both.
 */
export function Link({ to, onClick, children, ...rest }: LinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const url = new URL(to, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (normalize(url.pathname) === current) return;

    event.preventDefault();
    navigate(to);
  }

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
