import { clsx, type ClassValue } from "clsx";

/**
 * Class-name joiner for the handful of places where a class list is
 * conditional.
 *
 * This is `clsx` alone — deliberately *not* wrapped in `tailwind-merge`.
 * tailwind-merge was measured at 8.8 kB gzip (10% of this app's JavaScript) to
 * resolve conflicting utilities at three call sites that never produce a
 * conflict. If you add classes here, write them so they don't fight; don't
 * reintroduce a merger to paper over it.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
