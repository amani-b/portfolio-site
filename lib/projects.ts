import projectRegistry from "@/content/projects";
import type { Project } from "@/content/projects/types";

/**
 * Data layer for portfolio projects.
 *
 * Reads from the registry in `content/projects/index.ts`, which aggregates
 * one file per project. All loaders return new arrays/objects so callers
 * can't mutate the registry.
 */

/** All projects, sorted newest-first (descending by `year`). */
export function getAllProjects(): Project[] {
  return [...projectRegistry].sort((a, b) => b.year.localeCompare(a.year));
}

/** Projects marked `featured: true` — the top "flagship" section, same sorting as getAllProjects. */
export function getFeaturedProjects(): Project[] {
  return getAllProjects().filter((project) => project.featured);
}

/** A single project by its URL slug, or `undefined` if not found. */
export function getProjectBySlug(slug: string): Project | undefined {
  const project = projectRegistry.find((p) => p.slug === slug);
  return project ? { ...project } : undefined;
}

export type { Project };
