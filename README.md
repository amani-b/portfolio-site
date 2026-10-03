# portfolio-architect

Portfolio of **Amanuel Berhanu** — a two-route React app built with Vite.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on port 3000 (localhost only). |
| `npm run dev:host` | Same, but bound to the network — for testing on a phone. |
| `npm run build` | Type-checks (`tsc --noEmit`) then builds to `dist/`. |
| `npm run preview` | Serves the built `dist/` on port 3000. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run lint` | Oxlint over the source — see the note below. |
| `npm run clean` | Removes `dist/`. |
| `npm run audit` | Headless render audit — see below. |

## Routes

Two.

- **`/`** — hero, background, work, about. The work section is the short form:
  every project, each case study behind a disclosure.
- **`/projects`** — the index. A horizontal rail of the selected projects, a table
  of every project with the year it was completed and the stack it was built
  with, then the case studies, open.

Both list every project, and they are not copies of each other — one is the
showcase, the other the catalogue.

Routing is `src/lib/router.tsx`: about sixty lines of `pushState` / `popstate`
and one `<Link>`. No router library, for the same reason there is no animation
library — that is the whole surface it needs. `<Link>` renders a real `href` and
only intercepts a plain unmodified left-click on a *different* pathname, so
middle-click, "open in new tab", and anything that reads links all still work.

`/projects` needs one rewrite on the host so a direct hit serves the app shell:

```json
"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
```

Static files win over rewrites in Vercel's routing order, so `/assets/*` is
unaffected.

## Layout

```
index.html               metadata, the pre-paint theme script, fonts, favicon
public/                  favicon + project screenshots
src/
  App.tsx                shell: nav, route switch, footer
  index.css              design tokens for both themes, focus ring, motion, rail
  lib/router.tsx         the two-route router — usePath / navigate / Link
  lib/utils.ts           cn — clsx, not a merge
  data/profile.ts        identity, contact, education, about copy, nav, index copy
  data/projects.ts       the project registry — see "Adding a project"
  components/            Hero, Background, Projects, ProjectsPage, ProjectRail,
                         ProjectsTable, Screenshots, About, CopyEmailButton,
                         ThemeToggle, BottomNav, RichText, Reveal
scripts/audit.cjs        headless verification sweep
vercel.json              framework + build/output overrides + the SPA rewrite
```

## Adding a project

Everything the site says lives in two files:

- `src/data/profile.ts` — identity, contact, education, about copy, the nav.
- `src/data/projects.ts` — the project registry.

**Adding a project is a data edit.** Append one object to the `projects` array
and add its screenshots. No component, route, style, or configuration changes:
the home page's work section, the index page's rail, the table, the case-study
panel, the screenshot gallery and the viewer all read from the registry.

```ts
{
  slug: "my-project",          // also the anchor id: #entry-my-project
  title: "My Project",
  tagline: "One sentence, plain language: what it does.",
  year: "2026",                // "2026", or a range like "2025–2026"
  role: "What you did on it",
  badge: "Short descriptor",   // the pill above the title
  techStack: ["Java", "PostgreSQL"],
  summary: "A paragraph, shown at the top of the case study.",
  highlights: ["Key facts, one per bullet."],
  links: { liveDemo: "https://…", repo: "https://…" },
  images: [ /* see below */ ],
  featured: true,              // puts it in the index page's rail
  caseStudy: [ /* see below */ ],
}
```

Projects are ordered newest-first by `year`, so the array itself does not need
sorting. `featured: true` is what the rail filters on.

### Screenshots

Each image carries its own description and intrinsic size, so the UI needs no
lookup table and the page never reflows as images arrive:

```ts
images: [
  {
    src: "/images/projects/my-project-1.png",
    alt: "What the screenshot shows, in words.",
    width: 1894,
    height: 955,
  },
]
```

- **Where the files go:** `public/images/projects/`, named `<slug>-<n>.png` —
  the slug of the project they belong to. One directory, one naming rule.
- **`alt` is required and is not a formality.** It is the plate's alt text and the
  viewer's label. Describe what is on screen; "screenshot 2" tells a reader who
  cannot see it nothing.
- **`width` / `height` are the file's real pixel dimensions.** They reserve the
  box so nothing shifts while the images load.
- **Order matters.** `images[0]` is also the rail card's thumbnail, cropped to
  the top of the frame, so lead with the shot that reads best small.

The convention is enforced, not just documented: a missing `alt`, `width` or
`height` is a type error, and the render audit fails on any image without usable
alt text.

### Case-study prose

`caseStudy` is a list of sections. A section is a `title` plus `blocks`; a block
is either `{ kind: "p", text }` or `{ kind: "ul", items: [{ lead?, text }] }`.
Set `retrospective: true` on a section to give it the accent rule — that is what
marks "What I'd Do Differently".

Prose supports a small inline subset of markdown — `**bold**`, `*em*`,
`` `code` `` — rendered as React nodes by `RichText`, never through
`dangerouslySetInnerHTML`.

### Facts

Every value in the data files is carried over from the portfolio that preceded
this one, which was authoritative for the facts. Nothing is inferred or
embellished, and nothing should be added to fill a layout. Two omissions are
deliberate: **no LinkedIn** (removed from the site on 2026-09-15) and **no
résumé** (no such file was ever published). Contact is email + GitHub.

Page metadata is *not* in the data layer. This is a client-rendered app, so the
head is written once in `index.html` — that is what a crawler receives, and a
second copy in TypeScript would only drift. The one exception is
`document.title`, which the shell rewrites per route because the head cannot.

## Design notes

- **Two themes, one token set.** Every colour is declared once in `:root` (light)
  and overridden in `:root.dark`, then exposed to Tailwind through `@theme inline`
  so the utilities compile to `var(--background)` rather than to a baked-in hex.
  The theme is a `light`/`dark` class on `<html>`, applied *before first paint* by
  a synchronous inline script in `index.html` (stored preference, else the system
  preference), with a `prefers-color-scheme` block in `index.css` as the no-JS
  fallback.

  There is deliberately **no `border-white/10` anywhere in the source**. Hairlines
  and washes are `color-mix(in srgb, var(--foreground) 12%, transparent)` —
  derived from the foreground, so they invert with the theme for free. A
  half-finished light mode (dark text on a light page, but white-10% borders that
  vanish) is not expressible. No **text** colour is a reduced-opacity value
  either: the two secondary steps, `--muted-foreground` and `--foreground-dim`,
  are real colours that were measured. The only translucent values are surfaces
  that have to be — the scrolled nav's backdrop (`bg-background/85`, which the
  blur needs) and the viewer's scrim (`bg-scrim/95`).

  The accent is the same blue in both themes but not the same value: `#3b82f6`
  measures 5.4:1 on the near-black background and only 3.5:1 on the light one, so
  light steps down to `#2563eb` (4.95:1). The audit measures all four contrast
  pairs in both themes and fails below 4.5:1.

  The screenshot viewer keeps its **own** palette (`--scrim`, `--scrim-ink`,
  `--scrim-line`), declared once and deliberately *not* theme-mapped: a screenshot
  should sit on the same surface in both themes, and mapping that chrome to the
  foreground tokens put light labels on a light backdrop in light mode.

- **The accent underline animates.** `.link-underline` draws a rule from 0 to full
  width on hover **and keyboard focus**; `.underline-drawn` holds it drawn for
  headline emphasis; `.underline-sweep` is `.underline-drawn` plus a one-shot sweep
  on arrival. It is a background gradient, not `text-decoration` — which cannot be
  animated in any browser that matters — and not a pseudo-element, because a
  background survives the text wrapping onto several lines.

- **No animation library.** Every animation is CSS in `src/index.css`: `.rise`,
  `.reveal`, the `grid-template-rows` disclosure, a measured `transform` for the
  bottom-nav indicator, the underline draw, and the rail's scroll. Every one is
  gated on `prefers-reduced-motion: no-preference`, so a reduced-motion visitor
  sees the finished state rather than a hidden one.

- **`md` (768px) is the phone/desktop boundary.** The desktop nav is `md:`-only and
  below it navigation moves to the floating bottom pill. The pill carries five
  destinations *and* the theme switch, which is the most that fits: six 44px
  controls plus gaps is wider than a 320px viewport and 44px is not negotiable, so
  the pill's padding and gaps tighten below 360px instead of the targets
  shrinking. The audit checks every viewport at 320px.

- **One type scale for the micro-labels.** Mono, uppercase, wide-tracked, muted —
  and all the same size, whether it is a table header, a rail counter or a
  section eyebrow.

- **`cn` is `clsx`, not a merge.** `tailwind-merge` was removed after it measured
  8.8 kB gzip for three call sites that never produce a conflicting class. Do not
  rely on `cn` resolving conflicts — write the classes so they don't conflict.

## Linting

`npm run lint` runs **Oxlint**, not ESLint. This is forced, not preferred:
`typescript-eslint` — and therefore all ESLint TypeScript support — declares a peer
range of `typescript >=4.8.4 <6.1.0`, and this project is on TypeScript 7.
Installing it would mean `--force`-ing a broken peer resolution. Oxlint parses
TypeScript itself and ships the `react`, `jsx-a11y` and `import` rule sets, so the
source is still actually linted rather than nominally.

The rules disabled in `.oxlintrc.json` — and the handful disabled inline in
`App.tsx`, `BottomNav.tsx`, `data/projects.ts` and `scripts/audit.cjs` — are each
disabled for a written reason. All of them are rules whose suggested fix would
break working code.

`tsconfig.json` sets `strict`. The source passes it without a single suppression.

## Deployment

Vercel, through the Git integration on `main`. `vercel.json` is load-bearing:

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

The Vercel project predates this implementation, so its Framework Preset may
still be whatever the previous stack was. Those fields override Project Settings
on every deployment (they are documented to do exactly that), which is what lets
the existing project build a Vite app without anyone changing the preset by hand.
A *successful* deployment is therefore also proof the override took effect.

There is deliberately no `og:image` and no canonical URL. Both require an absolute
production URL that is known to be correct, and none is verified from inside this
repository — guessing a domain would ship metadata pointing at nothing. Omitting
them ships none.

## `npm run audit`

Renders **both routes** at six viewport widths and reports horizontal overflow,
sub-44px tap targets, missing accessible names, heading order, duplicate ids,
images without useful alt text, and any reveal that never arrived — then writes
screenshots to `screenshots/audit/`, named `<route>-<viewport>.png`.

It also drives the interactive components and asserts on them, because "it
renders" is not "it works":

- the case-study disclosure (collapsed → open, `aria-expanded`, `inert`)
- the screenshot viewer (focus moves in, `#root` is really inert, Tab cannot
  escape, Escape restores focus)
- routing (the Index link, the table's link to a case study landing clear of the
  fixed nav, and the back button twice through the history stack)
- the theme switch (clicked, never written to directly — and both palettes
  measured for contrast, plus a reload to prove the pre-paint script reads the
  stored preference)
- the index page's table (three columns, every row headed by its subject, a
  caption) and its rail (labelled, and the arrows present only when it can scroll)
- every in-page `#anchor`, which must resolve to a real element

It drives a locally installed Chrome or Edge via `puppeteer-core` — no browser
download. Start the dev server first, or point it at any URL:

```bash
npm run dev
npm run audit                        # defaults to http://localhost:3000
node scripts/audit.cjs http://localhost:4173   # or the production build
```

A full run takes about 90 seconds per target, so give it more than the default
two-minute shell timeout.

Two things to know when extending it:

- The per-element overflow check **skips anything inside `[data-hscroll]`**. The
  projects rail is *supposed* to extend past the right edge; without the exemption
  it would be reported as broken on every run, and the check would end up ignored,
  which is how a check stops being one. Page-level overflow
  (`documentElement.scrollWidth`) is still checked and is unaffected, because an
  `overflow-x: auto` box clips.
- The theme must be driven **through the switch**. Writing the class on `<html>`
  from outside leaves React's copy of the state stale — the store only hears about
  changes made through `setTheme` — and the test then measures its own
  interference.

The audit is not sufficient on its own: it has passed on a page whose bottom half
was invisible. Read the screenshots too, starting with `light-*`, which are the
only ones that show the second theme.
