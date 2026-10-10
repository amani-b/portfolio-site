import { useState } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, Github } from 'lucide-react';
import { getAllProjects, type Project } from '../data/projects';
import { Link } from '../lib/router';
import { cn } from '../lib/utils';
import ProjectsTable from './ProjectsTable';

type View = 'featured' | 'index';

/**
 * The work section, on the home page — the project browser.
 *
 * Two views, one registry. Featured shows one teaser at a time with steppers
 * on both sides; Index is a three-column table of every project. Both link to
 * the project's detail document — the full case study lives there exactly
 * once, never here.
 *
 * The choice is session state, defaulting to Featured. It is not persisted:
 * a stored preference for a two-option view is machinery without a reader
 * benefit, unlike the theme, which the operating system itself reports.
 */
export default function Projects({ id }: { id: string }) {
  const projects = getAllProjects();
  const [view, setView] = useState<View>('featured');
  const [index, setIndex] = useState(0);

  const current = projects[Math.min(index, Math.max(projects.length - 1, 0))];
  const traversable = projects.length > 1;

  return (
    <section id={id} className="border-t border-line py-24 md:py-32">
      <div className="grid gap-12 md:grid-cols-[1fr_2fr] md:gap-24">
        <div>
          <h2 className="sticky top-32 font-mono text-sm tracking-[0.18em] text-muted-foreground uppercase">
            Work
          </h2>
        </div>

        <div>
          <div
            role="group"
            aria-label="Work view"
            className="inline-flex rounded-full border border-line bg-surface p-1"
          >
            {(['featured', 'index'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={view === option}
                onClick={() => setView(option)}
                className={cn(
                  'min-h-11 shrink-0 cursor-pointer rounded-full px-5 font-mono text-xs tracking-[0.18em] uppercase transition-colors',
                  view === option
                    ? 'bg-wash-strong text-foreground'
                    : 'text-foreground-dim hover:text-foreground',
                )}
              >
                {option === 'featured' ? 'Featured' : 'Index'}
              </button>
            ))}
          </div>

          <div className="mt-12">
            {view === 'featured' && current ? (
              <div className="carousel-grid">
                <article key={current.slug} className="swap [grid-area:card]">
                  <TeaserCard project={current} />
                </article>
                {traversable ? (
                  <>
                    <StepButton
                      direction={-1}
                      label="Previous project"
                      disabled={index <= 0}
                      onStep={() => setIndex((value) => Math.max(value - 1, 0))}
                      className="[grid-area:prev] justify-self-start"
                    />
                    <p className="justify-self-center font-mono text-xs text-foreground-dim tabular-nums [grid-area:counter]">
                      <span className="sr-only">Showing project </span>
                      <span aria-live="polite">
                        {String(index + 1).padStart(2, '0')} /{' '}
                        {String(projects.length).padStart(2, '0')}
                      </span>
                    </p>
                    <StepButton
                      direction={1}
                      label="Next project"
                      disabled={index >= projects.length - 1}
                      onStep={() => setIndex((value) => Math.min(value + 1, projects.length - 1))}
                      className="[grid-area:next] justify-self-end"
                    />
                  </>
                ) : null}
              </div>
            ) : (
              <ProjectsTable projects={projects} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * One project, summarized: badge, title, tagline, the first three stack
 * items, one thumbnail, the two outbound links, and the way in — a same-tab
 * link to the detail document. No case-study prose here; it lives there.
 */
function TeaserCard({ project }: { project: Project }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <span className="rounded-full border border-line px-3 py-1 font-mono text-xs text-muted-foreground">
          {project.badge}
        </span>
        <span className="ml-auto font-mono text-xs text-muted-foreground">{project.year}</span>
      </div>

      <h3 className="mt-6 text-3xl font-medium text-foreground md:text-4xl">{project.title}</h3>

      <p className="mt-4 max-w-2xl text-lg leading-relaxed font-light text-muted-foreground">
        {project.tagline}
      </p>

      <p className="mt-6 font-mono text-sm text-foreground-dim">
        {project.techStack.slice(0, 3).join(' · ')}
      </p>

      {project.images[0] ? (
        <Link
          to={`/projects/${project.slug}`}
          className="group mt-8 block border border-line transition-colors hover:border-line-strong"
        >
          <img
            src={project.images[0].src}
            alt={project.images[0].alt}
            width={project.images[0].width}
            height={project.images[0].height}
            loading="lazy"
            decoding="async"
            className="aspect-[2/1] w-full object-cover object-top"
          />
        </Link>
      ) : null}

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

      <Link
        to={`/projects/${project.slug}`}
        className="group mt-6 -my-3.5 inline-flex items-center gap-2 py-3.5 font-mono text-xs tracking-[0.18em] uppercase"
      >
        <span className="link-underline">Read the case study</span>
        <ArrowRight
          size={13}
          aria-hidden="true"
          className="text-accent transition-transform duration-200 group-hover:translate-x-1"
        />
      </Link>
    </div>
  );
}

/** One carousel stepper: a 44px circle with a chevron, disabled at the ends. */
function StepButton({
  direction,
  label,
  disabled,
  onStep,
  className,
}: {
  direction: -1 | 1;
  label: string;
  disabled: boolean;
  onStep: () => void;
  className?: string;
}) {
  const Icon = direction === -1 ? ArrowLeft : ArrowRight;
  return (
    <button
      type="button"
      onClick={onStep}
      disabled={disabled}
      aria-label={label}
      className={`flex h-11 w-11 items-center justify-center rounded-full border border-line text-foreground-dim transition-colors hover:border-line-strong hover:text-foreground disabled:cursor-default disabled:opacity-40 ${className ?? ''}`}
    >
      <Icon size={16} aria-hidden="true" />
    </button>
  );
}
