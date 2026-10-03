import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import type { Project } from '../data/projects';
import { Link } from '../lib/router';
import { cn } from '../lib/utils';

/**
 * The selected projects, as a horizontal rail.
 *
 * This replaces the old site's single "flagship" panel. That panel could only
 * ever show one project; a rail shows as many as are marked `featured` and
 * degrades honestly to one, which is the state the registry is actually in.
 *
 * Three decisions worth naming:
 *
 *  · The controls are real buttons, not a scroll hint. A rail whose only
 *    affordance is "try dragging" is unreachable by keyboard and invisible to
 *    anyone who has never used a trackpad. They are disabled at the ends rather
 *    than wrapping, because a rail that loops gives no sense of position.
 *  · The counter reads from the DOM, not from a card's assumed width — same
 *    approach as the bottom-nav indicator. Change the card width and the
 *    counter still tells the truth.
 *  · The cards link to the entry further down the page rather than to a route
 *    of their own. There is one case study per project and it lives on this
 *    page; a second destination for it would be a second place to drift.
 */
export default function ProjectRail({ projects }: { projects: Project[] }) {
  const railRef = useRef<HTMLUListElement>(null);
  const [state, setState] = useState({ index: 0, atStart: true, atEnd: true, scrollable: false });

  /* Measured, never assumed: card width + gap, read from the live elements. */
  const step = useCallback((direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    const first = rail.firstElementChild as HTMLElement | null;
    if (!first) return;
    const gap = parseFloat(getComputedStyle(rail).columnGap || '0') || 0;
    rail.scrollBy({ left: direction * (first.getBoundingClientRect().width + gap), behavior: 'smooth' });
  }, []);

  const measure = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const max = rail.scrollWidth - rail.clientWidth;
    const railRect = rail.getBoundingClientRect();
    const gutter = parseFloat(getComputedStyle(rail).paddingLeft) || 0;

    /*
     * The counter reports the snap position we are nearest, not "the card at the
     * gutter". Those are the same thing until the last card cannot reach the
     * gutter — at 375px the rail's remaining travel runs out first, so asking
     * which card sits on the gutter answers "none of them" and the counter
     * sticks at 01. Each card's snap offset is where the rail would have to
     * scroll to bring it to the gutter, clamped to the distance actually
     * available; the nearest of those is the position we are at.
     */
    const snapOffsets = Array.from(rail.children).map((child) => {
      const fromContentStart =
        child.getBoundingClientRect().left - railRect.left + rail.scrollLeft - gutter;
      return Math.min(Math.max(fromContentStart, 0), max);
    });

    let index = 0;
    let nearest = Infinity;
    snapOffsets.forEach((offset, position) => {
      const distance = Math.abs(offset - rail.scrollLeft);
      if (distance < nearest) {
        nearest = distance;
        index = position;
      }
    });

    setState({
      index,
      atStart: rail.scrollLeft <= 1,
      atEnd: rail.scrollLeft >= max - 1,
      scrollable: max > 1,
    });
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    measure();
    rail.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      rail.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  /* Web fonts land after first paint and can change a card's height, which is
     the only thing that could move the counter. Re-measure once, as the bottom
     nav does. */
  useEffect(() => {
    if (!document.fonts?.ready) return;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
    };
  }, [measure]);

  if (projects.length === 0) return null;

  const total = String(projects.length).padStart(2, '0');

  return (
    <div>
      <div className="mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-24">
        <div className="flex items-baseline justify-between gap-4 border-b border-line pb-4">
          <h2
            id="selected-heading"
            className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase"
          >
            Selected
          </h2>

          {/*
            Rendered only when there is somewhere to go. With a single selected
            project the rail is not scrollable, and the counter would read a
            bare "01" — a number with nothing to compare it to, sitting in the
            heading row for no reason. The other two section headings on this
            page are plain headings; this one is too, until it has a position to
            report. The arrows go with it, since they would be permanently
            disabled controls describing a feature that is not present.
          */}
          {state.scrollable ? (
            <div className="flex items-center gap-4">
              <p className="font-mono text-xs text-foreground-dim tabular-nums">
                <span className="sr-only">Showing </span>
                {String(state.index + 1).padStart(2, '0')} / {total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  disabled={state.atStart}
                  aria-label="Previous selected project"
                  className="flex h-11 w-11 items-center justify-center text-foreground-dim transition-colors hover:text-foreground disabled:cursor-default disabled:text-line-strong"
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  disabled={state.atEnd}
                  aria-label="Next selected project"
                  className="flex h-11 w-11 items-center justify-center text-foreground-dim transition-colors hover:text-foreground disabled:cursor-default disabled:text-line-strong"
                >
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <ul
        ref={railRef}
        /* `data-hscroll` marks this as an intentional horizontal scroller — the
           render audit skips descendants of these when it looks for elements
           that stick out past the viewport, because overflowing to the right is
           the entire point of a rail. Page-level overflow is still checked. */
        data-hscroll
        aria-labelledby="selected-heading"
        className="rail rail-gutter mx-auto mt-6 w-full max-w-7xl gap-4"
      >
        {projects.map((project, index) => (
          <li key={project.slug} className="w-[78vw] max-w-sm sm:w-[22rem] lg:w-[26rem]">
            <Link
              to={`#entry-${project.slug}`}
              className="group flex h-full flex-col border border-line bg-surface p-4 transition-colors hover:border-line-strong"
            >
              <div className="flex items-baseline justify-between gap-3 font-mono text-xs tracking-[0.18em] text-foreground-dim uppercase">
                <span className="tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                <span>{project.year}</span>
              </div>

              <div
                aria-hidden="true"
                className="mt-3 aspect-[16/10] overflow-hidden border border-line bg-muted"
              >
                {project.images[0] ? (
                  <img
                    src={project.images[0].src}
                    alt=""
                    width={project.images[0].width}
                    height={project.images[0].height}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                ) : null}
              </div>

              <h3 className="mt-4 text-2xl leading-tight font-medium tracking-tight text-foreground">
                <span className="link-underline">{project.title}</span>
              </h3>

              <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-muted-foreground">
                {project.tagline}
              </p>

              <p className="mt-3 font-mono text-xs text-foreground-dim">
                {project.techStack.slice(0, 3).join(' · ')}
              </p>

              <span className="mt-4 flex items-center gap-2 font-mono text-xs tracking-[0.18em] uppercase">
                Read the case study
                <ArrowUpRight
                  size={13}
                  aria-hidden="true"
                  className={cn(
                    'text-accent transition-transform duration-200',
                    'group-hover:translate-x-0.5 group-hover:-translate-y-0.5',
                  )}
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
