import type { Project } from "@/content/projects/types";
import TransitionLink from "@/components/TransitionLink";
import type { CSSProperties } from "react";

/**
 * Project card with the site-wide tactile grammar (DESIGN-V2 §4.1):
 * rest = hard 4px ink offset shadow; hover = lift (shadow grows, Ultramarine)
 * with the amber "selected file" tab appearing on the top edge; press = the
 * card translates into its shadow and the shadow collapses. 120ms, mechanical easing.
 * The screenshot carries the shared view-transition name so it animates
 * card → detail hero on navigation (DESIGN-V2 §4.4).
 */
export default function ProjectCard({ project }: { project: Project }) {
  return (
    <TransitionLink
      href={`/projects/${project.slug}`}
      className="group relative block border-2 border-line bg-paper shadow-rest transition-[transform,box-shadow,background-color] duration-150 ease-[cubic-bezier(0.2,0.9,0.3,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-amber hover:shadow-lift focus-visible:bg-amber focus-visible:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ultramarine active:translate-x-0.5 active:translate-y-0.5 active:shadow-press"
    >
      {/* Amber "selected file" tab — the file-selection metaphor from DESIGN.md, finally built. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-0 -translate-y-full border-2 border-b-0 border-line bg-amber px-2 py-0.5 font-mono text-xs text-ink opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {project.slug}
      </span>
      <div className="border-b-2 border-line p-2">
        <div
          className="aspect-video w-full border border-line/40 bg-ink/5"
          aria-hidden="true"
          style={{ viewTransitionName: `thumb-${project.slug}` } as CSSProperties}
        >
          {project.images[0] ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={project.images[0]} alt={`${project.title} screenshot`} loading="lazy" decoding="async" className="h-full w-full object-cover" />
          ) : null}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-display text-xl font-semibold tracking-tight">{project.title}</h3>
        <p className="mt-1 font-mono text-sm text-ink-soft">
          {project.year} — {project.techStack.length} technologies
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft group-hover:text-ink">{project.summary}</p>
      </div>
    </TransitionLink>
  );
}
