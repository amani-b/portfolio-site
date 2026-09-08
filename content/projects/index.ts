import type { Project } from "./types";
import deployDashboard from "./deploy-dashboard";
import recipeScanner from "./recipe-scanner";

/**
 * Registry of all projects.
 *
 * To add a project: create `content/projects/<slug>.ts` exporting a `Project`
 * whose `slug` matches the filename, then register it here.
 */
const projectRegistry: Project[] = [deployDashboard, recipeScanner];

export default projectRegistry;
export type { Project };
