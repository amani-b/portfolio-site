import { getAllProjects } from "@/lib/projects";
import ProjectCard from "@/components/ProjectCard";
import Reveal from "@/components/Reveal";

export const metadata = {
  title: "Index",
};

export default function ProjectsPage() {
  const projects = getAllProjects();

  return (
    <div className="mx-auto w-full max-w-6xl px-5 md:px-6">
      <section className="pt-step-4 pb-step-4 md:pt-step-6 md:pb-step-5">
        <p className="font-mono text-[11px] tracking-[0.18em] text-ink-soft uppercase">Index</p>
        <h1 className="balance-sm mt-4 max-w-3xl font-display text-[2.3rem] leading-[1.05] font-semibold tracking-[-0.02em] sm:text-6xl">
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
