import { getAllProjects, getFeaturedProjects } from "@/lib/projects";
import ProjectCard from "@/components/ProjectCard";
import Reveal from "@/components/Reveal";
import TransitionLink from "@/components/TransitionLink";

export default function Home() {
  const flagship = getFeaturedProjects()[0];
  const rest = getAllProjects().filter((p) => p.slug !== flagship?.slug);

  return (
    <>
      {/* ————— Hero ————— */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-step-4 pt-step-4 md:pb-step-5 md:pt-step-6">
        <p className="rise font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
          Alex Carter — CS &rsquo;26
        </p>
        <h1 className="rise-2 mt-4 max-w-4xl font-display text-4xl font-semibold leading-[1.05] tracking-[-0.02em] sm:text-6xl md:text-7xl">
          I build systems that{" "}
          <span className="rule-sweep rule-drawn">survive contact</span> with production.
        </h1>
        <p className="rise-2 mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
          End-to-end: data models, pipelines, and the interfaces on top of them — with honest
          write-ups of the decisions and trade-offs.{" "}
          <TransitionLink href="/projects" className="font-medium text-ink">
            <span className="rule-draw">See the index</span>
          </TransitionLink>
          .
        </p>
      </section>

      {/* ————— Flagship ————— */}
      {flagship ? (
        <section className="border-y border-line bg-paper-raised">
          <div className="mx-auto w-full max-w-6xl px-6 py-step-4 md:py-step-5">
            <div className="flex items-baseline justify-between">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
                Featured — {flagship.title}
              </p>
              <p className="font-mono text-xs text-ink-soft">{flagship.year}</p>
            </div>

            <Reveal className="mt-6">
              <TransitionLink href={`/projects/${flagship.slug}`} className="group block">
                <div
                  aria-hidden="true"
                  className="overflow-hidden border border-line bg-paper-raised"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={flagship.images[0]}
                    alt={`${flagship.title} screenshot`}
                    className="aspect-video w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.015]"
                  />
                </div>
                <div className="mt-6 grid gap-6 md:grid-cols-[1fr_20rem] md:gap-10">
                  <div>
                    <h2 className="font-display text-3xl font-semibold tracking-tight transition-colors duration-200 group-hover:text-accent sm:text-5xl">
                      <span className="rule-draw">{flagship.title}</span>
                    </h2>
                    <p className="mt-3 max-w-xl text-lg leading-relaxed text-ink-soft">{flagship.tagline}</p>
                  </div>
                  <ul className="space-y-3 border-t border-line pt-4 text-[15px] leading-relaxed md:border-t-0 md:border-l md:pl-6 md:pt-0">
                    {flagship.highlights.slice(0, 3).map((highlight) => (
                      <li key={highlight} className="flex gap-3">
                        <span aria-hidden="true" className="mt-0.5 font-mono text-accent">
                          —
                        </span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="mt-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em]">
                  Read the case study
                  <span aria-hidden="true" className="text-accent transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </p>
              </TransitionLink>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* ————— Index ————— */}
      <section className="mx-auto w-full max-w-6xl px-6 py-step-4 md:py-step-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">01 — Work</h2>
          <p className="font-mono text-xs text-ink-soft">
            {rest.length + (flagship ? 1 : 0)} project{(rest.length + (flagship ? 1 : 0)) === 1 ? "" : "s"}
          </p>
        </div>
        <div className="mt-6 border-b border-line">
          {(flagship ? [flagship, ...rest] : rest).map((project, i) => (
            <Reveal key={project.slug} delay={Math.min(i * 70, 280)}>
              <ProjectCard project={project} index={i} />
            </Reveal>
          ))}
        </div>
        {rest.length + (flagship ? 1 : 0) === 0 ? (
          <p className="mt-6 border-b border-line pb-6 text-ink-soft">
            More case studies are in the notebook — check back soon.
          </p>
        ) : null}
      </section>
    </>
  );
}
