/**
 * Factual portfolio content — the single source of truth for the whole site.
 *
 * Every value here is transcribed from the previous Next.js portfolio, which
 * was the authoritative source for identity, contact details, education and
 * project facts. Nothing in this file is inferred or embellished: if it was not
 * in that project, it is not here.
 *
 * Deliberate omissions, both carried over from the old project:
 *   · No LinkedIn. It was removed from the old site on 2026-09-15; contact is
 *     email + GitHub only.
 *   · No résumé / CV. No such file was ever published, so no link is offered.
 */

export type SectionId = "home" | "background" | "work" | "about";

/** The nav is four section links. Detail pages are reached from Work, not from the nav. */
export type NavKey = SectionId;

export type NavItem = {
  id: NavKey;
  /** Shown in the desktop nav and read out as the bottom-nav link's name. */
  label: string;
  /**
   * Where the item actually goes. Section links carry `/#id` so the same nav
   * works from a detail page too — the router navigates home, then the shell
   * scrolls to the section the hash names.
   */
  href: string;
  /** The home-page section this item tracks while scrolling. */
  section: SectionId;
};

/**
 * Order matters: it is the reading order of the desktop nav, and the left-to-
 * right order of the phone's bottom pill.
 */
export const nav: NavItem[] = [
  { id: "home", label: "Home", href: "/#home", section: "home" },
  { id: "background", label: "Background", href: "/#background", section: "background" },
  { id: "work", label: "Work", href: "/#work", section: "work" },
  { id: "about", label: "About", href: "/#about", section: "about" },
];

export const profile = {
  name: "Amanuel Berhanu",

  /** The mono eyebrow above the headline, on every page of the old site. */
  eyebrow: "Amanuel Berhanu — 3rd-year computer science student",

  /** The old site's home headline, verbatim. */
  headline: "I build systems that survive contact with production.",

  /** The phrase inside `headline` that carries the drawn rule. */
  headlineRule: "survive contact",

  /** The old site's home intro line, verbatim. */
  intro: "End-to-end: data models, pipelines, and the interfaces on top of them — with honest write-ups of the decisions and trade-offs.",

  /*
   * Page metadata is NOT here. This is a static single-page app: the head is
   * written once in `index.html`, which is what the crawler actually receives.
   * Keeping a second copy in TypeScript would be dead data that silently drifts
   * out of sync with the real tags.
   */

  contact: {
    email: "amanuelberhanu.2052@gmail.com",
    github: { label: "github.com/amani-b", url: "https://github.com/amani-b" },
  },

  /** The old About page's metadata rail. */
  education: {
    studying: "BSc Computer Science, 3rd year",
    buildingWith: ["Java / Spring Boot", "TypeScript", "React / Next.js", "PostgreSQL"],
    lookingFor: "Backend or full-stack roles after graduation",
  },

  /** The old About page, verbatim. `link` marks the inline project link. */
  about: {
    heading: "Plainly, precisely, with the mistakes left in.",
    paragraphs: [
      "I’m a 3rd-year computer science student who builds the kind of software a team runs on rather than looks at. My biggest project so far is a cafe management platform running in production: role-based orders and inventory, a versioned database schema, and an agentic AI assistant that performs real actions in English and Amharic — behind permissions, confirmation steps, and full audit logging.",
      "I care about the parts of a system that decide whether it survives contact with production: data models, type safety from the database to the interface, and honest trade-offs. I version every schema change with Flyway because I once spent a weekend untangling rows written in server-local time; I designed the assistant to stream “what it’s doing” because autonomy without visibility isn’t trust. Each project’s case study records those decisions, and what I’d do differently next time.",
      "I write the way I build: plainly, precisely, and with the mistakes left in where they’re instructive.",
    ],
    /** Rendered as a link to the project section, replacing the old route link. */
    projectLinkText: "biggest project so far",
  },

  /** The old footer's contact blurb, verbatim. */
  contactBlurb:
    "The fastest way to reach me is email — I reply to everything. Happy to talk about internships, junior roles, or anything I’ve built.",

  /**
   * The old colophon. The framework name was changed from "Next.js" to
   * "Vite + React" because that is what this project actually builds with, and
   * the "built by hand" claim the old footer carried was removed outright: it
   * described how the code was produced, not what it is, and it was not true.
   * What is left is the only thing the footer should assert — the stack.
   */
  colophon: "built with Vite + React",
} as const;
