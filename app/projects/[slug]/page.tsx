import { notFound } from "next/navigation";
import { getAllProjects, getProjectBySlug } from "@/lib/projects";
import { renderCaseStudy } from "@/lib/case-study";
import TransitionLink from "@/components/TransitionLink";
import FigureStack from "@/components/FigureStack";
import ReadingProgress from "@/components/ReadingProgress";

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

  const links: { label: string; url: string }[] = [
    ...(project.links?.liveDemo ? [{ label: "Live demo", url: project.links.liveDemo }] : []),
    ...(project.links?.repo ? [{ label: "Repository", url: project.links.repo }] : []),
    ...(project.links?.other ?? []),
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-5 md:px-6">
      <ReadingProgress />

      <div className="pt-6 md:pt-8">
        <TransitionLink
          href="/projects"
          className="press -my-3.5 inline-block py-3.5 font-mono text-xs tracking-[0.18em] text-ink-soft uppercase transition-colors duration-150 hover:text-accent"
        >
          ← Index
        </TransitionLink>
      </div>

      <article key={project.slug} className="page-enter pb-step-4">
        {/* ————— Masthead ————— */}
        <header className="mt-6 border-b border-line pb-7 md:mt-10 md:pb-8">
          <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
            <h1 className="balance-sm font-display text-[2.3rem] font-semibold tracking-[-0.02em] sm:text-6xl">
              {project.title}
            </h1>
            <p className="font-mono text-sm text-ink-soft">{project.year}</p>
          </div>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft sm:text-xl">
            {project.tagline}
          </p>
        </header>

        {/*
          ————— Phone: the rail becomes two thumb-sized moves —————
          The metadata rail is genuinely useful and genuinely hostile to a
          phone: a wall of Role / Stack / Links / Key facts standing between
          the reader and the first screenshot. On a phone the two outbound
          links become full-width buttons at the bottom of the thumb arc, and
          everything else folds into a single ruled disclosure — the same
          content, one tap away instead of five scrolls deep.
        */}
        {links.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-3 md:hidden">
            {links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                className="press flex h-12 min-w-[8rem] flex-1 items-center justify-center gap-2 border border-line bg-paper-raised px-4 font-mono text-[11px] tracking-[0.18em] text-ink uppercase"
              >
                {link.label}
                <span aria-hidden="true" className="text-accent">
                  ↗
                </span>
              </a>
            ))}
          </div>
        ) : null}

        <details className="group mt-6 border-y border-line md:hidden">
          <summary className="flex items-center justify-between gap-4 py-3.5 font-mono text-[11px] tracking-[0.18em] text-ink-soft uppercase">
            <span className="min-w-0 truncate">Spec — role, stack, key facts</span>
            <span
              aria-hidden="true"
              className="spec-plus shrink-0 text-base leading-none text-accent"
            >
              +
            </span>
          </summary>
          <div className="space-y-6 pb-5">
            <dl className="space-y-5 text-sm">
              <div>
                <dt className="font-mono text-[11px] tracking-[0.18em] text-ink-soft uppercase">
                  Role
                </dt>
                <dd className="mt-1.5 leading-relaxed">{project.role}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] tracking-[0.18em] text-ink-soft uppercase">
                  Stack
                </dt>
                <dd>
                  <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[13px]">
                    {project.techStack.map((tech) => (
                      <li key={tech}>{tech}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>

            {project.highlights.length > 0 ? (
              <div>
                <p className="font-mono text-[11px] tracking-[0.18em] text-ink-soft uppercase">
                  Key facts
                </p>
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
          </div>
        </details>

        {/* ————— Body with metadata rail ————— */}
        <div className="mt-6 grid gap-10 md:mt-10 md:grid-cols-[1fr_16rem] lg:gap-16">
          <div className="min-w-0">
            {project.images.length > 0 ? (
              <FigureStack slug={project.slug} images={project.images} title={project.title} />
            ) : null}

            <div className="mt-step-5 space-y-step-5">
              {sections.map((section) =>
                section.isRetrospective ? (
                  <section key={section.title} className="border-l-2 border-accent pl-4 md:pl-6">
                    <h2 className="font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
                      {section.title}
                    </h2>
                    <div
                      className="case-study mt-4 max-w-2xl"
                      dangerouslySetInnerHTML={{ __html: section.html }}
                    />
                  </section>
                ) : (
                  <section key={section.title} className="border-t border-line pt-8">
                    <h2 className="font-mono text-[11px] tracking-[0.18em] text-ink-soft uppercase">
                      {section.title}
                    </h2>
                    <div
                      className="case-study mt-4 max-w-2xl"
                      dangerouslySetInnerHTML={{ __html: section.html }}
                    />
                  </section>
                ),
              )}
            </div>
          </div>

          {/* Metadata rail — desktop only; the phone gets the disclosure above. */}
          <aside className="hidden space-y-8 md:order-last md:block md:pt-1 md:pb-8">
            <dl className="space-y-6 text-sm">
              <div>
                <dt className="font-mono text-[11px] tracking-[0.18em] text-ink-soft uppercase">
                  Role
                </dt>
                <dd className="mt-1.5 leading-relaxed">{project.role}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] tracking-[0.18em] text-ink-soft uppercase">
                  Stack
                </dt>
                <dd>
                  <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[13px]">
                    {project.techStack.map((tech) => (
                      <li key={tech}>{tech}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>

            {project.links &&
            (project.links.liveDemo ||
              project.links.repo ||
              (project.links.other?.length ?? 0) > 0) ? (
              <div>
                <p className="font-mono text-[11px] tracking-[0.18em] text-ink-soft uppercase">
                  Links
                </p>
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
                <p className="font-mono text-[11px] tracking-[0.18em] text-ink-soft uppercase">
                  Key facts
                </p>
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
        <p className="font-mono text-[11px] tracking-[0.18em] text-ink-soft uppercase">Next</p>

        {/* Phone: a full-width card sitting where the thumb already is. */}
        <TransitionLink
          href={`/projects/${nextProject.slug}`}
          className="press group mt-3 flex items-center justify-between gap-4 border border-line bg-paper-raised px-5 py-4 md:hidden"
        >
          <span className="min-w-0 font-display text-xl font-semibold tracking-tight">
            {nextProject.title}
          </span>
          <span
            aria-hidden="true"
            className="shrink-0 font-mono text-lg text-accent transition-transform duration-200 group-active:translate-x-1"
          >
            →
          </span>
        </TransitionLink>

        {/* Desktop: unchanged. */}
        <TransitionLink
          href={`/projects/${nextProject.slug}`}
          className="group mt-2 hidden items-baseline gap-3 font-display text-4xl font-semibold tracking-tight transition-colors duration-200 hover:text-accent md:inline-flex"
        >
          <span className="rule-draw">{nextProject.title}</span>
          <span
            aria-hidden="true"
            className="text-accent transition-transform duration-200 group-hover:translate-x-1"
          >
            →
          </span>
        </TransitionLink>
      </div>
    </div>
  );
}
