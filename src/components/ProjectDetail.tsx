import { ArrowLeft, ArrowRight, ExternalLink, Github } from 'lucide-react';
import { getAllProjects, type Project } from '../data/projects';
import { Link } from '../lib/router';
import Screenshots from './Screenshots';
import RichText from './RichText';

/**
 * One project's detail document — the full case study, open.
 *
 * This page *is* the study, so there is no disclosure: summary, sections,
 * and facts render in full. The home browser links here; the footer links to
 * the neighboring projects in registry order and back to Work.
 */
export default function ProjectDetail({ project }: { project: Project }) {
  const projects = getAllProjects();
  const position = projects.findIndex((entry) => entry.slug === project.slug);
  const prev = position > 0 ? projects[position - 1] : null;
  const next = position >= 0 && position < projects.length - 1 ? projects[position + 1] : null;

  return (
    <div className="pt-24 md:pt-32">
      <Link
        to="/#work"
        className="group -my-3.5 inline-flex items-center gap-2 py-3.5 font-mono text-xs tracking-[0.18em] text-foreground-dim uppercase transition-colors hover:text-foreground"
      >
        <ArrowLeft
          size={13}
          aria-hidden="true"
          className="transition-transform duration-200 group-hover:-translate-x-1"
        />
        <span className="link-underline">All work</span>
      </Link>

      <div className="rise mt-10">
        <div className="flex flex-wrap items-center gap-4">
          <span className="rounded-full border border-line px-3 py-1 font-mono text-xs text-muted-foreground">
            {project.badge}
          </span>
          <span className="ml-auto font-mono text-xs text-muted-foreground">{project.year}</span>
        </div>

        <h1 className="mt-6 max-w-3xl text-4xl leading-[1.08] font-medium tracking-tight text-foreground md:text-6xl">
          {project.title}
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed font-light text-muted-foreground md:text-xl">
          {project.tagline}
        </p>

        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm text-foreground-dim">
          {project.techStack.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap gap-3 font-mono text-sm">
          <a
            href={project.links.liveDemo}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-full border border-line-strong bg-wash px-5 py-3 transition-colors hover:bg-wash-strong"
          >
            Live demo
            <ExternalLink size={14} aria-hidden="true" />
          </a>
          <a
            href={project.links.repo}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-full border border-line px-5 py-3 text-foreground-dim transition-colors hover:border-line-strong hover:text-foreground"
          >
            Repository
            <Github size={14} aria-hidden="true" />
          </a>
        </div>
      </div>

      <Screenshots project={project} />

      <div className="mt-12">
        <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">{project.summary}</p>

        <div className="mt-12 space-y-12">
          {project.caseStudy.map((section) => (
            <section
              key={section.title}
              className={
                section.retrospective
                  ? 'border-l-2 border-accent pl-5 md:pl-6'
                  : 'border-t border-line pt-8'
              }
            >
              <h2
                className={`font-mono text-xs tracking-[0.18em] uppercase ${
                  section.retrospective ? 'text-accent' : 'text-muted-foreground'
                }`}
              >
                {section.title}
              </h2>
              <div className="mt-4 max-w-2xl space-y-5 leading-relaxed text-muted-foreground">
                {section.blocks.map((block, blockIndex) =>
                  block.kind === 'p' ? (
                    <p key={blockIndex}>
                      <RichText text={block.text} />
                    </p>
                  ) : (
                    <ul key={blockIndex} className="space-y-4">
                      {block.items.map((item) => (
                        <li key={item.lead ?? item.text} className="flex gap-2.5">
                          <span aria-hidden="true" className="text-accent">
                            —
                          </span>
                          <span>
                            {item.lead ? (
                              <>
                                <strong className="font-medium text-foreground">
                                  <RichText text={item.lead} />
                                </strong>{' '}
                                —{' '}
                              </>
                            ) : null}
                            <RichText text={item.text} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>

        <dl className="mt-12 grid gap-8 border-t border-line pt-8 sm:grid-cols-2">
          <div>
            <dt className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
              Role
            </dt>
            <dd className="mt-2 leading-relaxed">{project.role}</dd>
          </div>
          <div>
            <dt className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
              Key facts
            </dt>
            <dd>
              <ul className="mt-2 space-y-3 text-[15px] leading-relaxed text-muted-foreground">
                {project.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-2.5">
                    <span aria-hidden="true" className="text-accent">
                      —
                    </span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      </div>

      <nav
        aria-label="More projects"
        className="mt-16 grid gap-8 border-t border-line pt-8 sm:grid-cols-2"
      >
        <div>
          {prev ? (
            <Link to={`/projects/${prev.slug}`} className="group inline-flex flex-col gap-2 py-2">
              <span className="flex items-center gap-2 font-mono text-xs tracking-[0.18em] text-foreground-dim uppercase">
                <ArrowLeft
                  size={13}
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:-translate-x-1"
                />
                Previous
              </span>
              <span className="text-2xl font-medium tracking-tight text-foreground">
                <span className="link-underline">{prev.title}</span>
              </span>
            </Link>
          ) : null}
        </div>
        <div className="sm:text-right">
          {next ? (
            <Link to={`/projects/${next.slug}`} className="group inline-flex flex-col gap-2 py-2">
              <span className="flex items-center gap-2 font-mono text-xs tracking-[0.18em] text-foreground-dim uppercase sm:justify-end">
                Next
                <ArrowRight
                  size={13}
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </span>
              <span className="text-2xl font-medium tracking-tight text-foreground">
                <span className="link-underline">{next.title}</span>
              </span>
            </Link>
          ) : null}
        </div>
      </nav>
    </div>
  );
}
