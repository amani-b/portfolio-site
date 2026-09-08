/**
 * Shared shape for every portfolio project.
 *
 * `caseStudy` is a markdown string (renderable by any MDX/markdown renderer later),
 * structured with headings: Problem, Approach, Key Decisions, Challenges, What I'd Do Differently.
 */
export type ProjectLink = {
  label: string;
  url: string;
};

export type ProjectLinks = {
  liveDemo?: string;
  repo?: string;
  other?: ProjectLink[];
};

export type Project = {
  /** URL identifier — must match the filename (e.g. `my-project` for my-project.ts) */
  slug: string;
  title: string;
  /** One sentence, plain language: what the project does */
  tagline: string;
  /** e.g. "2024" or "2024–2025" */
  year: string;
  /** The author's role building it */
  role: string;
  techStack: string[];
  /** 2–3 sentences for the project grid card */
  summary: string;
  /** Longer markdown body: problem, approach, key decisions, challenges, what I'd do differently */
  caseStudy: string;
  /** 2–4 short, most impressive/differentiating facts */
  highlights: string[];
  links?: ProjectLinks;
  /** Paths to screenshots/mockups, relative to /public (e.g. "/images/projects/my-project-1.png") */
  images: string[];
  /** Whether this shows in the top "flagship" section */
  featured: boolean;
};
