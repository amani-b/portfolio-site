import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * One-shot scroll entrance.
 *
 * Renders children in a wrapper that fades and rises the first time it enters
 * the viewport. `delay` staggers siblings. The hidden start state lives in
 * index.css under `prefers-reduced-motion: no-preference`, so the finished state
 * is what everyone else sees — this component only ever *adds* the class that
 * reveals it.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  /*
   * Starts visible in a browser with no IntersectionObserver, so content can
   * never be stranded at `opacity: 0` by a missing API. A lazy initialiser
   * rather than a `setVisible` inside the effect: a synchronous setState in an
   * effect body costs a second render before the first paint.
   */
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      /*
       * `threshold: 0` with a bottom-inset rootMargin, NOT a fractional
       * threshold. A fractional threshold is a function of the *target's* own
       * height, so an element taller than 1/threshold × the viewport can never
       * reach it and would stay invisible forever — which is exactly what
       * happens to the project entry once its case study is expanded on a
       * phone. This fires as soon as the element's top enters the viewport,
       * whatever its height.
       */
      { threshold: 0, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal${visible ? " is-visible" : ""}${className ? ` ${className}` : ""}`}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
