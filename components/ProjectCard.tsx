import type { Project } from "@/content/projects/types";
import TransitionLink from "@/components/TransitionLink";
import type { CSSProperties } from "react";

/**
 * A project, in two compositions.
 *
 * - Desktop (md and up): an editorial index row — one ruled line in the
 *   notebook: number, thumbnail, title + summary, year and an arrow that
 *   nudges on hover. The screenshot carries the shared view-transition name
 *   so it animates row → detail on navigation.
 * - Phone: the same entry, given room to breathe. A four-column row squeezed
 *   onto a 360px screen reads as a shrunken desktop table; here the catalogue
 *   line (number, year) sits above a full-width plate, and the title,
 *   summary and stack stack up beneath it. Still ruled, still square, still
 *   the notebook — just drawn at the size a phone actually wants.
 *
 * Hover and press are the same idea in two channels: a mouse lifts, a finger
 * depresses. Both are declared so the entry feels alive either way.
 */
export default function ProjectCard({ project, index = 0 }: { project: Project; index?: number }) {
  const ordinal = String(index + 1).padStart(2, "0");

  return (
    <>
      {/* ————— Phone ————— */}
      <TransitionLink
        href={`/projects/${project.slug}`}
        className="group relative block border-t border-line py-5 md:hidden"
      >
        <div className="flex items-baseline justify-between font-mono text-[11px] tracking-[0.18em] text-ink-soft uppercase">
          <span className="tabular-nums">{ordinal}</span>
          <span>{project.year}</span>
        </div>

        <div
          aria-hidden="true"
          className="mt-3 aspect-[16/10] overflow-hidden border border-line bg-ink/5"
        >
          {project.images[0] ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={project.images[0]}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-active:scale-[1.03]"
            />
          ) : null}
        </div>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-display text-[1.375rem] leading-tight font-semibold tracking-tight transition-colors duration-200 group-active:text-accent">
              {project.title}
            </h3>
            <p className="mt-1.5 line-clamp-2 text-[15px] leading-relaxed text-ink-soft">
              {project.tagline}
            </p>
            <p className="mt-2 truncate font-mono text-[11px] text-ink-soft">
              {project.techStack.slice(0, 3).join(" · ")}
            </p>
          </div>
          <span
            aria-hidden="true"
            className="mt-1 shrink-0 font-mono text-lg text-accent transition-transform duration-200 ease-out group-active:translate-x-1"
          >
            →
          </span>
        </div>
      </TransitionLink>

      {/* ————— Desktop ————— */}
      <TransitionLink
        href={`/projects/${project.slug}`}
        className="group relative hidden grid-cols-[2.5rem_7rem_1fr_auto] items-center gap-x-6 border-t border-line py-6 transition-colors duration-200 md:grid"
      >
        {/*
          Full-bleed hover band: instead of tinting the row itself (which was
          flush with its edges), the wash is an absolutely positioned layer that
          bleeds 1.5rem past both sides of the text column — past the grid rail —
          so the selection state has real breathing room while the ruled lines
          stay on the page grid.
        */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -right-6 -left-6 bg-accent-wash opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        />
        <span
          aria-hidden="true"
          className="font-mono text-sm text-ink-soft tabular-nums transition-colors duration-200 group-hover:text-accent"
        >
          {ordinal}
        </span>

        <div
          aria-hidden="true"
          className="aspect-[4/3] w-full overflow-hidden border border-line bg-ink/5"
          style={{ viewTransitionName: `thumb-${project.slug}` } as CSSProperties}
        >
          {project.images[0] ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={project.images[0]}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          ) : null}
        </div>

        <div className="min-w-0">
          <h3 className="font-display text-2xl font-semibold tracking-tight transition-colors duration-200 group-hover:text-accent">
            <span className="rule-draw pb-0.5">{project.title}</span>
          </h3>
          <p className="mt-1 line-clamp-2 max-w-xl text-[15px] leading-relaxed text-ink-soft">
            {project.tagline}
          </p>
          <p className="mt-2 truncate font-mono text-xs text-ink-soft">
            {project.techStack.slice(0, 4).join(" · ")}
          </p>
        </div>

        <div className="flex items-center gap-5">
          <span className="font-mono text-sm text-ink-soft">{project.year}</span>
          <span
            aria-hidden="true"
            className="font-mono text-lg text-accent transition-transform duration-200 ease-out group-hover:translate-x-1"
          >
            →
          </span>
        </div>
      </TransitionLink>
    </>
  );
}
