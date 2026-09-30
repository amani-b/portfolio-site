import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Project } from "../data/projects";

/**
 * The project's screenshots, as a plate grid with a full-screen viewer.
 *
 * Written in this app's own language rather than ported from the old site's
 * carousel: a two-up grid of bordered plates, a mono figure line, and a
 * full-screen viewer for reading the actual UI.
 *
 * The viewer is portalled to <body> on purpose. `position: fixed` resolves
 * against the nearest ancestor that establishes a containing block, and the
 * entry is wrapped in a motion.div that carries a transform during its scroll
 * entrance — inside it the viewer would be sized against the whole document
 * instead of the viewport. (The old portfolio hit exactly this bug.)
 *
 * While the viewer is open, `#root` is marked `inert`. That is what makes
 * `aria-modal="true"` true rather than merely asserted: it takes the entire
 * page behind the dialog out of the tab order and the accessibility tree, so
 * Tab cycles inside the viewer instead of wandering off into the nav. The
 * dialog is a sibling of `#root` under <body>, so it is unaffected.
 */

/** What is actually on screen, read from the files — plus each file's real size. */
const FIGURES: Record<string, { caption: string; width: number; height: number }> = {
  "/images/projects/cafeerp-1.png": {
    caption:
      "The CafeERP sign-in screen: a centred card with username and password fields over a cream background.",
    width: 1919,
    height: 933,
  },
  "/images/projects/cafeerp-2.png": {
    caption:
      "The CafeERP admin dashboard: a sidebar with Categories, Menu, Orders, Kitchen, Reports, Inventory and Users, next to an inventory status panel, a “browse & manage” menu card and quick actions.",
    width: 1894,
    height: 955,
  },
  "/images/projects/cafeerp-3.png": {
    caption:
      "The CafeERP AI Assistant open over the dashboard, showing an action awaiting approval: a createOrder tool payload for two chicken chilli pizzas, with Confirm and Cancel buttons.",
    width: 1891,
    height: 952,
  },
  "/images/projects/cafeerp-4.png": {
    caption:
      "The CafeERP Users page: a table of accounts by role (admin, staff, kitchen) with status, password status and Edit, Deactivate and Delete actions.",
    width: 1897,
    height: 949,
  },
};

/** Pixels of horizontal travel that commit a swipe. */
const SWIPE_COMMIT = 56;

export default function Screenshots({ project }: { project: Project }) {
  const [open, setOpen] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const swipeRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const count = project.images.length;

  const captionFor = (src: string, index: number) =>
    FIGURES[src]?.caption ?? `${project.title} screenshot ${index + 1}`;

  const close = useCallback(() => {
    setOpen(null);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const step = useCallback(
    (delta: number) => {
      setOpen((current) => (current === null ? null : (current + delta + count) % count));
    },
    [count],
  );

  useEffect(() => {
    if (open === null) return;
    const { body, documentElement } = document;
    const root = document.getElementById("root");
    const gap = window.innerWidth - documentElement.clientWidth;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;

    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    root?.setAttribute("inert", "");
    dialogRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
      /* Must come off before focus returns to the plate, which lives in #root. */
      root?.removeAttribute("inert");
    };
  }, [open, close, step]);

  /* Touch only: a horizontal drag on the figure moves to the next one. A tap
     on the controls never starts a swipe, so buttons stay clickable. */
  const onStagePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") return;
    if ((event.target as HTMLElement).closest("button")) return;
    swipeRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  };

  const onStagePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > SWIPE_COMMIT && Math.abs(dx) > Math.abs(dy) * 1.5) {
      step(dx < 0 ? 1 : -1);
    }
  };

  if (count === 0) return null;

  return (
    <div className="mt-10">
      <div className="flex items-baseline justify-between gap-4 border-t border-white/10 pt-4">
        <h4 className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
          Screenshots
        </h4>
        <p className="font-mono text-xs text-foreground-dim">
          {String(count).padStart(2, "0")} figures
        </p>
      </div>

      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {project.images.map((src, index) => {
          const figure = FIGURES[src];
          const caption = captionFor(src, index);
          return (
            <li key={src}>
              <button
                type="button"
                onClick={(event) => {
                  triggerRef.current = event.currentTarget;
                  setOpen(index);
                }}
                /* The plate is the whole control, so the name has to say what
                   it opens — the caption is otherwise only reachable once the
                   viewer is already open. */
                aria-label={`View figure ${index + 1} of ${count} larger — ${caption}`}
                className="group block w-full cursor-zoom-in border border-white/10 transition-colors hover:border-white/25"
              >
                <img
                  src={src}
                  alt={caption}
                  width={figure?.width}
                  height={figure?.height}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[2/1] w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                />
              </button>
              <p className="mt-2 font-mono text-[11px] text-foreground-dim">
                Fig. {String(index + 1).padStart(2, "0")} — {project.title}
              </p>
            </li>
          );
        })}
      </ul>

      {open !== null
        ? createPortal(
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label={`${project.title} screenshot ${open + 1} of ${count}`}
              tabIndex={-1}
              className="fixed inset-0 z-[60] flex flex-col bg-black/95 backdrop-blur-sm outline-none"
            >
              <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 font-mono text-xs text-foreground-dim">
                <span className="min-w-0 truncate">
                  Fig. {String(open + 1).padStart(2, "0")} / {String(count).padStart(2, "0")} —{" "}
                  {project.title}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Previous screenshot"
                    className="flex h-11 w-11 items-center justify-center transition-colors hover:text-foreground"
                  >
                    <ChevronLeft size={18} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Next screenshot"
                    className="flex h-11 w-11 items-center justify-center transition-colors hover:text-foreground"
                  >
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close screenshot viewer"
                    className="ml-1 flex h-11 w-11 items-center justify-center transition-colors hover:text-foreground"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Announced on every change: the dialog's own label updates, but
                  a label change on a live dialog is not read out. */}
              <p role="status" className="sr-only">
                Figure {open + 1} of {count}
              </p>

              <div
                onPointerDown={onStagePointerDown}
                onPointerUp={onStagePointerUp}
                onPointerCancel={() => {
                  swipeRef.current = null;
                }}
                className="flex flex-1 touch-pan-y items-center justify-center overflow-hidden p-4"
              >
                <img
                  src={project.images[open]}
                  alt={captionFor(project.images[open], open)}
                  className="max-h-full max-w-full border border-white/10 bg-muted"
                />
              </div>

              <p className="border-t border-white/10 px-4 py-3 text-center font-mono text-[11px] text-foreground-dim">
                {/* Keyboard hints only where there is a keyboard. The previous
                    copy told phone users to press Esc. */}
                <span className="md:hidden">Swipe or use the arrows between figures</span>
                <span className="hidden md:inline">
                  Arrow keys between figures · Esc to close
                </span>
              </p>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
