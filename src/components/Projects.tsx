import { useState } from 'react';
import { ExternalLink, Github, Plus } from 'lucide-react';
import { projects, type Project } from '../data/projects';
import { profile } from '../data/profile';
import Screenshots from './Screenshots';
import RichText from './RichText';
import Reveal from './Reveal';

/**
 * The work section.
 *
 * The old portfolio's registry holds exactly one project, and its case study is
 * the most valuable thing on the site — the About copy explicitly points at it.
 * Rather than drop that prose or rebuild the old multi-page route, the entry
 * keeps this app's single-page composition and folds the case study into an
 * accessible disclosure: the entry stays scannable, and the full write-up is one
 * click away.
 */
export default function Projects({ id }: { id: string }) {
  return (
    <section id={id} className="border-t border-white/10 py-24 md:py-32">
      <div className="grid gap-12 md:grid-cols-[1fr_2fr] md:gap-24">
        <div>
          <h2 className="sticky top-32 font-mono text-sm tracking-widest text-muted-foreground uppercase">
            Selected Projects
          </h2>
        </div>

        <div className="flex flex-col gap-24">
          <p className="max-w-xl text-lg leading-relaxed font-light text-muted-foreground">
            {profile.indexIntro}
          </p>
          {projects.map((project) => (
            <ProjectEntry key={project.slug} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectEntry({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const panelId = `case-study-${project.slug}`;

  return (
    <Reveal>
      <div className="flex flex-wrap items-center gap-4">
        <span className="rounded-full border border-white/10 px-3 py-1 font-mono text-xs text-muted-foreground">
          {project.badge}
        </span>
        <span className="ml-auto font-mono text-xs text-muted-foreground">{project.year}</span>
      </div>

      {/*
        No arrow after the title. There used to be an `ArrowUpRight` here that
        nudged on `group-hover/entry` — an affordance for a navigation that does
        not exist, since the title is not a link and the entry's real controls
        are the two buttons below. On the old multi-page site the whole entry
        was a link to the case-study route; on this single-page version it is
        not, so the arrow was telling the reader something untrue.
      */}
      <h3 className="mt-6 text-3xl font-medium text-foreground md:text-4xl">{project.title}</h3>

      <p className="mt-4 max-w-2xl text-lg leading-relaxed font-light text-muted-foreground">
        {project.tagline}
      </p>

      <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm text-foreground/60">
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
          className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3 transition-colors hover:bg-white/10"
        >
          Live demo
          <ExternalLink size={14} aria-hidden="true" />
        </a>
        <a
          href={project.links.repo}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-foreground-dim transition-colors hover:border-white/25 hover:text-foreground"
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
        className="mt-10 flex w-full items-center justify-between gap-4 border-y border-white/10 py-4 font-mono text-xs tracking-[0.18em] uppercase transition-colors hover:bg-white/[0.04]"
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

              <dl className="mt-10 grid gap-8 border-t border-white/10 pt-8 sm:grid-cols-2">
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
                        : 'border-t border-white/10 pt-8'
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
  );
}
