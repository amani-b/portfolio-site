"use client";

import { useEffect, useRef } from "react";

/**
 * A hairline of progress at the very top of a long document.
 *
 * Case studies are the one place on the site where the reader is genuinely
 * scrolling rather than browsing, and on a phone the scroll position is the
 * only map you have. Two pixels of accent is the whole apparatus — no sticky
 * header, no chrome, no cost. Reads from the scroll position inside a rAF so
 * it can never make scrolling itself jittery.
 */
export default function ReadingProgress() {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = fillRef.current;
    if (!el) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.transform = `scaleX(${ratio})`;
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div aria-hidden="true" className="fixed inset-x-0 top-0 z-40 h-[2px] md:hidden">
      <div
        ref={fillRef}
        className="progress-fill h-full bg-accent"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
