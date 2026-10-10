# portfolio-site

Portfolio of **Amanuel Berhanu** — a React app built with Vite: one home page
with a two-view work browser, plus one detail document per project.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on port 3000. |
| `npm run build` | Type-checks then builds to `dist/`. |
| `npm run preview` | Serves the built `dist/` on port 3000. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run lint` | Oxlint over the source. |
| `npm run audit` | Headless render + interaction audit (takes ~90 s per target). |

## Routes

Home (`/`) holds hero, background, work, about. Work is a browser with two
views behind one toggle: Featured shows one teaser at a time with steppers on
both sides; Index is a three-column table (Project, Tech stack, Year). Both
link to the project's detail document at `/projects/<slug>` — same tab —
where the full case study lives, open, with previous/next project links.

Routing is `src/lib/router.tsx`: `pushState`/`popstate`, one `<Link>` that
renders a real `href` and only intercepts plain left-clicks on a different
pathname, and a slug matcher. Dead URLs (bare `/projects`, unknown slugs)
redirect home silently without a history entry. Detail URLs need one rewrite
on the host so a direct hit serves the app shell (see `vercel.json`).

## Adding a project

Content lives in two files: `src/data/profile.ts` (identity, contact, about
copy) and `src/data/projects.ts` (the project registry). **Adding a project is
a data edit** — append one object to `projects`, drop its screenshots in
`public/images/projects/`. No component, route, style, or config changes: the
browser, the table, the detail document (reached automatically at
`/projects/<slug>`), and the viewer all read from the registry, and
`validateProjects()` fails the build on a malformed entry.

```ts
{
  slug: "my-project",          // becomes /projects/my-project
  title: "My Project",
  tagline: "One sentence, plain language: what it does.",
  year: "2026",                // "2026", or a range like "2025–2026"
  role: "What you did on it",
  badge: "Short descriptor",
  techStack: ["Java", "PostgreSQL"],
  summary: "A paragraph, shown at the top of the case study.",
  highlights: ["Key facts, one per bullet."],
  links: { liveDemo: "https://…", repo: "https://…" },
  images: [{ src: "/images/projects/my-project-1.png", alt: "What it shows.", width: 1894, height: 955 }],
  caseStudy: [{ title: "Problem", blocks: [{ kind: "p", text: "…" }] }],
}
```

Projects order newest-first by `year`. Name screenshots `<slug>-<n>.png`;
`images[0]` is the teaser thumbnail, so lead with the shot that reads best
small. `alt` is the plate's alt text and the viewer's visible label —
describe what is on screen. `width`/`height` are the file's real pixel
dimensions. Case-study blocks are `{ kind: "p", text }` or
`{ kind: "ul", items: [{ lead?, text }] }`; set `retrospective: true` on at most
one section per project for the accent rule. Prose supports `**bold**`, `*em*`,
`` `code` `` via `RichText` (never `dangerouslySetInnerHTML`).

Contact is email + GitHub. Page metadata lives in `index.html` (the head a
crawler receives); only `document.title` is rewritten per route.

## Design notes

- Two themes, one token set (`:root` / `:root.dark`, Tailwind `@theme inline`,
  `color-mix` hairlines). Pre-paint inline script in `index.html` applies the
  stored/system theme; CSS `prefers-color-scheme` covers no-JS.
- One accent device: `.link-underline` draws on hover/focus, `.underline-drawn`
  holds the headline rule at rest. No animation library — all motion is CSS in
  `src/index.css`, gated on `prefers-reduced-motion`. Card steps use a 0.22 s
  `.swap` settle; the stepper layout is pure grid areas (flanked on `sm`
  and up, stacked with a control row below on phones).
- `md` (768px) is the phone/desktop boundary: the top nav is `md:`-only, below
  it navigation lives in the floating bottom pill (four destinations + theme
  switch; audited at 320px).
- `cn` is `clsx`, not a merge — write classes so they don't conflict.

## Deployment

Vercel, Git integration on `main`. `vercel.json` overrides the framework preset
(build command, output directory, SPA rewrite) on every deploy.

There is deliberately no `og:image` and no canonical URL: both need a verified
absolute production domain, and none is verifiable from inside this repo.

## Verification

```bash
npm run dev                   # in one shell
npm run audit                 # in another (defaults to http://localhost:3000)
```

The audit renders home and the detail document at six widths (overflow, tap
targets, names, headings, alt, ids, reveals), drives the Featured/Index
toggle, the detail page, the viewer, routing (detail links, back link, silent
redirects, history), and the theme switch, and writes screenshots to
`screenshots/audit/`. Read the `light-*` shots too — they are the only ones
showing the second theme.

Scalability check: add a temporary `demo-test` project (copy an existing PNG
to `demo-test-1.png`, append the object), confirm the Featured stepper,
counter, Index row, auto `/projects/demo-test` detail page with prev/next,
and viewer all work with zero component edits — then delete the fixture.
