# portfolio-architect

Portfolio of **Amanuel Berhanu** — a single-page React app built with Vite.

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
index.html               metadata, fonts, favicon
public/                  favicon + project screenshots
src/
  App.tsx                shell: nav, sections, footer
  index.css              design tokens, focus ring, motion + safe-area rules
  data/profile.ts        identity, contact, education, about copy
  data/projects.ts       project registry + case study
  components/            Hero, Background, Projects, Screenshots,
                         About, CopyEmailButton, BottomNav, RichText, Reveal
scripts/audit.cjs        headless verification sweep
vercel.json              framework + build/output overrides for Vercel
```

## Content

`src/data/profile.ts` and `src/data/projects.ts` are the single source of truth
for everything the page says. Every factual value in them — identity, contact
details, education, project metadata, case-study prose, image paths, outbound
links — is carried over from the previous portfolio, which was authoritative for
the facts. Nothing is inferred or embellished, and nothing was invented to fill
a layout.

Two omissions are deliberate and inherited:

- **No LinkedIn.** It was removed from the previous site on 2026-09-15. Contact
  is email + GitHub only.
- **No résumé / CV.** No such file was ever published.

Page metadata is *not* in the data layer. This is a static single-page app, so
the head is written once in `index.html` — that is what a crawler receives, and a
second copy in TypeScript would only drift.

To add a project, append an entry to the `projects` array in
`src/data/projects.ts`. Case-study prose uses a small inline subset of markdown
(`**bold**`, `*em*`, `` `code` ``) rendered as React nodes by `RichText` — never
through `dangerouslySetInnerHTML`.

## Design notes

- **Dark only.** Near-black `#0a0a0a`, one blue accent (`#3b82f6`) used for
  focus rings and the disclosure marker. `md` (768px) is the phone/desktop
  boundary: the desktop nav is `md:`-only, and below it navigation moves to a
  floating bottom pill.
- **No animation library.** All four animations are CSS in `src/index.css`
  (`.rise`, `.reveal`, the `grid-template-rows` disclosure, and a measured
  `transform` for the bottom-nav indicator). An animation library measured
  41 kB gzip — a third of the bundle — for exactly these, so it is not shipped.
  Every one is gated on `prefers-reduced-motion: no-preference`, so a
  reduced-motion visitor sees the finished state rather than a hidden one.
- **`cn` is `clsx`, not a merge.** `tailwind-merge` was removed after it
  measured 8.8 kB gzip for three call sites that never produce a conflicting
  class. Do not rely on `cn` resolving conflicts — write the classes so they
  don't conflict.

## Linting

`npm run lint` runs **Oxlint**, not ESLint. This is forced, not preferred:
`typescript-eslint` — and therefore all ESLint TypeScript support — declares a
peer range of `typescript >=4.8.4 <6.1.0`, and this project is on TypeScript 7.
Installing it would mean `--force`-ing a broken peer resolution. Oxlint parses
TypeScript itself and ships the `react`, `jsx-a11y` and `import` rule sets, so
the source is still actually linted rather than nominally.

The handful of rules disabled in `.oxlintrc.json` are each disabled for a
written reason — two of them (`unicorn/consistent-function-scoping` on
`scripts/`, `react/exhaustive-effect-dependencies` in `BottomNav`) are rules
whose suggested fix would break working code.

## Deployment

Vercel, through the Git integration on `main`. `vercel.json` is load-bearing:

```json
{ "framework": "vite", "buildCommand": "npm run build", "outputDirectory": "dist" }
```

The Vercel project was created against the previous Next.js implementation, so
its Framework Preset is still Next.js. Those three fields override Project
Settings on every deployment (they are documented to do exactly that), which is
what lets the existing project build a Vite app with nobody changing the preset
by hand.

There is deliberately no `og:image` and no canonical URL. Both require an
absolute production URL, the project is behind Vercel deployment protection, and
the repository's homepage field points at a `vercel.app` alias that now returns
`DEPLOYMENT_NOT_FOUND`. Guessing a domain would ship broken metadata; omitting
it ships none.

## `npm run audit`

Renders the site headlessly at six viewport widths and reports horizontal
overflow, sub-44px tap targets, missing accessible names, heading order,
duplicate ids, images without useful alt text, and any reveal that never
arrived — then writes screenshots to `screenshots/audit/`. It also drives the
case-study disclosure and the screenshot viewer, because "it renders" is not
"it works".

It drives a locally installed Chrome or Edge via `puppeteer-core` — no browser
download. Start the dev server first, or point it at any URL:

```bash
npm run dev
npm run audit                       # defaults to http://localhost:3000
node scripts/audit.cjs http://localhost:4173
```

The audit is not sufficient on its own — it has passed on a page whose bottom
half was invisible. Read the screenshots too.
