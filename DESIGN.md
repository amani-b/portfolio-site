# Design Plan — Portfolio Site

Identity: a developer/builder portfolio. Playful means confident color and structural wit, not illustration. Formal means precise, declarative copy. Every choice below is argued for this specific context.

## 1. Color

The palette borrows its logic from a code editor — a handful of distinct hues that each carry meaning — but renders it in flat, saturated fields on a cool light ground rather than a dark IDE pastiche. Playfulness comes from generous color blocking (section backgrounds, the flagship panel, selection highlights), not from decoration.

| Name | Hex | Role |
| --- | --- | --- |
| Graph Paper | `#F2F4F8` | Page background. Cool, faintly blue-grey — evokes grid paper, not the warm cream everyone ships. |
| Circuit Ink | `#23244E` | Text and headings. A deep indigo-navy, not near-black: visibly blue even at small sizes, so the page never reads as "default dark on light". |
| Ultramarine | `#3542E8` | Primary interactive color: links, buttons, active nav, focus rings. Loud on purpose. |
| Terminal Mint | `#0FA36B` | Secondary hue: tags for shipped/live work, section rules on detail pages, inline code highlights. |
| Highlighter Amber | `#FFB627` | Selection and marker color — selected text gets amber highlighter, the way you'd mark up a printed spec. Also the hover state on project cards. |
| Signal Magenta | `#D6336C` | The flagship accent, used only in the top featured section so it stays rare and load-bearing. |

Rules: at most three hues visible in any single viewport; Circuit Ink does the writing, the others do the pointing. Dark mode mirrors this with an ink-navy ground (`#171A33`) and the same hues brightened — the palette's logic (meaningful hues on a tinted ground) survives inversion, which a near-black + one-accent scheme does not.

Explicitly rejected: near-black + single accent (generic SaaS default), warm cream + terracotta (generic craft/portfolio default), Tailwind indigo `#6366F1` (the current template color of the web).

## 2. Type

Two families, both chosen for this context:

- **Display: Bricolage Grotesque.** A grotesque with visible personality — flared joints, optical-size variation, reads as "engineered but not corporate". Carries H1–H3 and the wordmark. It has character without tipping into display-serif preciousness or cartoonish rounded faces — exactly the playful-but-formal balance.
- **Body: IBM Plex Sans.** Chosen over Inter/Geist because Plex was designed for IBM's engineering culture — a developer-native workhorse with the same calm neutrality plus a subtle mechanical temperament that pairs naturally with Bricolage. Carries body copy, summaries, case-study markdown.
- **Mono: IBM Plex Mono**, used only for real code, the tech-stack list on detail pages, and link URLs — never as a decorative "terminal" gimmick. Restricting it to actual content keeps it meaningful.

Type scale (Bricolage at display sizes, Plex at body sizes; fluid via `clamp()`):

| Step | Size (desktop) | Use |
| --- | --- | --- |
| Display | 3.5rem / 56px, weight 700 | Home H1 |
| H1 | 2.5rem / 40px | Page titles |
| H2 | 1.75rem / 28px | Section titles, case-study headings |
| H3 | 1.25rem / 20px | Card titles |
| Body | 1.0625rem / 17px, 1.65 line height | Paragraphs, case-study body |
| Small | 0.875rem / 14px | Meta, nav, captions |

Sentence case everywhere — headings, nav, buttons. No letter-spacing games.

## 3. Layout concept

**Everything is left-aligned on a strong left margin, in an asymmetric two-column grid: a narrow fixed meta column on the left, wide content on the right.** Justification: portfolios are documents to scan and compare — a left rail anchors the eye at the same start line on every screen, mirrors how code is read (top-left down), and keeps date/role/tech metadata in a consistent position across every project page. Centered heroes put every page's opening in the same place and are the single most default layout on the web; left-rail asymmetry costs nothing and looks deliberate.

The left rail collapses to a top band on mobile.

### Home page

A short declarative intro, then the flagship project as a full-bleed color-blocked panel (Signal Magenta ground, inverted text), then the rest of the grid. No hero illustration; personality comes from the amber selection and the color-blocked flagship.

```
┌──────────────────────────────────────────────────────┐
│ wordmark                     projects, about (nav)   │
├──────────────┬───────────────────────────────────────┤
│              │  Hi, I'm <name>.                      │  ← Display, Bricolage
│              │  I build systems that ship.           │
│              │                                       │
│  (rail:      │  Two-sentence intro paragraph, Plex   │
│   empty on   │  Sans. One inline link, Ultramarine.  │
│   purpose)   │                                       │
├──────────────┴───────────────────────────────────────┤
│ ████████████ FLAGSHIP (magenta field) ████████████   │
│ █ Deploy Dashboard                                 █ │
│ █ one-line tagline, summary para                   █ │
│ █ [View the case study]  ← white button, square    █ │
│ █████████████████████████████████████████████████    │
│                                                      │
│ Selected work                              (H2)      │
│ ┌───────────────┐  ┌───────────────┐                 │
│ │ screenshot    │  │ screenshot    │                 │
│ │ title (H3)    │  │ title (H3)    │                 │
│ │ 2025 — 4 tech │  │ 2024 — 5 tech │                 │
│ │ 2-sentence    │  │ 2-sentence    │                 │
│ │ summary       │  │ summary       │                 │
│ └───────────────┘  └───────────────┘                 │
├──────────────────────────────────────────────────────┤
│ footer: email, github (plain links)                  │
└──────────────────────────────────────────────────────┘
```

### Project grid

Same grid, minus the hero. Cards are NOT identical rounded tiles with soft shadows: each card is a flat panel with a 2px Circuit Ink border, no border-radius, no shadow; hover shifts the background to Highlighter Amber and nudges the whole card 2px up-left like a selected file. Screenshots sit inside a thin ruled frame like figures in a spec.

```
┌──────────────┬───────────────────────────────────────┐
│  Projects    │  Selected work (H1) + 1 line of copy  │
├──────────────┴───────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│ │ fig frame    │ │ fig frame    │ │ fig frame    │  │
│ │──────────────│ │──────────────│ │──────────────│  │
│ │ Title        │ │ Title        │ │ Title        │  │
│ │ 2025 — 4 tech│ │ 2024 — 5 tech│ │ 2023 — 3 tech│  │
│ │ summary…     │ │ summary…     │ │ summary…     │  │
│ └──────────────┘ └──────────────┘ └──────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Project detail page

Structured like a well-written RFC: sticky left rail holds the facts (year, role, tech stack in Plex Mono, links); the wide column is the case-study markdown. Sections separate with full-width Terminal Mint rules; "What I'd do differently" gets its own tinted panel because retrospective honesty is the most differentiating content a student portfolio can have — it earns emphasis.

```
┌──────────────────────────────────────────────────────┐
│ All projects (plain link, no arrow glyph)            │
├──────────────┬───────────────────────────────────────┤
│ 2025         │  Deploy Dashboard                (H1) │
│ Solo dev     │  tagline as standfirst                │
│ ─────        │  ┌───────────────┐                    │
│ Stack:       │  │ screenshots   │                    │
│  Next.js     │  │ (fig frame)   │                    │
│  tRPC        │  └───────────────┘                    │
│  Postgres    │                                       │
│ ─────        │  Problem                              │
│ Live demo    │  body…                                │
│ Repo         │  ───────────────────────────── (mint) │
│              │  Approach                             │
│              │  body…                                │
│              │  … Key decisions / Challenges …       │
│              │  ┌ tinted panel ─────────────────┐    │
│              │  │ What I'd do differently       │    │
│              │  └───────────────────────────────┘    │
├──────────────┴───────────────────────────────────────┤
│ Next project: Recipe Scanner (plain link)            │
└──────────────────────────────────────────────────────┘
```

## 4. Principles

1. **The palette means something.** Every hue maps to a content type (interactive = ultramarine, shipped = mint, flagship = magenta, selection = amber), so color functions the way syntax highlighting does — it encodes structure. A template's accent color encodes nothing.
2. **Metadata is a first-class citizen, visually.** The persistent left rail treats year, role, and stack as structural content, the way a commit message or an RFC header does — a builder's mental model made visible.
3. **Figures and rules instead of decoration.** Screenshots sit in ruled frames like figures in a spec; sections divide with full-width rules, not gradients. The design borrows the authority of technical writing and lightens it with color — that is where the playfulness lives.
4. **The rarest material is honesty.** "What I'd do differently" gets a dedicated panel and the footer links are plain, because confident, precise writing — not chrome — is the site's actual flex.
5. **Flat and bordered, not soft and shadowed.** Hard edges and 2px borders reference printed spec sheets and terminal chrome simultaneously; the absence of the ubiquitous soft drop-shadow is itself a signal of intent.

## Self-review against the brief

| Choice | Developer-specific? | Verdict |
| --- | --- | --- |
| Palette (editor-logic hues on graph-paper ground) | Yes — color maps to content type like syntax highlighting; explicitly rejected cream+terracotta and near-black+accent | Kept |
| Bricolage Grotesque + IBM Plex Sans/Mono | Yes — Plex is engineering-heritage; rejected Inter/Geist as template defaults | Kept |
| Left-rail asymmetric layout | Yes — mirrors code reading and RFC structure; rejected centered hero as the most default layout on the web | Kept |
| RFC-shaped detail page, retro-honesty panel | Yes — celebrates "what I'd do differently", content real portfolios hide | Kept |
| All-caps tracked eyebrows above headings | No — banned; section titles are sentence-case Bricolage over a mint rule | Avoided |
| Numbered badges (01/02/03) | No — projects aren't a sequence; nothing in this design numbers anything | Avoided |
| Identical rounded cards + soft shadows | No — cards are square, bordered, flat, with a file-selection hover | Avoided |
| Arrows appended to links ("View →") | No — links are plain underlined text; the next-project link is a text sentence | Avoided |
| Middle-dot joined meta strings | Wireframes revised: card meta uses a single em-dash line ("2025 — 4 technologies") and the detail rail uses labeled rows — never dot-joined strings | Revised |

The plan is ready to implement. Next step on approval: set the palette and fonts as CSS custom properties in `app/globals.css` (next/font for Bricolage Grotesque, IBM Plex Sans, IBM Plex Mono), then build home, grid, and detail pages against the existing `Project` data layer.

