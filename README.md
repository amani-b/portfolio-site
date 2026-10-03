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
  data/projects.ts       project registry + case study + the two selectors
  components/            Hero, Background, Projects, ProjectsPage, ProjectRail,
                         ProjectsTable, Screenshots, About, CopyEmailButton,
                         ThemeToggle, BottomNav, RichText, Reveal
scripts/audit.cjs        headless verification sweep
vercel.json              framework + build/output overrides + the SPA rewrite
```

## Routes

There are two.

- **`/`** — the scrollytelling page it always was: hero, background, work, about.
- **`/projects`** — the index. This is the old site's `/projects` route, which the
  first version of this app did not have.

Both list every project, which is how the old site split its home page and its
`/projects` route. They are not copies of each other: the home page's work section
is the short form, with each case study behind a disclosure, and the index page is
the catalogue — a horizontal rail of the selected projects, a table of every
project with the year it was completed and the stack it was built with, then the
case studies, open.

Routing is `src/lib/router.tsx`: about sixty lines of `pushState` / `popstate` and
one `<Link>`. No router library was added, for the same reason no animation
library was — that is the whole surface it needs. `<Link>` renders a real `href`
and only intercepts a plain unmodified left-click on a *different* pathname, so
middle-click, "open in new tab", and anything that reads links all still work.

`/projects` needs one rewrite on the host so a direct hit serves the app shell:

```json
"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
```

Static files win over rewrites in Vercel's routing order, so `/assets/*` is
unaffected.

## Content

`src/data/profile.ts` and `src/data/projects.ts` are the single source of truth
for everything the site says. Every factual value in them — identity, contact
details, education, project metadata, case-study prose, image paths, outbound
links — is carried over from the previous portfolio, which was authoritative for
the facts. Nothing is inferred or embellished, and nothing was invented to fill a
layout.

Two omissions are deliberate and inherited:

- **No LinkedIn.** It was removed from the previous site on 2026-09-15. Contact
  is email + GitHub only.
- **No résumé / CV.** No such file was ever published.

Page metadata is *not* in the data layer. This is a static client-rendered app, so
the head is written once in `index.html` — that is what a crawler receives, and a
second copy in TypeScript would only drift. The one exception is `document.title`,
which the shell re-writes per route because the head cannot.

To add a project, append an entry to the `projects` array in
`src/data/projects.ts`. Case-study prose uses a small inline subset of markdown
(`**bold**`, `*em*`, `` `code` ``) rendered as React nodes by `RichText` — never
through `dangerouslySetInnerHTML`.

`featured: true` puts a project in the index page's rail. Be honest about what
that currently does: there is **one** project in the registry, so
`getSelectedProjects()` returns that one project, the rail is not scrollable, and
the rail's arrow controls (which appear only when there is somewhere to scroll)
are correctly absent. It is scaffolding, and it is labelled as such in the data
file rather than presented as a working filter.

## Design notes

- **Two themes, one token set.** Every colour is declared once in `:root` (light)
  and overridden in `:root.dark`, then exposed to Tailwind through `@theme inline`
  so the utilities compile to `var(--background)` rather than to a baked-in hex.
  The theme is a `light`/`dark` class on `<html>`, applied *before first paint* by
  a synchronous inline script in `index.html` (stored preference, else the system
  preference), with a `prefers-color-scheme` block in `index.css` as the no-JS
  fallback.

  There is deliberately **no `border-white/10` anywhere in the source**.
  Hairlines and washes are `color-mix(in srgb, var(--foreground) 12%, transparent)`
  — derived from the foreground, so they invert with the theme for free. A
  half-finished light mode (dark text on a light page, but white-10% borders that
  vanish) is not expressible.

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
  on arrival. It is a background gradient, not `text-decoration` — text-decoration
  cannot be animated in any browser that matters — and not a pseudo-element,
  because a background survives the text wrapping onto several lines.

- **No animation library.** Every animation is CSS in `src/index.css`: `.rise`,
  `.reveal`, the `grid-template-rows` disclosure, a measured `transform` for the
  bottom-nav indicator, the underline draw, and the rail's scroll. An animation
  library measured 41 kB gzip — a third of the bundle — for exactly these, so it
  is not shipped. Every one is gated on `prefers-reduced-motion: no-preference`,
  so a reduced-motion visitor sees the finished state rather than a hidden one.

- **`md` (768px) is the phone/desktop boundary.** The desktop nav is `md:`-only and
  below it navigation moves to the floating bottom pill. The pill now carries five
  destinations *and* the theme switch, which is the most that fits: six 44px
  controls plus gaps is wider than a 320px viewport and 44px is not negotiable, so
  the pill's padding and gaps tighten below 360px instead of the targets shrinking.
  The audit checks every viewport at 320px.

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

The Vercel project was created against the previous Next.js implementation, so its
Framework Preset is still Next.js. Those fields override Project Settings on every
deployment (they are documented to do exactly that), which is what lets the
existing project build a Vite app with nobody changing the preset by hand.

There is deliberately no `og:image` and no canonical URL. Both require an absolute
production URL, the project is behind Vercel deployment protection, and the
repository's homepage field points at a `vercel.app` alias that now returns
`DEPLOYMENT_NOT_FOUND`. Guessing a domain would ship broken metadata; omitting it
ships none.

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

It drives a locally installed Chrome or Edge via `puppeteer-core` — no browser
download. Start the dev server first, or point it at any URL:

```bash
npm run dev
npm run audit                        # defaults to http://localhost:3000
node scripts/audit.cjs http://localhost:4173   # or the production build
```

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

The audit is not sufficient on its own — it has passed on a page whose bottom half
was invisible. Read the screenshots too, starting with `light-*`, which are the
only ones that show the second theme.
