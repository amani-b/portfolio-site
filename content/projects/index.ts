import type { Project } from "./types";
import cafeErp from "./cafeerp";

/**
 * Registry of all projects.
 *
 * To add a project: create `content/projects/<slug>.ts` exporting a `Project`
 * whose `slug` matches the filename, then register it here.
 */
const projectRegistry: Project[] = [cafeErp];

export default projectRegistry;
export type { Project };
