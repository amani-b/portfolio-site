import { getAllProjects, getFeaturedProjects } from "@/lib/projects";
import ProjectCard from "@/components/ProjectCard";
import Reveal from "@/components/Reveal";
import TransitionLink from "@/components/TransitionLink";

export default function Home() {
  const flagship = getFeaturedProjects()[0];
  const allProjects = getAllProjects();

  return (
    <>
      {/* Hero — leads with the flagship project's most distinctive result. Tighter top padding than full sections: step-2/3. */}
      <section className="grid grid-cols-1 gap-step-3 pb-step-3 pt-step-2 md:grid-cols-[14rem_1fr] md:pb-step-4 md:pt-step-3">
        {/* The rail gap is authored, not empty (DESIGN-V2 §4.2): rule + compact meta line. */}
        <div className="hidden items-start gap-3 border-l-2 border-line pl-4 md:flex">
          <p className="font-mono text-sm leading-relaxed text-ink-soft">
            2026
            <br />
            Selected work
          </p>
        </div>
        <div>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            I cut on-call deployment triage{" "}
            <mark className="hl-sweep text-ink">by 80%</mark> — by replacing Slack archaeology with a single
            dashboard.
          </h1>
          <p className="fade-in mt-step-2 max-w-xl text-lg leading-relaxed text-ink-soft">
            I&rsquo;m Alex Carter, a developer who ships complete systems: data models, pipelines, and the interfaces on
            top of them. My work favors end-to-end type safety and tools that replace tribal knowledge with one source of
            truth. The{" "}
            <TransitionLink href="/projects" className="font-medium text-ultramarine underline underline-offset-4 hover:no-underline">
              case studies
            </TransitionLink>{" "}
            below cover what I built and what I&rsquo;d do differently.
          </p>
        </div>
      </section>

      {/* Flagship project — full-bleed Signal Magenta slab (DESIGN-V2 §4.2): the screenshot breaks the
          panel's top edge with a hard offset shadow, and all body copy sits on a paper panel in Circuit
          Ink so contrast no longer rides the AA line (Finding D fix). */}
      {flagship ? (
        <section className="w-full bg-magenta">
          <div className="mx-auto w-full max-w-6xl px-6 py-step-4 md:grid md:grid-cols-[14rem_1fr] md:gap-step-3 md:py-step-5">
            <div>
              <p className="text-sm font-semibold text-white">Featured project</p>
              <p className="mt-step-1 font-mono text-sm text-white">
                {flagship.year} — {flagship.techStack.length} technologies
              </p>
            </div>
            <div className="relative mt-step-3 max-w-3xl border-2 border-ink bg-paper p-6 pt-2 shadow-rest sm:p-8 sm:pt-2 md:mt-0">
              <div className="relative -mt-10 border-2 border-ink bg-paper p-2 shadow-lift">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={flagship.images[0]}
                  alt={`${flagship.title} screenshot`}
                  className="aspect-video w-full object-cover object-top"
                />
              </div>
              <h2 className="mt-step-3 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
                {flagship.title}
              </h2>
              <p className="mt-step-2 text-xl leading-relaxed text-ink-soft">{flagship.tagline}</p>
              <p className="mt-step-2 leading-relaxed text-ink">{flagship.summary}</p>
              <ul className="mt-step-2 space-y-2 border-l-4 border-magenta pl-4 text-[15px] leading-relaxed text-ink">
                {flagship.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
              <TransitionLink
                href={`/projects/${flagship.slug}`}
                className="mt-step-3 inline-block border-2 border-ink bg-paper px-5 py-2.5 font-medium text-ink shadow-rest transition-[transform,box-shadow,background-color,color] duration-150 ease-[cubic-bezier(0.2,0.9,0.3,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-ultramarine hover:text-white hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ultramarine active:translate-x-0.5 active:translate-y-0.5 active:shadow-press"
              >
                View the case study
              </TransitionLink>
            </div>
          </div>
        </section>
      ) : null}

      {/* Full project grid — every project, linking to its detail page. Padding: rhythm lg/xl. */}
      <section className="mx-auto w-full max-w-6xl px-6 py-step-4 md:py-step-5">
        <div className="grid grid-cols-1 gap-step-3 md:grid-cols-[14rem_1fr]">
          <div aria-hidden="true" />
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Selected work</h2>
        </div>
        <div className="mt-step-3 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {allProjects.map((project, index) => (
            <Reveal key={project.slug} delay={Math.min(index * 60, 300)}>
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}

