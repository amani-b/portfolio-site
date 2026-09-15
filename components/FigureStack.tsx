"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import type {
  CSSProperties,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from "react";

/**
 * Screenshot browser.
 *
 * Two compositions of one idea, split at the md breakpoint:
 *
 * - Desktop (md and up): a horizontal drag carousel with a wheel-free,
 *   keyboard-accessible counter. Unchanged.
 * - Phone: the same figures as a *pile of index cards*. The top card tracks
 *   your finger, rotates with the drag, and is flicked away; the pile steps up
 *   and the flicked card settles at the back. Depth comes from scale and
 *   offset, never from blur — the same flat, physical vocabulary as the rest
 *   of the site.
 *
 * Gesture contract (one gesture, one outcome, bidirectional):
 * - Drag left → next. Drag right → previous. Rubber-bands at the ends.
 * - Vertical scrolling is NEVER hijacked: the deck uses touch-action: pan-y;
 *   a drag is aborted entirely if the user's intent reads vertical.
 * - The mouse wheel is left alone — no scrolljacking. Arrows and a visible
 *   counter are the explicit affordances.
 * - Click vs drag can never double-fire: a tap opens the viewer only if the
 *   pointer moved less than 8px between down and up.
 * - Keyboard: ← → cycle; Enter opens the viewer.
 * - prefers-reduced-motion: no transitions anywhere; everything snaps.
 */

const SNAP_THRESHOLD_RATIO = 0.16; // fraction of viewport width that commits a slide
const MAX_ZOOM = 4;
const MIN_ZOOM = 1;

/* ————— Deck tuning ————— */
const DECK_COMMIT_RATIO = 0.22; // fraction of deck width that commits a flip
const DECK_FLICK_VELOCITY = 0.45; // px/ms — a fast flick commits early
const DECK_STACK_OFFSET = 10; // px each card behind the top one peeks down
const DECK_STACK_SHRINK = 0.024; // scale lost per level of depth
const DECK_MAX_DEPTH = 3; // cards deeper than this are not painted
const DECK_HOLD_MS = 170; // press-and-hold before the top card lifts
const DECK_DISMISS_MS = 300; // fly-out before the card is parked at the back
const DECK_SETTLE_MS = 560; // total flip choreography
const DECK_TAP_SLOP = 8; // px of travel that still counts as a tap

type ZoomState = { scale: number; x: number; y: number };
const ZOOM_RESET: ZoomState = { scale: 1, x: 0, y: 0 };

function figureName(index: number): string {
  return `figure-${index}`;
}

/*
 * The phone deck and the desktop track render the same figures, so they need
 * distinct view-transition names — Chrome counts every named element in the
 * document, `display: none` included, and aborts the transition on a clash.
 * The breakpoint is read the same way as reduced-motion: server snapshot
 * first (so hydration matches), live value immediately after.
 */
function deckFigureName(index: number): string {
  return `deck-figure-${index}`;
}

/** Media-query subscription for useSyncExternalStore (reduced-motion). */
function subscribeReducedMotion(onChange: () => void): () => void {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** Media-query subscription for useSyncExternalStore (phone layout). */
function subscribePhone(onChange: () => void): () => void {
  const mq = window.matchMedia("(max-width: 767px)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/*
 * The deck writes its poses straight to the DOM rather than through React
 * state: a finger moving across a card must not cost a render per frame. A
 * layout effect re-applies the same pose after every render, so React and the
 * gesture layer can never disagree about what the pile looks like.
 */
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

type Pose = {
  transform: string;
  opacity: string;
  zIndex: string;
  visibility: "visible" | "hidden";
  pointerEvents: "auto" | "none";
  transition: string;
};

type PoseContext = {
  index: number;
  count: number;
  width: number;
  dx: number;
  dy: number;
  dragging: boolean;
  lifted: boolean;
  out: number | null;
  outDir: 1 | -1;
  outPhase: "out" | "park";
};

function depthOpacity(depth: number): number {
  return Math.max(0, 1 - depth * 0.07);
}

function backOfPile(depth: number): string {
  return `translate3d(0, ${depth * DECK_STACK_OFFSET}px, 0) scale(${1 - depth * DECK_STACK_SHRINK})`;
}

/** Where card `i` sits, given everything the interaction layer knows. */
function poseFor(i: number, c: PoseContext): Pose {
  const depth = (i - c.index + c.count) % c.count;
  const isTop = depth === 0;
  const isOut = c.out === i;

  if (isOut && c.outPhase === "out") {
    return {
      transform: `translate3d(${c.outDir * 116}%, 0, 0) rotate(${c.outDir * 9}deg) scale(1)`,
      opacity: "0",
      zIndex: String(c.count + 2),
      visibility: "visible",
      pointerEvents: "none",
      transition: "",
    };
  }

  if (isOut) {
    /*
     * Parked at the back of the pile. The card is invisible at this instant,
     * so its transform is allowed to snap (0s) while the opacity fades back
     * in — that is what turns "flew off the top" into "went to the back"
     * without a visible rewind across the screen.
     */
    return {
      transform: backOfPile(depth),
      opacity: String(depthOpacity(depth)),
      zIndex: String(c.count - depth),
      visibility: "visible",
      pointerEvents: "none",
      transition: "transform 0s linear, opacity 220ms ease-out",
    };
  }

  if (isTop) {
    const lift = c.lifted ? 1 : 0;
    return {
      transform: `translate3d(${c.dx}px, ${c.dy * 0.26 - lift * 4}px, 0) rotate(${
        (c.dx / c.width) * 9
      }deg) scale(${1 + lift * 0.016})`,
      opacity: String(1 - Math.min(Math.abs(c.dx) / (c.width * 1.5), 0.5)),
      zIndex: String(c.count),
      visibility: "visible",
      pointerEvents: "auto",
      transition: c.dragging ? "none" : "",
    };
  }

  return {
    transform: backOfPile(depth),
    opacity: String(depthOpacity(depth)),
    zIndex: String(c.count - depth),
    visibility: depth > DECK_MAX_DEPTH ? "hidden" : "visible",
    pointerEvents: "none",
    transition: "",
  };
}

export default function FigureStack({
  images,
  title,
}: {
  slug: string;
  images: string[];
  title: string;
}) {
  const [index, setIndex] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState<ZoomState>(ZOOM_RESET);
  /** The swipe hint retires once the gesture has been discovered. */
  const [flipped, setFlipped] = useState(false);
  // Reactive, SSR-safe read of prefers-reduced-motion (no setState-in-effect).
  const motionAllowed = useSyncExternalStore(
    subscribeReducedMotion,
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
  // Which composition is on screen — decides which shared-element name the
  // viewer has to match. Server snapshot is "desktop" so hydration is clean.
  const isPhone = useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false,
  );

  const count = images.length;
  const viewportRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    dx: number;
    moved: boolean;
    aborted: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const pinch = useRef<{ startDist: number; startScale: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lightboxRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  /* ————— deck state (refs, not state: see useIsoLayoutEffect note) ————— */
  const deckRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const indexRef = useRef(0);
  const widthRef = useRef(1);
  const dragRef = useRef({ x: 0, y: 0, active: false });
  const liftedRef = useRef(false);
  const flipRef = useRef<{ out: number; dir: 1 | -1; phase: "out" | "park" } | null>(null);
  const gesture = useRef<{
    id: number;
    x: number;
    y: number;
    dx: number;
    dy: number;
    started: boolean;
    aborted: boolean;
    vx: number;
    lastX: number;
    lastT: number;
  } | null>(null);
  const holdTimer = useRef<number | null>(null);
  const flipTimers = useRef<number[]>([]);
  /** Set once the first flip happens so the hint stops nagging. */
  const deckHintShown = useRef(true);

  const clearHold = () => {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const applyDeckStyles = useCallback(() => {
    const total = images.length;
    const context: PoseContext = {
      index: indexRef.current,
      count: total,
      width: widthRef.current || 1,
      dx: dragRef.current.x,
      dy: dragRef.current.y,
      dragging: dragRef.current.active,
      lifted: liftedRef.current,
      out: flipRef.current?.out ?? null,
      outDir: flipRef.current?.dir ?? 1,
      outPhase: flipRef.current?.phase ?? "out",
    };

    for (let i = 0; i < total; i++) {
      const el = cardRefs.current[i];
      if (!el) continue;
      const pose = poseFor(i, context);
      el.style.transform = pose.transform;
      el.style.opacity = pose.opacity;
      el.style.zIndex = pose.zIndex;
      el.style.visibility = pose.visibility;
      el.style.pointerEvents = pose.pointerEvents;
      if (pose.transition) el.style.transition = pose.transition;
      else el.style.removeProperty("transition");
    }
  }, [images.length]);

  // Re-apply before paint so React's declarative pose and the gesture layer
  // never fight over a frame.
  useIsoLayoutEffect(() => {
    applyDeckStyles();
  });

  useEffect(() => {
    const timers = flipTimers.current;
    return () => {
      clearHold();
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const setLifted = (next: boolean) => {
    if (liftedRef.current === next) return;
    liftedRef.current = next;
    applyDeckStyles();
  };

  /* ---------- deck: flipping the pile ---------- */

  const flipTo = useCallback(
    (to: number) => {
      const total = images.length;
      const from = indexRef.current;
      if (to === from || to < 0 || to > total - 1) {
        applyDeckStyles();
        return;
      }

      const dir: 1 | -1 = to > from ? 1 : -1;
      indexRef.current = to;
      flipRef.current = { out: from, dir, phase: "out" };
      dragRef.current = { x: 0, y: 0, active: false };
      liftedRef.current = false;
      setIndex(to);
      if (deckHintShown.current) {
        deckHintShown.current = false;
        setFlipped(true);
      }
      applyDeckStyles();

      flipTimers.current.push(
        window.setTimeout(() => {
          const f = flipRef.current;
          if (!f || f.out !== from) return;
          flipRef.current = { ...f, phase: "park" };
          applyDeckStyles();
        }, DECK_DISMISS_MS),
      );

      flipTimers.current.push(
        window.setTimeout(() => {
          const f = flipRef.current;
          if (!f || f.out !== from) return;
          flipRef.current = null;
          applyDeckStyles();
        }, DECK_SETTLE_MS),
      );
    },
    [applyDeckStyles, images.length],
  );

  const handleDeckPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (flipRef.current) return; // let the current flip finish
    suppressClick.current = false;
    widthRef.current = deckRef.current?.offsetWidth ?? 1;
    gesture.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      dx: 0,
      dy: 0,
      started: false,
      aborted: false,
      vx: 0,
      lastX: event.clientX,
      lastT: performance.now(),
    };
    clearHold();
    // Hold a card and it lifts, the way you'd pick one up before deciding.
    holdTimer.current = window.setTimeout(() => setLifted(true), DECK_HOLD_MS);
  };

  const handleDeckPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.id !== event.pointerId || g.aborted) return;
    const dx = event.clientX - g.x;
    const dy = event.clientY - g.y;

    if (!g.started) {
      // Intent resolution: wait for a clear direction before claiming the gesture.
      if (Math.abs(dx) < DECK_TAP_SLOP && Math.abs(dy) < DECK_TAP_SLOP) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        g.aborted = true; // vertical gesture — hand it back to page scroll
        clearHold();
        setLifted(false);
        return;
      }
      g.started = true;
      suppressClick.current = true;
      deckRef.current?.setPointerCapture(event.pointerId);
    }

    clearHold();
    setLifted(false);

    const now = performance.now();
    const dt = now - g.lastT;
    if (dt > 0) {
      g.vx = (event.clientX - g.lastX) / dt;
      g.lastX = event.clientX;
      g.lastT = now;
    }

    // Rubber band: resistance when dragging past either end of the pile.
    const atStart = indexRef.current === 0 && dx > 0;
    const atEnd = indexRef.current === images.length - 1 && dx < 0;
    g.dx = atStart || atEnd ? dx * 0.32 : dx;
    g.dy = dy;
    dragRef.current = { x: g.dx, y: dy, active: true };
    applyDeckStyles();
  };

  const endDeckGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    gesture.current = null;
    clearHold();
    setLifted(false);
    if (!g || g.id !== event.pointerId) return;

    dragRef.current = { x: 0, y: 0, active: false };

    if (g.started && !g.aborted) {
      const width = widthRef.current || 1;
      const far = Math.abs(g.dx) > width * DECK_COMMIT_RATIO;
      const flicked =
        Math.abs(g.vx) > DECK_FLICK_VELOCITY &&
        Math.sign(g.vx) === Math.sign(g.dx) &&
        Math.abs(g.dx) > 20;
      if (far || flicked) {
        flipTo(indexRef.current + (g.dx < 0 ? 1 : -1));
        return;
      }
    }

    applyDeckStyles();
  };

  const cancelDeckGesture = () => {
    gesture.current = null;
    clearHold();
    setLifted(false);
    dragRef.current = { x: 0, y: 0, active: false };
    applyDeckStyles();
  };

  const handleDeckKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      flipTo(indexRef.current + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      flipTo(indexRef.current - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const trigger = cardRefs.current[indexRef.current]?.querySelector("button");
      openLightbox(indexRef.current, trigger ?? (event.currentTarget as HTMLElement));
    }
  };

  /* ---------- desktop carousel ---------- */

  const goTo = useCallback(
    (next: number) => {
      setIndex(Math.min(count - 1, Math.max(0, next)));
    },
    [count],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    suppressClick.current = false;
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dx: 0,
      moved: false,
      aborted: false,
    };
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

  // Focus the viewer when it opens so Esc/arrows land on it immediately.
  useEffect(() => {
    if (lightboxIndex !== null) lightboxRef.current?.focus();
  }, [lightboxIndex]);

  /*
   * Lock the page behind the viewer. The scrollbar is compensated for so
   * opening a screenshot never shifts the layout underneath it.
   */
  useEffect(() => {
    if (lightboxIndex === null) return;
    const root = document.documentElement;
    const { body } = document;
    const gap = window.innerWidth - root.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    root.classList.add("lightbox-open");
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => {
      root.classList.remove("lightbox-open");
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, [lightboxIndex]);

  /* ---------- lightbox: touch gestures ---------- */

  const lightboxImgRef = useRef<HTMLImageElement>(null);
  const swipe = useRef<{ id: number; x: number; y: number; dx: number; dy: number } | null>(null);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);

  /*
   * The viewer's transform is written imperatively while a finger is down, so
   * the image can follow a drag without a render per frame; this effect puts
   * it back under React's control on every render.
   */
  useEffect(() => {
    const img = lightboxImgRef.current;
    if (!img) return;
    img.style.transition = motionAllowed
      ? "transform 0.15s cubic-bezier(0.2, 0.9, 0.3, 1)"
      : "none";
    img.style.transform = `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`;
    img.style.opacity = "";
  }, [zoom, lightboxIndex, motionAllowed]);

  /** Live paint while a finger drags the figure. */
  const paintSwipe = () => {
    const img = lightboxImgRef.current;
    const s = swipe.current;
    if (!img || !s) return;
    const vertical = Math.abs(s.dy) >= Math.abs(s.dx);
    const dy = vertical ? s.dy : 0;
    const dx = vertical ? 0 : s.dx;
    img.style.transition = "none";
    img.style.transform = `translate(${dx * 0.55}px, ${dy}px) scale(${
      1 - Math.min(Math.abs(dy) / 1600, 0.06)
    })`;
    img.style.opacity = String(1 - Math.min(Math.abs(dy) / 400, 0.65));
  };

  /** Spring back to the resting transform. */
  const settleLightbox = () => {
    const img = lightboxImgRef.current;
    if (!img) return;
    img.style.transition = motionAllowed
      ? "transform 0.24s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.24s ease-out"
      : "none";
    img.style.transform = `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`;
    img.style.opacity = "";
  };

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
      swipe.current = null;
      return;
    }
    if (zoom.scale > 1) {
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    /*
     * Touch only. A finger on an un-zoomed figure dismisses it (down) or moves
     * to the next one (sideways); a mouse keeps the wheel/grab behaviour it
     * has always had.
     */
    if (event.pointerType !== "touch") return;
    if ((event.target as HTMLElement).closest("button")) return;
    swipe.current = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, dy: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleLightboxPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAt((pinch.current.startScale * dist) / pinch.current.startDist / zoom.scale);
      return;
    }

    if (zoom.scale > 1) {
      setZoom((z) =>
        z.scale > 1 ? { ...z, x: z.x + event.movementX, y: z.y + event.movementY } : z,
      );
      return;
    }

    const s = swipe.current;
    if (s && s.id === event.pointerId) {
      s.dx = event.clientX - s.x;
      s.dy = event.clientY - s.y;
      paintSwipe();
    }
  };

  const handleLightboxPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;

    const s = swipe.current;
    if (!s || s.id !== event.pointerId) return;
    swipe.current = null;

    const { dx, dy } = s;
    const vertical = Math.abs(dy) >= Math.abs(dx);

    if (vertical && Math.abs(dy) > 96) {
      closeLightbox();
      return;
    }
    if (!vertical && Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      stepLightbox(dx < 0 ? 1 : -1);
      return;
    }

    // A tap that stayed put: a second one is a double-tap zoom.
    if (Math.abs(dx) < DECK_TAP_SLOP && Math.abs(dy) < DECK_TAP_SLOP) {
      const now = performance.now();
      const previous = lastTap.current;
      if (
        previous &&
        now - previous.t < 320 &&
        Math.hypot(event.clientX - previous.x, event.clientY - previous.y) < 40
      ) {
        lastTap.current = null;
        if (zoom.scale > 1) {
          setZoom(ZOOM_RESET);
        } else {
          const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
          zoomAt(2, event.clientX - rect.left, event.clientY - rect.top);
        }
        return;
      }
      lastTap.current = { t: now, x: event.clientX, y: event.clientY };
    }

    settleLightbox();
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

  const deckContext: PoseContext = {
    index,
    count,
    width: 1,
    dx: 0,
    dy: 0,
    dragging: false,
    lifted: false,
    out: null,
    outDir: 1,
    outPhase: "out",
  };

  return (
    <section aria-label={`Screenshots of ${title}`} className="mt-6 md:mt-step-4">
      {/* ————————————————— Phone: the pile ————————————————— */}
      <div className="md:hidden">
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <p className="font-mono text-[11px] tracking-[0.18em] text-ink-soft uppercase">
            Screenshots
          </p>
          <p className="font-mono text-sm text-ink-soft tabular-nums" aria-live="polite">
            {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </p>
        </div>

        <div
          ref={deckRef}
          tabIndex={0}
          role="group"
          aria-roledescription="carousel"
          aria-label={`Screenshot ${index + 1} of ${count}. Swipe to flip, tap to enlarge.`}
          onPointerDown={handleDeckPointerDown}
          onPointerMove={handleDeckPointerMove}
          onPointerUp={endDeckGesture}
          onPointerCancel={cancelDeckGesture}
          onKeyDown={handleDeckKeyDown}
          className="deck relative mt-3 mb-4 aspect-[4/3] select-none"
        >
          {images.map((src, i) => {
            const pose = poseFor(i, deckContext);
            return (
              <div
                key={src}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className="deck-card"
                style={
                  {
                    /*
                     * The pile drops its shared-element names while the viewer
                     * is open: only one element may hold a given name at a
                     * time, and the viewer's figure takes it over for the
                     * open/close morph.
                     */
                    viewTransitionName: lightboxIndex === null ? deckFigureName(i) : undefined,
                    transform: pose.transform,
                    opacity: pose.opacity,
                    zIndex: pose.zIndex,
                    visibility: pose.visibility,
                    pointerEvents: pose.pointerEvents,
                  } as CSSProperties
                }
                aria-hidden={i === index ? undefined : true}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(event) => handleFigureClick(i, event)}
                  aria-label={`Open screenshot ${i + 1} of ${count} fullscreen`}
                  className={`block h-full w-full cursor-zoom-in overflow-hidden border bg-paper-raised transition-colors duration-200 ${
                    i === index ? "border-line-strong" : "border-line"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${title} screenshot ${i + 1}`}
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                    draggable={false}
                    className="pointer-events-none block h-full w-full object-cover"
                  />
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => flipTo(index - 1)}
            disabled={index === 0}
            aria-label="Previous screenshot"
            className="press flex h-11 w-11 shrink-0 items-center justify-center border border-line font-mono text-base leading-none disabled:opacity-25"
          >
            ←
          </button>

          <div className="flex flex-1 items-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                tabIndex={-1}
                onClick={() => flipTo(i)}
                aria-label={`Go to screenshot ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                className="flex h-11 flex-1 items-center"
              >
                <span
                  className={`block h-[3px] w-full transition-colors duration-200 ${
                    i === index ? "bg-accent" : "bg-line"
                  }`}
                />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => flipTo(index + 1)}
            disabled={index === count - 1}
            aria-label="Next screenshot"
            className="press flex h-11 w-11 shrink-0 items-center justify-center border border-line font-mono text-base leading-none disabled:opacity-25"
          >
            →
          </button>
        </div>

        <p className="mt-3 flex items-baseline justify-between gap-3 border-t border-line pt-3 font-mono text-[11px] text-ink-soft">
          <span className="min-w-0 truncate">
            Fig. {index + 1} — {title}
          </span>
          <span aria-hidden="true" className="shrink-0 text-ink-soft/70">
            {flipped ? "tap to enlarge" : "swipe to flip"}
          </span>
        </p>
      </div>

      {/* ————————————————— Desktop: the track ————————————————— */}
      <div className="hidden md:block">
        {/* header row: mono label + counter + controls */}
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <p className="font-mono text-[11px] tracking-[0.18em] text-ink-soft uppercase">
            Screenshots
          </p>
          <div className="flex items-center gap-4">
            <p className="font-mono text-sm text-ink-soft tabular-nums" aria-live="polite">
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
          className="mt-3 touch-pan-y overflow-hidden border border-line bg-paper-raised outline-none select-none"
        >
          <div
            className="flex"
            style={{
              transform: trackTransform,
              // Sharp during drag; smooth snap on release. Never transitions under reduced motion.
              transition:
                dragging || !motionAllowed
                  ? "none"
                  : "transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1)",
            }}
          >
            {images.map((src, i) => (
              <figure
                key={src}
                className="w-full shrink-0"
                style={
                  {
                    viewTransitionName: lightboxIndex === null ? figureName(i) : undefined,
                  } as CSSProperties
                }
              >
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
      </div>

      {/* ————————————————— Full-screen viewer ————————————————— */}
      {/*
        Portalled to <body> on purpose. `position: fixed` resolves against the
        nearest ancestor that establishes a containing block, and the case-study
        article's arrival animation (`.page-enter`) leaves a filled `translate`
        on it — which does exactly that. Inside the article the viewer was
        being sized against a 4300px document instead of the viewport, putting
        the figure thousands of pixels below the fold.
      */}
      {lightboxIndex !== null
        ? createPortal(
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
              className="fixed inset-0 z-50 flex flex-col bg-scrim outline-none"
            >
              <div className="flex items-center justify-between gap-4 border-b border-scrim-line px-4 py-2 font-mono text-xs text-scrim-ink-soft">
                <span className="min-w-0 truncate">
                  Fig. {lightboxIndex + 1} / {count}
                  <span className="hidden sm:inline"> — {title}</span>
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => zoomAt(1.25)}
                    aria-label="Zoom in"
                    className="press px-3 py-2.5 transition-colors duration-150 hover:text-accent sm:px-2 sm:py-0.5"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => zoomAt(0.8)}
                    aria-label="Zoom out"
                    className="press px-3 py-2.5 transition-colors duration-150 hover:text-accent sm:px-2 sm:py-0.5"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom(ZOOM_RESET)}
                    aria-label="Reset zoom"
                    className="press px-3 py-2.5 transition-colors duration-150 hover:text-accent sm:px-2 sm:py-0.5"
                  >
                    1:1
                  </button>
                  <button
                    type="button"
                    onClick={closeLightbox}
                    aria-label="Close lightbox"
                    className="press ml-1 px-3 py-2.5 transition-colors duration-150 hover:text-accent sm:ml-2 sm:px-2 sm:py-0.5"
                  >
                    esc ×
                  </button>
                </div>
              </div>
              <div
                className={[
                  "lightbox-stage flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-6",
                  zoom.scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in",
                ].join(" ")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={lightboxImgRef}
                  src={images[lightboxIndex]}
                  alt={`${title} screenshot ${lightboxIndex + 1}`}
                  className="max-h-full max-w-full border border-scrim-line bg-paper-raised"
                  draggable={false}
                  style={
                    {
                      viewTransitionName: isPhone
                        ? deckFigureName(lightboxIndex)
                        : figureName(lightboxIndex),
                    } as CSSProperties
                  }
                />
              </div>
              <p className="border-t border-scrim-line px-4 py-2.5 text-center font-mono text-[11px] text-scrim-ink-soft">
                <span className="md:hidden">
                  swipe for the next figure · pinch or double-tap to zoom · drag down to close
                </span>
                <span className="hidden md:inline">
                  drag to pan · wheel / pinch / ± to zoom · ← → between figures · 0 to reset · esc
                  to close
                </span>
              </p>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
