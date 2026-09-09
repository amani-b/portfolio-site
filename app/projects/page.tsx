import { getAllProjects } from "@/lib/projects";
import ProjectCard from "@/components/ProjectCard";
import Reveal from "@/components/Reveal";

export const metadata = {
  title: "Projects — Alex Carter",
};

export default function ProjectsPage() {
  const projects = getAllProjects();

  return (
    <div className="mx-auto w-full max-w-6xl px-6">
      {/* Padding: rhythm lg/xl, matching the home hero and grid sections. Heading aligned to the
          same 14rem rail as home (DESIGN-V2 Finding E fix). */}
      <section className="grid grid-cols-1 gap-step-3 py-step-4 md:grid-cols-[14rem_1fr] md:py-step-5">
        <div aria-hidden="true" />
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Selected work</h1>
          <p className="mt-step-2 max-w-xl leading-relaxed text-ink-soft">
            Things I have designed, built, and shipped, with the decisions and trade-offs written down honestly.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 pb-step-5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, index) => (
          <Reveal key={project.slug} delay={Math.min(index * 60, 300)}>
            <ProjectCard project={project} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
