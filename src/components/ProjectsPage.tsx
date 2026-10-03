import { getAllProjects, getSelectedProjects } from '../data/projects';
import { profile } from '../data/profile';
import ProjectRail from './ProjectRail';
import ProjectsTable from './ProjectsTable';
import { ProjectEntry } from './Projects';

/**
 * The projects index — `/projects`.
 *
 * This is the old site's `/projects` route, rebuilt for a client-rendered app:
 * the same masthead ("Index", and the same headline and standfirst, verbatim),
 * the same "every project in one place" job. What changed is the middle: the old
 * page listed projects as editorial rows, and a single flagship panel sat on the
 * home page. Here the selected projects get a horizontal rail and every project
 * gets a row in a table, so the two questions a reader actually arrives with —
 * "what is the good stuff" and "what did you build it with" — are each answered
 * by the thing best shaped for them.
 *
 * The full case studies follow, open. This page is the catalogue; making the
 * reader click five times to read five write-ups would be a strange thing for a
 * catalogue to do, and it is why the entries take a `defaultOpen` flag.
 */
export default function ProjectsPage() {
  const all = getAllProjects();
  const selected = getSelectedProjects();

  const HEADING =
    'font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase';
  const CONTAINER = 'mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-24';

  return (
    <div className="pt-16 md:pt-24">
      {/* ————— Masthead ————— */}
      <section className={CONTAINER}>
        <p className="rise font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          Index
        </p>
        <h1 className="rise mt-4 max-w-3xl text-4xl leading-[1.08] font-medium tracking-tight text-foreground md:text-6xl">
          {profile.indexHeading}
        </h1>
        <p className="rise mt-6 max-w-xl text-lg leading-relaxed font-light text-muted-foreground">
          {profile.indexIntro}
        </p>
      </section>

      {/* ————— Selected ————— */}
      <section className="mt-16 md:mt-20">
        <ProjectRail projects={selected} />
      </section>

      {/* ————— The table ————— */}
      <section aria-labelledby="all-projects-heading" className={`mt-16 md:mt-20 ${CONTAINER}`}>
        <h2 id="all-projects-heading" className={`${HEADING} border-b border-line pb-4`}>
          All projects
        </h2>
        <div className="mt-2">
          <ProjectsTable projects={all} />
        </div>
      </section>

      {/* ————— The case studies ————— */}
      <section aria-labelledby="case-studies-heading" className={`mt-16 md:mt-20 ${CONTAINER}`}>
        <h2 id="case-studies-heading" className={`${HEADING} border-b border-line pb-4`}>
          Case studies
        </h2>
        <div className="mt-12 flex flex-col gap-24">
          {all.map((project) => (
            <ProjectEntry key={project.slug} project={project} defaultOpen />
          ))}
        </div>
      </section>
    </div>
  );
}
