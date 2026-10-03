import { useState } from 'react';
import { ArrowRight, ExternalLink, Github, Plus } from 'lucide-react';
import { getAllProjects, type Project } from '../data/projects';
import { profile } from '../data/profile';
import { Link } from '../lib/router';
import Screenshots from './Screenshots';
import RichText from './RichText';
import Reveal from './Reveal';

/**
 * The work section, on the home page.
 *
 * The old portfolio's registry holds exactly one project, and its case study is
 * the most valuable thing on the site — the About copy explicitly points at it.
 * Rather than drop that prose or rebuild the old multi-page route, the entry
 * keeps this app's single-page composition and folds the case study into an
 * accessible disclosure: the entry stays scannable, and the full write-up is one
 * click away.
 *
 * The full catalogue now also has its own page (`/projects`), so this section
 * carries a link to it. The two are not duplicates of each other: this is the
 * short form, that is the index — which is how the old site split its home page
 * and its `/projects` route.
 */
export default function Projects({ id }: { id: string }) {
  const projects = getAllProjects();

  return (
    <section id={id} className="border-t border-line py-24 md:py-32">
      <div className="grid gap-12 md:grid-cols-[1fr_2fr] md:gap-24">
        <div>
          <h2 className="sticky top-32 font-mono text-sm tracking-widest text-muted-foreground uppercase">
            Work
          </h2>
        </div>

        <div className="flex flex-col gap-24">
          <div className="max-w-xl">
            <p className="text-lg leading-relaxed font-light text-muted-foreground">
              {profile.indexIntro}
            </p>
            <Link
              to="/projects"
              /*
               * The hit area is grown with padding and then cancelled with a
               * negative margin, so the 24px gap above it is unchanged while the
               * control itself is 44px tall rather than the 16px of its text.
               */
              className="group mt-6 -my-3.5 inline-flex items-center gap-2 py-3.5 font-mono text-xs tracking-[0.18em] uppercase"
            >
              <span className="link-underline">See the full index</span>
              <ArrowRight
                size={13}
                aria-hidden="true"
                className="text-accent transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
          </div>

          {projects.map((project) => (
            <ProjectEntry key={project.slug} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * One project, with its case study behind a disclosure.
 *
 * Exported because the projects page renders the same entries — one component,
 * one source of prose, so the two pages cannot drift apart.
 *
 * `defaultOpen` is what makes the index page an index: on `/projects` the case
 * studies *are* the content, so they arrive open, and the table's links land on
 * a write-up rather than on a collapsed bar the reader then has to click.
 */
export function ProjectEntry({
  project,
  defaultOpen = false,
}: {
  project: Project;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `case-study-${project.slug}`;

  return (
    /*
     * The anchor target is this wrapper, deliberately OUTSIDE the reveal.
     *
     * A scroll entrance starts at `translate: 0 16px` and settles to 0. If the
     * id sat on the animating element, the browser would scroll to where the
     * element *currently* is — 16px low — and then the animation would lift it
     * out from under the fixed nav, landing the entry's badge row behind it.
     * On a plain wrapper the box never moves, so the target lands exactly where
     * `scroll-padding-top` says it should.
     */
    <div id={`entry-${project.slug}`}>
      <Reveal>
        <div className="flex flex-wrap items-center gap-4">
          <span className="rounded-full border border-line px-3 py-1 font-mono text-xs text-muted-foreground">
            {project.badge}
          </span>
          <span className="ml-auto font-mono text-xs text-muted-foreground">{project.year}</span>
        </div>

        {/*
          No arrow after the title. There used to be an `ArrowUpRight` here that
          nudged on `group-hover/entry` — an affordance for a navigation that does
          not exist, since the title is not a link and the entry's real controls
          are the two buttons below. On the old multi-page site the whole entry was
          a link to the case-study route; on this version it is not, so the arrow
          was telling the reader something untrue.
        */}
        <h3 className="mt-6 text-3xl font-medium text-foreground md:text-4xl">{project.title}</h3>

        <p className="mt-4 max-w-2xl text-lg leading-relaxed font-light text-muted-foreground">
          {project.tagline}
        </p>

        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm text-foreground-dim">
          {project.techStack.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>

        {/* The old entries linked to "#" — dead controls. These are the real URLs. */}
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

        <Screenshots project={project} />

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          /*
           * The bar already inherits `--color-foreground` from <html>, so the
           * `hover:text-foreground` that used to be here was a no-op: the label
           * was already that colour. A wash is the hover state that actually
           * shows on a full-width ruled bar.
           */
          className="mt-10 flex w-full items-center justify-between gap-4 border-y border-line py-4 font-mono text-xs tracking-[0.18em] uppercase transition-colors hover:bg-wash"
        >
          <span>{open ? 'Hide the case study' : 'Read the case study'}</span>
          <Plus size={16} aria-hidden="true" className="disclosure-icon shrink-0 text-accent" />
        </button>

        {/*
          Always mounted so `aria-controls` always resolves; the collapse is a
          `grid-template-rows: 0fr → 1fr` transition, so the panel expands to its
          natural height without measuring it in JavaScript. `inert` keeps the
          collapsed prose out of the tab order and the accessibility tree.
        */}
        <div id={panelId} className="disclosure" data-open={open} inert={!open}>
          <div>
            <div className="pt-8">
              <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
                {project.summary}
              </p>

              <dl className="mt-10 grid gap-8 border-t border-line pt-8 sm:grid-cols-2">
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
                    <h4
                      className={`font-mono text-xs tracking-[0.18em] uppercase ${
                        section.retrospective ? 'text-accent' : 'text-muted-foreground'
                      }`}
                    >
                      {section.title}
                    </h4>
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
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
