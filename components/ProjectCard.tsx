import type { Project } from "@/content/projects/types";
import TransitionLink from "@/components/TransitionLink";
import type { CSSProperties } from "react";

/**
 * Editorial index row — not a card. Each project is one ruled line in the
 * notebook: number, thumbnail, title + summary, year and an arrow that nudges
 * on hover. Whole row is a link; the screenshot carries the shared
 * view-transition name so it animates row → detail hero on navigation.
 */
export default function ProjectCard({
  project,
  index = 0,
}: {
  project: Project;
  index?: number;
}) {
  return (
    <TransitionLink
      href={`/projects/${project.slug}`}
      className="group relative grid grid-cols-[2rem_4.5rem_1fr_auto] items-center gap-x-4 border-t border-line py-6 transition-colors duration-200 sm:grid-cols-[2.5rem_7rem_1fr_auto] sm:gap-x-6"
    >
      {/*
        Full-bleed hover band: instead of tinting the row itself (which was
        flush with its edges), the wash is an absolutely positioned layer that
        bleeds 1.5rem past both sides of the text column — to the viewport edge
        on mobile, and past the grid rail on desktop — so the selection state
        has real breathing room while the ruled lines stay on the page grid.
      */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-6 -right-6 hidden bg-accent-wash opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:block"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-6 right-0 bg-accent-wash opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:hidden"
      />
      <span
        aria-hidden="true"
        className="font-mono text-sm text-ink-soft tabular-nums transition-colors duration-200 group-hover:text-accent"
      >
        {String(index + 1).padStart(2, "0")}
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
        <h3 className="font-display text-xl font-semibold tracking-tight transition-colors duration-200 group-hover:text-accent sm:text-2xl">
          <span className="rule-draw pb-0.5">{project.title}</span>
        </h3>
        <p className="mt-1 line-clamp-2 max-w-xl text-[15px] leading-relaxed text-ink-soft">
          {project.tagline}
        </p>
        <p className="mt-2 hidden truncate font-mono text-xs text-ink-soft sm:block">
          {project.techStack.slice(0, 4).join(" · ")}
        </p>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <span className="hidden font-mono text-sm text-ink-soft md:inline">{project.year}</span>
        <span
          aria-hidden="true"
          className="font-mono text-lg text-accent transition-transform duration-200 ease-out group-hover:translate-x-1"
        >
          →
        </span>
      </div>
    </TransitionLink>
  );
}
