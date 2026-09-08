import type { Project } from "./types";

const project: Project = {
  slug: "deploy-dashboard",
  title: "Deploy Dashboard",
  tagline: "A realtime dashboard that shows the health and history of every deployment across your services.",
  year: "2025",
  role: "Solo developer — architecture, frontend, and CI integration",
  techStack: ["Next.js", "TypeScript", "tRPC", "PostgreSQL", "Docker", "GitHub Actions", "Tailwind CSS"],
  summary:
    "A realtime internal dashboard that aggregates deploy events from CI pipelines into a single health view. Built with Next.js and tRPC over Postgres, it replaced a maze of Slack threads with one source of truth for release status.",
  caseStudy: `## Problem

Deployments for our eight services were tracked in scattered Slack threads and tribal knowledge. When something broke, the on-call engineer spent 10–15 minutes just figuring out *what* was recently deployed and *by whom* — before they could even start debugging.

## Approach

I designed and built a small event pipeline: GitHub Actions emits a webhook on every deploy, a Next.js route handler validates and persists it to Postgres, and the dashboard subscribes via server-sent events. The frontend is a single Next.js app with a tRPC layer, so types flow end-to-end from the database schema to the UI.

## Key Decisions

- **Server-sent events over WebSockets** — deploy events are one-directional and infrequent; SSE gave us realtime updates with far less infrastructure and easier proxying.
- **tRPC instead of REST** — the team is TypeScript-first, and eliminating a hand-maintained API client layer let me ship the first version in two weeks.
- **Append-only event table** — rather than mutating "current state", every deploy is an immutable event, which made the audit history free and debugging much easier.

## Challenges

The hardest part was normalizing webhook payloads: different repositories used different action versions, and some legacy pipelines sent incomplete metadata. I wrote a small schema-validation layer with sensible defaults and a dead-letter log for malformed events, which turned a crash class into a visible warning.

## What I'd Do Differently

I would add authentication from day one. The dashboard launched as internal-only, so I deferred auth, and retrofitting it touched every tRPC procedure. If I rebuilt it, the auth middleware would be part of the initial scaffold.
`,
  highlights: [
    "Cut on-call triage time by ~80% by replacing Slack archaeology with a single health view",
    "End-to-end type safety from Postgres schema to UI via tRPC and TypeScript",
    "First production version shipped in two weeks as a solo project",
  ],
  links: {
    repo: "https://github.com/example-username/deploy-dashboard",
    other: [
      {
        label: "Write-up: SSE vs WebSockets for deploy events",
        url: "https://example.com/blog/deploy-dashboard-sse",
      },
    ],
  },
  images: ["/images/projects/deploy-dashboard-1.png", "/images/projects/deploy-dashboard-2.png"],
  featured: true,
};

export default project;
