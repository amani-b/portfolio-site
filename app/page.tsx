import Link from "next/link";
import { getAllProjects, getFeaturedProjects } from "@/lib/projects";
import ProjectCard from "@/components/ProjectCard";

export default function Home() {
  const flagship = getFeaturedProjects()[0];
  const allProjects = getAllProjects();

  return (
    <>
      {/* Hero — leads with the flagship project's most distinctive result */}
      <section className="grid grid-cols-1 gap-8 py-16 md:grid-cols-[14rem_1fr] md:py-24">
        <div aria-hidden="true" />
        <div>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            I cut on-call deployment triage{" "}
            <mark className="hl-sweep text-ink">by 80%</mark> — by replacing Slack archaeology with a single
            dashboard.
          </h1>
          <p className="fade-in mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            I&rsquo;m Alex Carter, a developer who ships complete systems: data models, pipelines, and the interfaces on
            top of them. My work favors end-to-end type safety and tools that replace tribal knowledge with one source of
            truth. The{" "}
            <Link href="/projects" className="font-medium text-ultramarine underline underline-offset-4 hover:no-underline">
              case studies
            </Link>{" "}
            below cover what I built and what I&rsquo;d do differently.
          </p>
        </div>
      </section>

      {/* Flagship project — full-bleed Signal Magenta panel, larger treatment */}
      {flagship ? (
        <section className="w-full bg-magenta text-white">
          <div className="mx-auto w-full max-w-6xl px-6 py-14 sm:py-20 md:grid md:grid-cols-[14rem_1fr] md:gap-10">
            <div>
              <p className="text-sm font-semibold">Featured project</p>
              <p className="mt-1 font-mono text-sm text-white">
                {flagship.year} — {flagship.techStack.length} technologies
              </p>
            </div>
            <div className="max-w-3xl">
              <h2 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">{flagship.title}</h2>
              <p className="mt-3 text-xl leading-relaxed text-white">{flagship.tagline}</p>
              <p className="mt-5 leading-relaxed text-white">{flagship.summary}</p>
              <ul className="mt-6 space-y-2 border-l-2 border-white/50 pl-4 text-[15px] leading-relaxed">
                {flagship.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
              <div className="mt-8 border border-line/40 bg-paper/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={flagship.images[0]}
                  alt={`${flagship.title} screenshot`}
                  className="aspect-video w-full object-cover object-top"
                />
              </div>
              <Link
                href={`/projects/${flagship.slug}`}
                className="mt-8 inline-block border-2 border-white bg-white px-5 py-2.5 font-medium text-magenta transition-colors hover:bg-transparent hover:text-white"
              >
                View the case study
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* Full project grid — every project, linking to its detail page */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[14rem_1fr]">
          <div aria-hidden="true" />
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Selected work</h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {allProjects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </section>
    </>
  );
}

