"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type {
  CSSProperties,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from "react";

/**
 * Screenshot browser — a horizontal drag carousel.
 *
 * Gesture contract (one gesture, one outcome, bidirectional):
 * - Drag left → next. Drag right → previous. Rubber-bands at the ends.
 * - Vertical scrolling is NEVER hijacked: the viewport uses touch-action: pan-y;
 *   a drag is aborted entirely if the user's intent reads vertical.
 * - The mouse wheel is left alone — no scrolljacking. Arrows and a visible
 *   counter are the explicit affordances.
 * - Click vs drag can never double-fire: a click opens the lightbox only if
 *   the pointer moved less than 8px between down and up.
 * - Keyboard: ← → cycle when the carousel has focus; the lightbox keeps the
 *   full keyboard set (Esc, arrows, zoom, Tab trap, focus return).
 * - prefers-reduced-motion: no transitions anywhere; everything snaps.
 */

const SNAP_THRESHOLD_RATIO = 0.16; // fraction of viewport width that commits a slide
const MAX_ZOOM = 4;
const MIN_ZOOM = 1;

type ZoomState = { scale: number; x: number; y: number };
const ZOOM_RESET: ZoomState = { scale: 1, x: 0, y: 0 };

function figureName(index: number): string {
  return `figure-${index}`;
}

/** Media-query subscription for useSyncExternalStore (reduced-motion). */
function subscribeReducedMotion(onChange: () => void): () => void {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export default function FigureStack({ images, title }: { slug: string; images: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState<ZoomState>(ZOOM_RESET);
  // Reactive, SSR-safe read of prefers-reduced-motion (no setState-in-effect).
  const motionAllowed = useSyncExternalStore(
    subscribeReducedMotion,
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );

  const count = images.length;
  const viewportRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; startX: number; startY: number; dx: number; moved: boolean; aborted: boolean } | null>(null);
  const suppressClick = useRef(false);
  const pinch = useRef<{ startDist: number; startScale: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lightboxRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const goTo = useCallback(
    (next: number) => {
      setIndex(Math.min(count - 1, Math.max(0, next)));
    },
    [count],
  );

  // Focus the lightbox when it opens so Esc/arrows land on it immediately.
  useEffect(() => {
    if (lightboxIndex !== null) lightboxRef.current?.focus();
  }, [lightboxIndex]);

  /* ---------- carousel drag ---------- */

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, dx: 0, moved: false, aborted: false };
    setDragging(true);
    // Don't setPointerCapture yet — we claim the gesture only once horizontal
    // intent is established, so vertical touch scrolling stays native.
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== event.pointerId || d.aborted) return;
    const dx = event.clientX - d.startX;
    const dy = event.clientY - d.startY;

    if (!d.moved) {
      // Intent resolution: wait for a clear direction before committing.
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        d.aborted = true; // vertical gesture — hand it back to page scroll
        setDragging(false);
        return;
      }
      d.moved = true;
      viewportRef.current?.setPointerCapture(event.pointerId);
    }

    // Rubber band: resistance when dragging past either end.
    const atStart = index === 0 && dx > 0;
    const atEnd = index === count - 1 && dx < 0;
    d.dx = atStart || atEnd ? dx * 0.3 : dx;
    setDragPx(d.dx);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    suppressClick.current = d ? d.moved : false;
    setDragPx(0);
    if (!d || d.pointerId !== event.pointerId || d.aborted || !d.moved) return;
    const width = viewportRef.current?.offsetWidth ?? 1;
    const threshold = Math.max(48, width * SNAP_THRESHOLD_RATIO);
    if (d.dx <= -threshold) goTo(index + 1);
    else if (d.dx >= threshold) goTo(index - 1);
  };

  // Click after a real drag must not open the lightbox.
  const handleFigureClick = (figure: number, event: ReactMouseEvent<HTMLButtonElement>) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    openLightbox(figure, event.currentTarget);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(index - 1);
    }
  };

  /* ---------- lightbox ---------- */

  const openLightbox = (figure: number, trigger: HTMLElement) => {
    returnFocus.current = trigger;
    setZoom(ZOOM_RESET);
    if (motionAllowed && typeof document.startViewTransition === "function") {
      document.startViewTransition(() => setLightboxIndex(figure));
    } else {
      setLightboxIndex(figure);
    }
  };

  const closeLightbox = useCallback(() => {
    const finish = () => returnFocus.current?.focus();
    if (motionAllowed && typeof document.startViewTransition === "function") {
      document.startViewTransition(() => {
        setLightboxIndex(null);
        setZoom(ZOOM_RESET);
        requestAnimationFrame(finish);
      });
    } else {
      setLightboxIndex(null);
      setZoom(ZOOM_RESET);
      finish();
    }
  }, [motionAllowed]);

  const stepLightbox = useCallback(
    (delta: number) => {
      if (lightboxIndex === null) return;
      setLightboxIndex((lightboxIndex + delta + count) % count);
      setZoom(ZOOM_RESET);
    },
    [lightboxIndex, count],
  );

  const zoomAt = useCallback((factor: number, cx?: number, cy?: number) => {
    setZoom((z) => {
      const scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z.scale * factor));
      if (scale === MIN_ZOOM) return ZOOM_RESET;
      if (cx === undefined || cy === undefined) return { ...z, scale };
      const ratio = scale / z.scale;
      return { scale, x: cx - ratio * (cx - z.x), y: cy - ratio * (cy - z.y) };
    });
  }, []);

  const handleLightboxWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (zoom.scale <= 1 && event.deltaY < 0) {
      zoomAt(1.2);
      return;
    }
    if (zoom.scale > 1) {
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      zoomAt(event.deltaY > 0 ? 1 / 1.2 : 1.2, event.clientX - rect.left, event.clientY - rect.top);
    }
  };

  const handleLightboxPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { startDist: Math.hypot(a.x - b.x, a.y - b.y), startScale: zoom.scale };
    } else if (zoom.scale > 1) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const handleLightboxPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAt((pinch.current.startScale * dist) / pinch.current.startDist / zoom.scale);
    } else if (zoom.scale > 1) {
      setZoom((z) => (z.scale > 1 ? { ...z, x: z.x + event.movementX, y: z.y + event.movementY } : z));
    }
  };

  const handleLightboxPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };

  // Lightbox keyboard: Esc close, arrows between figures, +/-/0 zoom, Tab trap.
  const handleLightboxKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "Escape":
        event.preventDefault();
        closeLightbox();
        return;
      case "ArrowRight":
        event.preventDefault();
        stepLightbox(1);
        return;
      case "ArrowLeft":
        event.preventDefault();
        stepLightbox(-1);
        return;
      case "+":
      case "=":
        event.preventDefault();
        zoomAt(1.25);
        return;
      case "-":
      case "_":
        event.preventDefault();
        zoomAt(0.8);
        return;
      case "0":
        event.preventDefault();
        setZoom(ZOOM_RESET);
        return;
      case "Tab": {
        const focusables = lightboxRef.current?.querySelectorAll<HTMLElement>("button");
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
        return;
      }
    }
  };

  const trackTransform = `translateX(calc(${index * -100}% + ${dragPx}px))`;

  if (count === 0) return null;

  return (
    <section aria-label={`Screenshots of ${title}`} className="mt-step-4">
      {/* header row: mono label + counter + controls */}
      <div className="flex items-baseline justify-between border-t border-line pt-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">Screenshots</p>
        <div className="flex items-center gap-4">
          <p className="font-mono text-sm tabular-nums text-ink-soft" aria-live="polite">
            {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </p>
          {count > 1 ? (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                disabled={index === 0}
                aria-label="Previous screenshot"
                className="px-2 py-0.5 font-mono text-base leading-none transition-colors duration-150 hover:text-accent disabled:opacity-25"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                disabled={index === count - 1}
                aria-label="Next screenshot"
                className="px-2 py-0.5 font-mono text-base leading-none transition-colors duration-150 hover:text-accent disabled:opacity-25"
              >
                →
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* viewport */}
      <div
        ref={viewportRef}
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label={`Screenshot ${index + 1} of ${count}. Use arrow keys to change, click a screenshot to enlarge.`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleKeyDown}
        className="mt-3 touch-pan-y select-none overflow-hidden border border-line bg-paper-raised outline-none"
      >
        <div
          className="flex"
          style={{
            transform: trackTransform,
            // Sharp during drag; smooth snap on release. Never transitions under reduced motion.
            transition: dragging || !motionAllowed ? "none" : "transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1)",
          }}
        >
          {images.map((src, i) => (
            <figure key={src} className="w-full shrink-0" style={{ viewTransitionName: figureName(i) } as CSSProperties}>
              <button
                type="button"
                onClick={(event) => handleFigureClick(i, event)}
                aria-label={`Open screenshot ${i + 1} of ${count} fullscreen`}
                className="block w-full cursor-zoom-in"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${title} screenshot ${i + 1}`}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  draggable={false}
                  className="pointer-events-none block w-full"
                />
              </button>
              <figcaption className="border-t border-line px-4 py-2 font-mono text-xs text-ink-soft">
                Fig. {i + 1} — {title}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      {count > 1 ? (
        <p className="mt-2 font-mono text-xs text-ink-soft" aria-hidden="true">
          drag sideways to flip · click to enlarge
        </p>
      ) : null}

      {/* ---------- lightbox ---------- */}
      {lightboxIndex !== null ? (
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${title} screenshot ${lightboxIndex + 1} of ${count}`}
          tabIndex={-1}
          onKeyDown={handleLightboxKeyDown}
          onWheel={handleLightboxWheel}
          onPointerDown={handleLightboxPointerDown}
          onPointerMove={handleLightboxPointerMove}
          onPointerUp={handleLightboxPointerUp}
          onPointerLeave={handleLightboxPointerUp}
          className="fixed inset-0 z-50 flex flex-col bg-ink/95 outline-none"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3 font-mono text-xs text-ink-soft">
            <span>
              Fig. {lightboxIndex + 1} / {count} — {title}
            </span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => zoomAt(1.25)} aria-label="Zoom in" className="px-2 py-0.5 transition-colors duration-150 hover:text-accent">
                +
              </button>
              <button type="button" onClick={() => zoomAt(0.8)} aria-label="Zoom out" className="px-2 py-0.5 transition-colors duration-150 hover:text-accent">
                −
              </button>
              <button type="button" onClick={() => setZoom(ZOOM_RESET)} aria-label="Reset zoom" className="px-2 py-0.5 transition-colors duration-150 hover:text-accent">
                1:1
              </button>
              <button type="button" onClick={closeLightbox} aria-label="Close lightbox" className="ml-2 px-2 py-0.5 transition-colors duration-150 hover:text-accent">
                esc ×
              </button>
            </div>
          </div>
          <div
            className={[
              "flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-6",
              zoom.scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in",
            ].join(" ")}
            style={{ touchAction: zoom.scale > 1 ? "none" : "auto" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[lightboxIndex]}
              alt={`${title} screenshot ${lightboxIndex + 1}`}
              className="max-h-full max-w-full border border-line bg-paper-raised"
              draggable={false}
              style={{
                viewTransitionName: figureName(lightboxIndex),
                transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
                transition: motionAllowed ? "transform 0.15s cubic-bezier(0.2, 0.9, 0.3, 1)" : undefined,
              }}
            />
          </div>
          <p className="border-t border-line px-4 py-2 text-center font-mono text-[11px] text-ink-soft">
            drag to pan · wheel / pinch / ± to zoom · ← → between figures · 0 to reset · esc to close
          </p>
        </div>
      ) : null}
    </section>
  );
}
