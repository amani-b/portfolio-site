import type { Project } from '../data/projects';
import { Link } from '../lib/router';

/**
 * Every project, as a table: name, the year it was completed, and the stack.
 *
 * This is the one thing on the site that was *not* carried over from the old
 * version — the old `/projects` page listed the projects as editorial rows and
 * had no table anywhere, so there was no scaffolding to imitate. It is written
 * in this app's language instead: hairline rules, mono micro-labels, one accent.
 *
 * It is a real `<table>` — `<caption>`, `<thead>`, `scope` on every header cell,
 * and the project name as a `scope="row"` header — rather than a stack of divs
 * that looks like one. A reader using a screen reader can ask for the row's
 * headers and be told "Year: 2026", which a grid of divs cannot answer. The
 * name is the row header precisely because it is the row's subject.
 *
 * Every row links to its case study further down this page, so the table is a
 * contents list rather than decoration.
 */
export default function ProjectsTable({ projects }: { projects: Project[] }) {
  const HEAD = 'font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase';

  return (
    <table className="w-full border-collapse text-left">
      <caption className="sr-only">
        Every project, with the year it was completed and the stack it was built with.
      </caption>
      <thead>
        <tr className="border-b border-line">
          <th scope="col" className={`${HEAD} pb-3 font-normal`}>
            Project
          </th>
          <th scope="col" className={`${HEAD} w-14 pb-3 font-normal`}>
            Year
          </th>
          <th scope="col" className={`${HEAD} w-[42%] pb-3 font-normal sm:w-[45%]`}>
            Tech stack
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
                to={`#entry-${project.slug}`}
                className="inline-flex min-h-11 items-center text-xl font-medium tracking-tight text-foreground sm:text-2xl"
              >
                <span className="link-underline">{project.title}</span>
              </Link>
            </th>
            <td className="py-5 pr-4 font-mono text-xs text-muted-foreground tabular-nums">
              {project.year}
            </td>
            <td className="py-5">
              {/*
                Joined with a middot rather than rendered as a wrapped list of
                chips. At this column width the chips ran together — "Spring
                Data JPA Thymeleaf PostgreSQL" reads as one very long technology —
                and a `::after` separator on each chip dangles at the end of
                every wrapped line. The old site's project row joined the stack
                the same way, and the rail card still does.
              */}
              <p className="font-mono text-xs leading-relaxed text-foreground-dim">
                {project.techStack.join(' · ')}
              </p>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
