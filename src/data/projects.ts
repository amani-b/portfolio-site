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

export type Project = {
  slug: string;
  title: string;
  /** One sentence, plain language: what the project does. */
  tagline: string;
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
  /** Paths relative to /public. Exactly the four the old registry displayed. */
  images: string[];
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
    images: [
      "/images/projects/cafeerp-1.png",
      "/images/projects/cafeerp-2.png",
      "/images/projects/cafeerp-3.png",
      "/images/projects/cafeerp-4.png",
    ],
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
