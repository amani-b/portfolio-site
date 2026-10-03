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
 * Everything it renders comes from `project.images` — the captions, the
 * dimensions, the order. There is deliberately no per-project map in this file:
 * a screenshot's description is content, so it lives with the rest of the
 * content, and adding a project never means editing a component.
 *
 * The viewer is portalled to <body> on purpose. `position: fixed` resolves
 * against the nearest ancestor that establishes a containing block, and the
 * entry is wrapped in an element that carries a transform during its scroll
 * entrance — inside it the viewer would be sized against the whole document
 * instead of the viewport. (The old portfolio hit exactly this bug.)
 *
 * While the viewer is open, `#root` is marked `inert`. That is what makes
 * `aria-modal="true"` true rather than merely asserted: it takes the entire
 * page behind the dialog out of the tab order and the accessibility tree, so
 * Tab cycles inside the viewer instead of wandering off into the nav. The
 * dialog is a sibling of `#root` under <body>, so it is unaffected.
 */

/** Pixels of horizontal travel that commit a swipe. */
const SWIPE_COMMIT = 56;

export default function Screenshots({ project }: { project: Project }) {
  const [open, setOpen] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const swipeRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const images = project.images;
  const count = images.length;
  const isOpen = open !== null;

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

  /*
   * The page lock and the initial focus, keyed on *whether* the viewer is open
   * rather than on which figure is showing. Keying it on `open` re-ran the
   * whole block on every arrow press, which yanked focus off the control the
   * reader was on and back to the dialog container each time.
   */
  useEffect(() => {
    if (!isOpen) return;
    const { body, documentElement } = document;
    const root = document.getElementById("root");
    const gap = window.innerWidth - documentElement.clientWidth;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;

    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    root?.setAttribute("inert", "");
    dialogRef.current?.focus();

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
      /* Must come off before focus returns to the plate, which lives in #root. */
      root?.removeAttribute("inert");
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
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
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close, step]);

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
      <div className="flex items-baseline justify-between gap-4 border-t border-line pt-4">
        <h4 className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
          Screenshots
        </h4>
        <p className="font-mono text-xs text-foreground-dim">
          {String(count).padStart(2, "0")} figures
        </p>
      </div>

      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {images.map((image, index) => (
          <li key={image.src}>
            <button
              type="button"
              onClick={(event) => {
                triggerRef.current = event.currentTarget;
                setOpen(index);
              }}
              /* The plate is the whole control, so the name has to say what
                 it opens — the caption is otherwise only reachable once the
                 viewer is already open. */
              aria-label={`View figure ${index + 1} of ${count} larger — ${image.alt}`}
              className="group block w-full cursor-zoom-in border border-line transition-colors hover:border-line-strong"
            >
              <img
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                loading="lazy"
                decoding="async"
                className="aspect-[2/1] w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              />
            </button>
            <p className="mt-2 font-mono text-xs text-foreground-dim">
              Fig. {String(index + 1).padStart(2, "0")} — {project.title}
            </p>
          </li>
        ))}
      </ul>

      {open !== null
        ? createPortal(
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label={`${project.title} screenshot ${open + 1} of ${count}`}
              tabIndex={-1}
              /*
               * The viewer is painted on `--scrim`, not on the page palette.
               * These tokens are deliberately theme-independent (see index.css):
               * a screenshot should sit on the same surface in both themes, and
               * mapping the chrome to `--foreground` inverted it in light mode,
               * putting light labels on a light backdrop.
               */
              className="fixed inset-0 z-[60] flex flex-col bg-scrim/95 backdrop-blur-sm outline-none"
            >
              <div className="flex items-center justify-between gap-4 border-b border-scrim-line px-4 py-3 font-mono text-xs text-scrim-ink-soft">
                <span className="min-w-0 truncate">
                  Fig. {String(open + 1).padStart(2, "0")} / {String(count).padStart(2, "0")} —{" "}
                  {project.title}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Previous screenshot"
                    className="flex h-11 w-11 items-center justify-center transition-colors hover:text-scrim-ink"
                  >
                    <ChevronLeft size={18} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Next screenshot"
                    className="flex h-11 w-11 items-center justify-center transition-colors hover:text-scrim-ink"
                  >
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close screenshot viewer"
                    className="ml-1 flex h-11 w-11 items-center justify-center transition-colors hover:text-scrim-ink"
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
                  src={images[open].src}
                  alt={images[open].alt}
                  className="max-h-full max-w-full border border-scrim-line bg-scrim"
                />
              </div>

              <p className="border-t border-scrim-line px-4 py-3 text-center font-mono text-xs text-scrim-ink-soft">
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
