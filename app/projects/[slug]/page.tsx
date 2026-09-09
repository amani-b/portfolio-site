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
  return { title: `${project.title} — Alex Carter`, description: project.tagline };
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
      <div className="pt-step-4">
        <TransitionLink href="/projects" className="text-sm text-ultramarine underline underline-offset-4 hover:no-underline">
          All projects
        </TransitionLink>
      </div>

      <div className="grid grid-cols-1 gap-step-3 pb-step-4 md:pb-step-5">
        <aside className="order-2 space-y-step-2 md:order-1 md:sticky md:top-8 md:self-start">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-medium text-ink-soft">Year</dt>
              <dd className="font-mono">{project.year}</dd>
            </div>
            <div>
              <dt className="font-medium text-ink-soft">Role</dt>
              <dd className="leading-relaxed">{project.role}</dd>
            </div>
            <div>
              <dt className="font-medium text-ink-soft">Stack</dt>
              <dd>
                <ul className="mt-1 space-y-0.5 font-mono">
                  {project.techStack.map((tech) => (
                    <li key={tech}>{tech}</li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
          {project.links && (project.links.liveDemo || project.links.repo || (project.links.other?.length ?? 0) > 0) ? (
            <div className="border-t-2 border-line pt-4">
              <p className="text-sm font-medium text-ink-soft">Links</p>
              <ul className="mt-2 space-y-2 text-sm">
                {project.links.liveDemo ? (
                  <li>
                    <a
                      href={project.links.liveDemo}
                      className="text-ultramarine underline underline-offset-4 hover:no-underline"
                    >
                      Live demo
                    </a>
                  </li>
                ) : null}
                {project.links.repo ? (
                  <li>
                    <a href={project.links.repo} className="text-ultramarine underline underline-offset-4 hover:no-underline">
                      Repository
                    </a>
                  </li>
                ) : null}
                {project.links.other?.map((link) => (
                  <li key={link.url}>
                    <a href={link.url} className="text-ultramarine underline underline-offset-4 hover:no-underline">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>

        <article key={project.slug} className="page-enter order-1 md:order-2">
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{project.title}</h1>
          <p className="mt-3 max-w-2xl text-xl leading-relaxed text-ink-soft">{project.tagline}</p>

          {project.highlights.length > 0 ? (
            <section className="mt-step-3 border-2 border-line bg-mint/10 p-6 sm:p-8">
              <h2 className="font-display text-lg font-bold tracking-tight">Key facts</h2>
              <ul className="mt-step-2 space-y-2.5 border-l-4 border-mint pl-4">
                {project.highlights.map((highlight) => (
                  <li key={highlight} className="text-[17px] font-medium leading-relaxed">
                    {highlight}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {project.images.length > 0 ? <FigureStack slug={project.slug} images={project.images} title={project.title} /> : null}

          <div className="mt-step-5 space-y-step-5">
            {sections.map((section, index) =>
              section.isRetrospective ? (
                <section key={section.title} className="border-2 border-line bg-mint/10 p-6 sm:p-8">
                  <h2 className="font-display text-xl font-bold tracking-tight">{section.title}</h2>
                  <div className="case-study mt-step-2 max-w-2xl" dangerouslySetInnerHTML={{ __html: section.html }} />
                </section>
              ) : (
                <section key={section.title} className={index > 0 ? "border-t-2 border-mint pt-step-5" : undefined}>
                  <h2 className="font-display text-2xl font-bold tracking-tight">{section.title}</h2>
                  <div className="case-study mt-step-2 max-w-2xl" dangerouslySetInnerHTML={{ __html: section.html }} />
                </section>
              ),
            )}
          </div>
        </article>
      </div>

      <div className="border-t-2 border-line py-step-4">
        <p className="text-ink-soft">
          Next project:{" "}
          <TransitionLink
            href={`/projects/${nextProject.slug}`}
            className="font-medium text-ultramarine underline underline-offset-4 hover:no-underline"
          >
            {nextProject.title}
          </TransitionLink>
        </p>
      </div>
    </div>
  );
}
