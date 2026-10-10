import type { Project } from '../data/projects';
import { Link } from '../lib/router';

const HEAD = 'font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase';

/**
 * Every project, as a table: name, stack, year. Three columns, nothing else.
 *
 * It is a real `<table>` — `<caption>`, `<thead>`, `scope` on every header
 * cell, and the project name as a `scope="row"` header — rather than a stack
 * of divs that looks like one. A reader using a screen reader can ask for the
 * row's headers and be told "Tech stack: …", which a grid of divs cannot
 * answer. The name is the row header precisely because it is the row's
 * subject.
 *
 * Every row links to that project's detail document, so the table is a
 * contents list rather than decoration.
 */
export default function ProjectsTable({ projects }: { projects: Project[] }) {
  return (
    <table className="w-full border-collapse text-left">
      <caption className="sr-only">
        Every project: its name, the stack it was built with, and the year it
        was completed. Each name links to that project&apos;s detail page.
      </caption>
      <thead>
        <tr className="border-b border-line">
          <th scope="col" className={`${HEAD} pb-3 font-normal`}>
            Project
          </th>
          <th scope="col" className={`${HEAD} w-[42%] pb-3 font-normal sm:w-[45%]`}>
            Tech stack
          </th>
          <th scope="col" className={`${HEAD} w-14 pb-3 font-normal`}>
            Year
          </th>
        </tr>
      </thead>
      <tbody>
        {projects.map((project) => (
          <tr key={project.slug} className="border-b border-line align-top transition-colors hover:bg-wash">
            <th scope="row" className="py-5 pr-4 font-normal">
              {/*
                `inline-flex min-h-11` is not decoration: a bare inline link in a
                table cell measures about 24px tall, which is under the 44px
                touch bar this project holds itself to on a phone. The link is
                the only control in the row, so it has to carry the target.
              */}
              <Link
                to={`/projects/${project.slug}`}
                className="inline-flex min-h-11 items-center text-xl font-medium tracking-tight text-foreground sm:text-2xl"
              >
                <span className="link-underline">{project.title}</span>
              </Link>
            </th>
            <td className="py-5 pr-4">
              {/*
                Joined with a middot rather than rendered as a wrapped list of
                chips. At this column width the chips ran together — "Spring
                Data JPA Thymeleaf PostgreSQL" reads as one very long technology —
                and a `::after` separator on each chip dangles at the end of
                every wrapped line.
              */}
              <p className="font-mono text-xs leading-relaxed text-foreground-dim">
                {project.techStack.join(' · ')}
              </p>
            </td>
            <td className="py-5 font-mono text-xs text-muted-foreground tabular-nums">
              {project.year}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
