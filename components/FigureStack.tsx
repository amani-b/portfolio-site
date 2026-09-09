"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";

/**
 * The tactile screenshot browser (DESIGN-V2 §4.5) — the centerpiece of Phase 2b.
 *
 * - All screenshots render as a fanned stack of index cards: hard offset
 *   shadows, slight rotation offsets, each frame overlapping the previous.
 * - Wheel / drag on the stack cycles the top card to the back with an
 *   overshoot-and-settle; the mono caption tab shows "Figure N / M".
 * - Click (or Enter) opens a full-viewport lightbox via the View Transitions
 *   API — the figure is the shared element. Inside: drag to pan, wheel /
 *   pinch / ± to zoom toward the cursor, Esc to close, arrows between
 *   figures, 0 to reset. Focus is trapped, background scroll is locked, and
 *   focus returns to the originating figure on close.
 * - No third-party lightbox. With prefers-reduced-motion the stack renders
 *   flat and cycles via crossfade; the lightbox works fully by keyboard with
 *   no smoothing.
 */

const STACK_ROTATIONS = [-1.5, 0, 1.5];
const STACK_DEPTH_STEP = 24; // px of overlap per card behind the top
const DRAG_THRESHOLD = 40; // px of drag before a cycle triggers
const MAX_ZOOM = 4;
const MIN_ZOOM = 1;

type ZoomState = { scale: number; x: number; y: number };
const ZOOM_RESET: ZoomState = { scale: 1, x: 0, y: 0 };

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function FigureStack({ slug, images, title }: { slug: string; images: string[]; title: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState<ZoomState>(ZOOM_RESET);

  const dragState = useRef<{ pointerId: number; startX: number; startY: number } | null>(null);
  const pinchState = useRef<{ startDist: number; startScale: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lightboxRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = prefersReducedMotion();
  }, []);

  const count = images.length;

  /* ---------- stack cycling ---------- */

  // Wheel / drag on the stack cycles the top card to the back with an
  // overshoot-and-settle (the transition bezier below supplies the overshoot).
  const cycle = useCallback(() => {
    setActiveIndex((i) => (i + 1) % count);
  }, [count]);

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaY) < 8 && Math.abs(event.deltaX) < 8) return;
    event.preventDefault();
    cycle();
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    dragState.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (dx * dx + dy * dy > 36) setDragOffset({ x: dx, y: dy });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    dragState.current = null;
    setDragOffset(null);
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (dx * dx + dy * dy > DRAG_THRESHOLD * DRAG_THRESHOLD) cycle();
  };

  /* ---------- lightbox ---------- */

  const openLightbox = (index: number, trigger: HTMLElement) => {
    returnFocusRef.current = trigger;
    setZoom(ZOOM_RESET);
    if (!reducedMotion.current && typeof document.startViewTransition === "function") {
      document.startViewTransition(() => setLightboxIndex(index));
    } else {
      setLightboxIndex(index);
    }
  };

  const closeLightbox = useCallback(() => {
    const finish = () => returnFocusRef.current?.focus();
    if (!reducedMotion.current && typeof document.startViewTransition === "function") {
      document.startViewTransition(() => {
        setLightboxIndex(null);
        setZoom(ZOOM_RESET);
        // after the DOM update, so the figure is back before focus moves
        requestAnimationFrame(finish);
      });
    } else {
      setLightboxIndex(null);
      setZoom(ZOOM_RESET);
      finish();
    }
  }, []);

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
      // keep the point under the cursor stationary
      const ratio = scale / z.scale;
      return {
        scale,
        x: cx - ratio * (cx - z.x),
        y: cy - ratio * (cy - z.y),
      };
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
        const focusables = lightboxRef.current?.querySelectorAll<HTMLElement>("button, [href]");
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
      }
    }
  };

  // Body scroll lock + initial focus while the lightbox is open.
  useEffect(() => {
    if (lightboxIndex === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lightboxRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [lightboxIndex]);

  /* ---------- pinch (two-pointer) + pan inside the lightbox ---------- */

  const handleLightboxPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchState.current = { startDist: Math.hypot(a.x - b.x, a.y - b.y), startScale: zoom.scale };
    }
  };

  const handleLightboxPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size === 2 && pinchState.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAt((dist / pinchState.current.startDist) * pinchState.current.startScale);
      return;
    }
    // drag to pan (critically damped: 1:1, no smoothing)
    if (zoom.scale > 1) {
      setZoom((z) => ({ ...z, x: z.x + event.movementX, y: z.y + event.movementY }));
    }
  };

  const handleLightboxPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinchState.current = null;
  };

  /* ---------- rendering ---------- */

  const motionAllowed = typeof window === "undefined" ? true : !prefersReducedMotion();

  // Every figure has a unique view-transition-name at rest; while the
  // lightbox is open the name *moves* to the lightbox image (only one element
  // may carry a given name), so open and close both animate as shared-element
  // transitions. The first figure's rest name is the card→detail name (§4.4).
  const figureName = (index: number) => (index === 0 ? `thumb-${slug}` : `fig-${slug}-${index}`);
  const figureSharedStyle = (index: number): CSSProperties =>
    lightboxIndex === index ? {} : { viewTransitionName: figureName(index) };

  if (count === 0) return null;

  return (
    <div className="mt-step-5">
      {/* mono caption tab — Figure N / M */}
      <div className="mb-3 inline-block border-2 border-line bg-paper px-3 py-1 font-mono text-xs shadow-rest">
        Figure {activeIndex + 1} / {count} — {title}
      </div>

      {/* the fanned stack */}
      <div
        role="group"
        aria-label={`Screenshots for ${title}, figure ${activeIndex + 1} of ${count}`}
        className="relative"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ touchAction: "pan-y" }}
      >
        {images.map((src, index) => {
          const depth = (index - activeIndex + count) % count;
          const isTop = depth === 0;
          const rotation = motionAllowed ? STACK_ROTATIONS[depth % STACK_ROTATIONS.length] : 0;
          const isDragging = dragOffset !== null && isTop;

          return (
            <figure
              key={src}
              className={[
                "border-2 border-line bg-paper p-2 shadow-rest",
                isTop
                  ? "relative cursor-grab select-none active:cursor-grabbing"
                  : `pointer-events-none absolute inset-x-0 top-0`,
              ].join(" ")}
              style={{
                zIndex: count - depth,
                // Flat under reduced motion; fanned otherwise. Only the top
                // card follows the drag; deeper cards stay put.
                transform: motionAllowed
                  ? `translateY(${depth * STACK_DEPTH_STEP}px) rotate(${rotation}deg) scale(${1 - depth * 0.02})${
                      isDragging ? ` translate(${dragOffset.x}px, ${dragOffset.y}px)` : ""
                    }`
                  : undefined,
                transition: motionAllowed
                  ? "transform 0.4s cubic-bezier(0.34, 1.3, 0.64, 1), opacity 0.3s ease-out"
                  : undefined,
                // Reduced-motion crossfade: only the active figure is visible.
                opacity: motionAllowed || isTop ? 1 : 0,
              }}
            >
              <button
                type="button"
                onClick={(event) => openLightbox(index, event.currentTarget)}
                aria-label={`Open figure ${index + 1} of ${count} in lightbox`}
                className="block w-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${title} screenshot ${index + 1}`}
                  loading={isTop ? "eager" : "lazy"}
                  decoding="async"
                  draggable={false}
                  className="pointer-events-none w-full bg-ink/5"
                  style={figureSharedStyle(index)}
                />
              </button>
              <figcaption className="mt-2 flex items-baseline justify-between font-mono text-sm text-ink-soft">
                <span>Figure {index + 1}</span>
                <span>{title}</span>
              </figcaption>
            </figure>
          );
        })}
        {/* spacer giving the stack its height: top figure + fanned depth */}
        <div
          aria-hidden="true"
          className={motionAllowed ? "invisible" : "hidden"}
          style={{ paddingTop: (count - 1) * STACK_DEPTH_STEP }}
        />
      </div>

      {count > 1 ? (
        <p className="mt-3 font-mono text-xs text-ink-soft" aria-hidden="true">
          scroll / drag to cycle — click to open
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
          className="fixed inset-0 z-50 flex flex-col bg-paper/95 outline-none"
        >
          <div className="flex items-center justify-between border-b-2 border-line bg-paper px-4 py-2">
            <span className="font-mono text-xs">
              Figure {lightboxIndex + 1} / {count} — {Math.round(zoom.scale * 100)}%
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => zoomAt(1.25)}
                aria-label="Zoom in"
                className="border-2 border-line bg-paper px-2 py-0.5 font-mono text-sm transition-[transform,box-shadow,background-color] duration-150 ease-[cubic-bezier(0.2,0.9,0.3,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-amber hover:shadow-lift active:translate-x-0.5 active:translate-y-0.5 active:shadow-press"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => zoomAt(0.8)}
                aria-label="Zoom out"
                className="border-2 border-line bg-paper px-2 py-0.5 font-mono text-sm transition-[transform,box-shadow,background-color] duration-150 ease-[cubic-bezier(0.2,0.9,0.3,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-amber hover:shadow-lift active:translate-x-0.5 active:translate-y-0.5 active:shadow-press"
              >
                −
              </button>
              <button
                type="button"
                onClick={() => setZoom(ZOOM_RESET)}
                aria-label="Reset zoom"
                className="border-2 border-line bg-paper px-2 py-0.5 font-mono text-sm transition-[transform,box-shadow,background-color] duration-150 ease-[cubic-bezier(0.2,0.9,0.3,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-amber hover:shadow-lift active:translate-x-0.5 active:translate-y-0.5 active:shadow-press"
              >
                0
              </button>
              <button
                type="button"
                onClick={closeLightbox}
                aria-label="Close lightbox"
                className="border-2 border-line bg-magenta px-3 py-0.5 font-mono text-sm text-white transition-[transform,box-shadow] duration-150 ease-[cubic-bezier(0.2,0.9,0.3,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-lift active:translate-x-0.5 active:translate-y-0.5 active:shadow-press"
              >
                Esc ×
              </button>
            </div>
          </div>
          <div
            className={[
              "flex flex-1 items-center justify-center overflow-hidden p-6",
              zoom.scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in",
            ].join(" ")}
            style={{ touchAction: zoom.scale > 1 ? "none" : "auto" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[lightboxIndex]}
              alt={`${title} screenshot ${lightboxIndex + 1}`}
              className="max-h-full max-w-full border-2 border-line bg-paper p-2 shadow-rest"
              draggable={false}
              style={{
                ...(motionAllowed ? { viewTransitionName: figureName(lightboxIndex) } : {}),
                transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
                // critically damped: fast settle, no bounce
                transition: motionAllowed ? "transform 0.15s cubic-bezier(0.2, 0.9, 0.3, 1)" : undefined,
              }}
            />
          </div>
          <p className="border-t-2 border-line bg-paper px-4 py-2 text-center font-mono text-xs text-ink-soft">
            drag to pan · wheel / pinch / ± to zoom · ← → between figures · 0 to reset · esc to close
          </p>
        </div>
      ) : null}
    </div>
  );
}