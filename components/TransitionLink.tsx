"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { flushSync } from "react-dom";
import type { MouseEvent, ReactNode } from "react";

type TransitionLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  prefetch?: boolean;
};

/**
 * A Link that drives route changes through the View Transitions API
 * (DESIGN-V2 §4.4) — progressive enhancement:
 * - Chromium + motion allowed: the outgoing page is snapshotted and crossfades
 *   into the incoming route; shared `view-transition-name` elements (project
 *   screenshots) animate card → detail and detail → next detail.
 * - No API support, modified click, or prefers-reduced-motion: plain navigation.
 *
 * The flushSync(router.push) recipe forces the router state update (served from
 * the Link prefetch when available) to render synchronously inside the
 * transition callback, so the incoming snapshot is the new page.
 */
export default function TransitionLink({ href, children, className, prefetch }: TransitionLinkProps) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    // Let the browser handle modified clicks / non-left clicks / target=_blank etc.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (typeof document.startViewTransition !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    event.preventDefault();
    document.startViewTransition(() => {
      flushSync(() => {
        router.push(href);
      });
    });
  }

  return (
    <Link href={href} className={className} prefetch={prefetch} onClick={handleClick}>
      {children}
    </Link>
  );
}
