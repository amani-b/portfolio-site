import type { Project } from "@/content/projects/types";

/**
 * Flat, bordered project card per DESIGN.md: no radius, no shadow,
 * Highlighter Amber "selected file" hover.
 */
export default function ProjectCard({ project }: { project: Project }) {
  return (
    <a
      href={`/projects/${project.slug}`}
      className="group block border-2 border-line bg-paper transition-[transform,background-color] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-amber focus-visible:bg-amber focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ultramarine"
    >
      <div className="border-b-2 border-line p-2">
        <div className="aspect-video w-full border border-line/40 bg-ink/5" aria-hidden="true">
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
    </a>
  );
}
