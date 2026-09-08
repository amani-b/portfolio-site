import { getAllProjects } from "@/lib/projects";
import ProjectCard from "@/components/ProjectCard";

export const metadata = {
  title: "Projects — Alex Carter",
};

export default function ProjectsPage() {
  const projects = getAllProjects();

  return (
    <div className="mx-auto w-full max-w-6xl px-6">
      <section className="grid grid-cols-1 gap-10 py-16 md:grid-cols-[14rem_1fr] md:py-20">
        <div aria-hidden="true" />
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Selected work</h1>
          <p className="mt-4 max-w-xl leading-relaxed text-ink-soft">
            Things I have designed, built, and shipped, with the decisions and trade-offs written down honestly.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 pb-20 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </div>
  );
}
