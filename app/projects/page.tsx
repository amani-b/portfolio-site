import { getAllProjects } from "@/lib/projects";
import ProjectCard from "@/components/ProjectCard";
import Reveal from "@/components/Reveal";

export const metadata = {
  title: "Index",
};

export default function ProjectsPage() {
  const projects = getAllProjects();

  return (
    <div className="mx-auto w-full max-w-6xl px-6">
      <section className="pb-step-4 pt-step-4 md:pb-step-5 md:pt-step-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">Index</p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-[-0.02em] sm:text-6xl">
          Everything I&rsquo;ve shipped, written down honestly.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
          Each entry records what it does, what it cost, and what I&rsquo;d do differently.
        </p>
      </section>

      <div className="border-b border-line pb-step-5">
        {projects.map((project, index) => (
          <Reveal key={project.slug} delay={Math.min(index * 70, 280)}>
            <ProjectCard project={project} index={index} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
