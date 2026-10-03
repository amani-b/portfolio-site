/**
 * Project content — transcribed verbatim from the previous portfolio's
 * `content/projects/cafeerp.ts`.
 *
 * There is exactly ONE project in the old project's registry. The two extra
 * entries that used to live in this app (NeuroSync, Lumina) were invented and
 * have been removed — nothing here is inferred or embellished.
 *
 * Case-study prose keeps the old site's light inline markup so the source stays
 * readable: `**bold**`, `*em*` and `` `code` ``. It is rendered as React nodes
 * by <RichText>, never through `dangerouslySetInnerHTML`.
 */

export type Block =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: { lead?: string; text: string }[] };

export type CaseStudySection = {
  title: string;
  /** The old site gave "What I'd Do Differently" its own tinted panel. */
  retrospective?: boolean;
  blocks: Block[];
};

/**
 * One screenshot. Everything the UI needs to render it is here, so adding a
 * project never means touching a component.
 */
export type ProjectImage = {
  /** Path relative to `/public`. See the asset convention in the README. */
  src: string;
  /**
   * What the image actually shows, in words. This is the plate's `alt` text and
   * the viewer's label, so it is content — "the Users page, a table of accounts
   * by role" tells a reader who cannot see it what they are missing, where
   * "CafeERP screenshot 4" tells them nothing.
   */
  alt: string;
  /**
   * Intrinsic pixel size, read from the file. Reserving the box from the real
   * dimensions is what stops the page reflowing as each screenshot arrives.
   */
  width: number;
  height: number;
};

export type Project = {
  slug: string;
  title: string;
  /** One sentence, plain language: what the project does. */
  tagline: string;
  /** The year it was completed — `"2026"` or a range like `"2025–2026"`. */
  year: string;
  /** The author's role building it. */
  role: string;
  /** Short factual descriptor shown in the entry's badge. Derived from the tagline. */
  badge: string;
  techStack: string[];
  /** Longer prose summary, kept for the case-study panel. */
  summary: string;
  highlights: string[];
  links: { liveDemo: string; repo: string };
  /**
   * Screenshots, in the order they should be shown. The first is also the
   * thumbnail on the rail card, so lead with the one that reads best small.
   */
  images: ProjectImage[];
  /**
   * Whether this project appears in the rail on the projects page. The field is
   * carried over from the old registry, where it drove the home page's flagship
   * panel; the rail is the same idea with room for more than one.
   *
   * Be honest about what it currently does: there is ONE project in this
   * registry, so `getSelectedProjects()` returns that one project and the
   * "selected" distinction cannot be observed. It is scaffolding, and it is
   * labelled as such rather than presented as a working filter.
   */
  featured: boolean;
  caseStudy: CaseStudySection[];
};

export const projects: Project[] = [
  {
    slug: "cafeerp",
    title: "CafeERP",
    tagline:
      "A Spring Boot cafe management platform — orders, inventory, settings, and a bilingual AI assistant, all in one deployable web app.",
    year: "2026",
    role: "Solo developer — full-stack design, backend, and deployment",
    badge: "Spring Boot platform",
    techStack: [
      "Java 21",
      "Spring Boot 3.3",
      "Spring Security",
      "Spring Data JPA",
      "Thymeleaf",
      "PostgreSQL",
      "Flyway",
      "Maven",
      "JavaScript",
    ],
    summary:
      "CafeERP is a role-based web application that runs a small cafe end to end: staff can take itemised orders while admins manage categories, menu items, and inventory. It adds an AI assistant that performs real actions (editing the menu, watching for low stock) in English and Amharic, with live voice support — deployed to production on Render.",
    highlights: [
      "Agentic assistant that performs real menu and inventory actions — behind permissions, confirmation, and full audit logging",
      "Native English + Amharic support with script detection and free Web Speech voice mode",
      "Per-item opt-in inventory tracking with atomic decrements, hard stock blocks, and low-stock alerts",
      "Flyway-versioned schema with Hibernate validation — deployed to production on Render",
    ],
    links: {
      liveDemo: "https://cafeerp-demo.onrender.com",
      repo: "https://github.com/amani-b/CafeERP",
    },
    /*
     * Ordered strongest-first, not 1..5: `images[0]` is the rail card's
     * thumbnail and it is cropped to the top of the frame, so the sign-in
     * screen — mostly empty cream — reads worst of the five at that size and
     * sits last. The assistant and its action log are adjacent because they are
     * one story: it acts, and the log proves it did.
     */
    images: [
      {
        src: "/images/projects/cafeerp-2.png",
        alt: "The CafeERP admin dashboard: a sidebar with Categories, Menu, Orders, Kitchen, Reports, Inventory and Users, next to an inventory status panel, a “browse & manage” menu card and quick actions.",
        width: 1894,
        height: 955,
      },
      {
        src: "/images/projects/cafeerp-3.png",
        alt: "The CafeERP AI Assistant open over the dashboard, showing an action awaiting approval: a createOrder tool payload for two chicken chilli pizzas, with Confirm and Cancel buttons.",
        width: 1891,
        height: 952,
      },
      {
        src: "/images/projects/cafeerp-5.png",
        alt: "The CafeERP AI Action Log: an audit table of every AI-initiated action, separate from chat history, listing when it ran, who initiated it, the tool and action, its parameters, the trigger, its status and its result.",
        width: 1894,
        height: 951,
      },
      {
        src: "/images/projects/cafeerp-4.png",
        alt: "The CafeERP Users page: a table of accounts by role (admin, staff, kitchen) with status, password status and Edit, Deactivate and Delete actions.",
        width: 1897,
        height: 949,
      },
      {
        src: "/images/projects/cafeerp-1.png",
        alt: "The CafeERP sign-in screen: a centred card with username and password fields over a cream background.",
        width: 1919,
        height: 933,
      },
    ],
    featured: true,
    caseStudy: [
      {
        title: "Problem",
        blocks: [
          {
            kind: "p",
            text: "A small cafe rarely needs heavyweight enterprise software, but spreadsheets and paper tickets don't scale. Staff needed a way to take itemised orders quickly, and the owner needed visibility into the menu and stock without a PhD in accounting software. The catch: the business operates bilingually (English and Amharic), and the owner isn't technical — so any tool had to be simple enough to drive without a manual, and ideally talk to like a person.",
          },
        ],
      },
      {
        title: "Approach",
        blocks: [
          {
            kind: "p",
            text: "I built a single Spring Boot application that covers the whole operation rather than bolting tools together. The domain is deliberately narrow — categories, menu items, orders, and inventory — so every screen earns its place. Authentication separates staff (view + create orders) from admins (full control of the menu and stock). Database schema is versioned with Flyway migrations, so every change is auditable and repeatable from local dev to production.",
          },
          {
            kind: "p",
            text: 'The differentiator is the assistant. Instead of a chatbot that just answers questions, CafeERP\'s assistant is *agentic*: it can call real tools — create and edit menu items, update prices and availability, adjust and reset low-stock alerts — behind permission checks and a confirmation step. It streams a live "what the AI is doing" trace into the chat so users always understand its actions. And because the cafe is bilingual, the assistant detects the language you\'re writing in and replies in English or Amharic, with Web Speech API voice for hands-free ordering.',
          },
        ],
      },
      {
        title: "Key Decisions",
        blocks: [
          {
            kind: "ul",
            items: [
              {
                lead: "Per-item opt-in inventory tracking",
                text: "early on I considered an always-on stock ledger. Instead, tracking is opt-in: untracked items ignore inventory logic entirely, while tracked items get atomic decrements on order creation and hard blocks when stock runs out. This keeps the feature useful without forcing every cafe to adopt it.",
              },
              {
                lead: "Flyway over `ddl-auto: update`",
                text: "I set Hibernate to `validate` so the schema can never drift in production. Every change is an explicit, versioned migration — a small discipline that has saved me more than once.",
              },
              {
                lead: "Confirmation policy for agentic actions",
                text: "the AI can do real things, but never quietly. Destructive or high-impact actions require an explicit confirm step, and every tool call is logged for audit, keeping autonomy safe behind guards.",
              },
              {
                lead: "Timezone contract",
                text: "timestamps are stored in UTC and rendered in the business's configured timezone via a single display service, centralising what is usually a scattered source of bugs.",
              },
              {
                lead: "Honest bilingual fallback",
                text: "native Amharic speech recognition isn't well supported in browsers, so I built a deterministic fallback layer that degrades gracefully instead of promising perfect Amharic voice that doesn't exist.",
              },
            ],
          },
        ],
      },
      {
        title: "Challenges",
        blocks: [
          {
            kind: "p",
            text: "The hardest part was making an *agentic* assistant feel trustworthy. Streaming tool traces, confirmation cards, and a regeneration flow that genuinely replaces the previous reply (server-side, not just visually) took several iteration cycles to get right. Handling Amharic end-to-end — script detection, an Ethiopic font fallback, and speech that supports both scripts — was its own battle, especially when the free Web Speech API only reliably understands one. I worked around it by detecting the user's language and scripting the response to match, with honest fallbacks when speech recognition isn't available.",
          },
          {
            kind: "p",
            text: "Production on Render's free tier also meant living with cold starts, so I designed the app to be resilient and observable rather than fast: a health endpoint, graceful fallbacks when AI providers are down, and fail-fast configuration so nothing silently misconfigures itself in prod.",
          },
        ],
      },
      {
        title: "What I'd Do Differently",
        retrospective: true,
        blocks: [
          {
            kind: "p",
            text: 'I\'d add payments and proper reporting earlier — the README is honest that this is "a basic ERP-style demo." In retrospect I\'d have designed the report aggregates and the payment ledger alongside the order model from day one instead of layering them on afterward. I\'d also have introduced the timezone contract from the very first migration rather than discovering inherited rows written in server-local time that now render shifted until a one-off data migration. Finally, I\'d prioritise a light automated end-to-end suite for the assistant chat flows from the start — they\'re the highest-risk surface and the hardest to regression-test by hand.',
          },
        ],
      },
    ],
  },
];

/**
 * Selectors. Carried over from the old project's `lib/projects.ts`, which
 * existed so that the home page, the projects page and the detail page could
 * not disagree about what the registry contains.
 *
 * Both return new arrays, so a caller cannot mutate the registry by accident.
 */

/** Every project, newest-first by completion year. */
export function getAllProjects(): Project[] {
  /*
   * `[...projects].sort()` rather than `projects.toSorted()`: tsconfig targets
   * ES2022, where `toSorted` does not exist, and widening `lib` for one call
   * would let ES2023-only methods into every file in the project. The spread is
   * what makes this safe — it sorts a copy, so the registry is never mutated.
   */
  // oxlint-disable-next-line unicorn/no-array-sort
  return [...projects].sort((a, b) => b.year.localeCompare(a.year));
}

/** The projects marked `featured` — what the rail on the projects page shows. */
export function getSelectedProjects(): Project[] {
  return getAllProjects().filter((project) => project.featured);
}
