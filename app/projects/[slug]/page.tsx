import { notFound } from "next/navigation";
import { getAllProjects, getProjectBySlug } from "@/lib/projects";
import { renderCaseStudy } from "@/lib/case-study";
import TransitionLink from "@/components/TransitionLink";
import FigureStack from "@/components/FigureStack";

export function generateStaticParams() {
  return getAllProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return { title: "Project not found" };
  return { title: project.title, description: project.tagline };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const sections = renderCaseStudy(project.caseStudy);
  const all = getAllProjects();
  const nextProject = all[(all.findIndex((p) => p.slug === project.slug) + 1) % all.length];

  return (
    <div className="mx-auto w-full max-w-6xl px-6">
      <div className="pt-8">
        <TransitionLink
          href="/projects"
          className="font-mono text-xs uppercase tracking-[0.18em] text-ink-soft transition-colors duration-150 hover:text-accent"
        >
          ← Index
        </TransitionLink>
      </div>

      <article key={project.slug} className="page-enter pb-step-4">
        {/* ————— Masthead ————— */}
        <header className="mt-8 border-b border-line pb-8 md:mt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
            <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] sm:text-6xl">
              {project.title}
            </h1>
            <p className="font-mono text-sm text-ink-soft">{project.year}</p>
          </div>
          <p className="mt-4 max-w-2xl text-xl leading-relaxed text-ink-soft">{project.tagline}</p>
        </header>

        {/* ————— Body with metadata rail ————— */}
        <div className="mt-10 grid gap-10 md:grid-cols-[1fr_16rem] lg:gap-16">
          <div className="min-w-0">
            {project.images.length > 0 ? (
              <FigureStack slug={project.slug} images={project.images} title={project.title} />
            ) : null}

            <div className="mt-step-5 space-y-step-5">
              {sections.map((section) =>
                section.isRetrospective ? (
                  <section key={section.title} className="border-l-2 border-accent pl-6">
                    <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
                      {section.title}
                    </h2>
                    <div className="case-study mt-4 max-w-2xl" dangerouslySetInnerHTML={{ __html: section.html }} />
                  </section>
                ) : (
                  <section key={section.title} className="border-t border-line pt-8">
                    <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
                      {section.title}
                    </h2>
                    <div className="case-study mt-4 max-w-2xl" dangerouslySetInnerHTML={{ __html: section.html }} />
                  </section>
                ),
              )}
            </div>
          </div>


          {/* Metadata rail */}
          <aside className="order-first space-y-8 border-b border-line pb-8 md:order-last md:border-b-0 md:pt-1">
            <dl className="space-y-6 text-sm">
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">Role</dt>
                <dd className="mt-1.5 leading-relaxed">{project.role}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">Stack</dt>
                <dd>
                  <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[13px]">
                    {project.techStack.map((tech) => (
                      <li key={tech}>{tech}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>

            {project.links && (project.links.liveDemo || project.links.repo || (project.links.other?.length ?? 0) > 0) ? (
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">Links</p>
                <ul className="mt-2 space-y-1.5 text-sm font-medium">
                  {project.links.liveDemo ? (
                    <li>
                      <a href={project.links.liveDemo} className="text-accent">
                        <span className="rule-draw">Live demo ↗</span>
                      </a>
                    </li>
                  ) : null}
                  {project.links.repo ? (
                    <li>
                      <a href={project.links.repo} className="text-accent">
                        <span className="rule-draw">Repository ↗</span>
                      </a>
                    </li>
                  ) : null}
                  {project.links.other?.map((link) => (
                    <li key={link.url}>
                      <a href={link.url} className="text-accent">
                        <span className="rule-draw">{link.label} ↗</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {project.highlights.length > 0 ? (
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">Key facts</p>
                <ul className="mt-2 space-y-3 text-sm leading-relaxed">
                  {project.highlights.map((highlight) => (
                    <li key={highlight} className="flex gap-2.5">
                      <span aria-hidden="true" className="mt-0.5 font-mono text-accent">
                        —
                      </span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
      </article>

      {/* ————— Next project ————— */}
      <div className="border-t border-line py-step-4 md:py-step-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">Next</p>
        <TransitionLink
          href={`/projects/${nextProject.slug}`}
          className="group mt-2 inline-flex items-baseline gap-3 font-display text-2xl font-semibold tracking-tight transition-colors duration-200 hover:text-accent sm:text-4xl"
        >
          <span className="rule-draw">{nextProject.title}</span>
          <span aria-hidden="true" className="text-accent transition-transform duration-200 group-hover:translate-x-1">
            →
          </span>
        </TransitionLink>
      </div>
    </div>
  );
}
