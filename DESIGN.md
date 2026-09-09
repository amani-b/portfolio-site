# DESIGN-V2 — Panel Review & Revised Direction

**Status: implemented and authoritative. This file is now the site's DESIGN.md — Phases 1, 2a, 2b, and 3 of §5 are shipped. The original DESIGN.md critique references remain below as the record of what changed and why.**
**Scope: critique of the current build (as implemented against DESIGN.md), then a revised design direction that keeps what works and adds the layer of physicality and craft the current build lacks.**

This document is written as the verdict of a review panel of senior product designers who examined the shipped build — `app/page.tsx`, `app/projects/page.tsx`, `app/projects/[slug]/page.tsx`, `components/{Header,Footer,ProjectCard}.tsx`, `app/globals.css` — against the stated intent in DESIGN.md. Section 1 is the critique (blunt, evidence-based). Section 2 is the direct answer to the left-rail question. Section 3 is the revised direction. Section 4 is the phased implementation plan, including **Phase 2: the tactile screenshot browser**. Nothing here is implemented until this document is approved.

---

## 1. The panel's findings

### 1.1 Where it feels like a competent template rather than something crafted

**Finding A — the uniform card grid is the template's fingerprint, squared.**
DESIGN.md's self-review proudly claims "identical rounded cards + soft shadows — Avoided." What shipped is identical *square* cards in `sm:grid-cols-2 lg:grid-cols-3` with a flat `gap-6`. The rounded corners and shadows were removed; the *rhythm* of the template — N equal boxes tiled in a grid — was kept. Removing the shadow is the cheapest possible way to look intentional. A panel member put it directly: *every mediocre portfolio on the internet is a 3-column grid of equal cards. Ours has the same silhouette with different corners.*

**Finding B — hover states are a color flip, and the "file-selection" metaphor was never built.**
DESIGN.md describes a "file-selection hover" on project cards. What ships (`components/ProjectCard.tsx:11`) is `hover:bg-amber` plus a 2-pixel translate. Nothing about the card reads as a *file* — no filename tab, no folder chrome, no selected-file state. The metaphor is in the docs but absent from the DOM, which is worse than no metaphor.

**Finding C — the design system is implemented from memory, not from the spec.**
Small drifts that individually look like noise and together reveal nobody measured against DESIGN.md:
- DESIGN.md specifies a 56px display size for the home H1; the build uses `text-5xl` = 48px (`app/page.tsx:15`). Display size was never tokenized, so it drifted.
- DESIGN.md says active nav is Ultramarine's job ("links, buttons, **active nav**, focus rings"). `components/Header.tsx` has no active state at all — no `aria-current`, no route-aware styling. The palette token exists; the feature reserved for it was never built.
- DESIGN.md specifies case-study titles as "Bricolage over a mint rule." `.case-study h3` (`app/globals.css:156`) gets no rule — just size/weight.

**Finding D — magenta-on-white body copy is at the edge of legibility.**
The flagship panel renders body copy and a bullet list in `text-white` on `bg-magenta` (`#D6336C`), roughly 4.6:1 contrast — barely AA for normal text, and it's the *first thing on the page*. The flagship moment is also the flagship risk.

**Finding E — vertical alignment breaks across pages.**
Home aligns section headings to the 14rem rail (`app/page.tsx:72`). `/projects` does not use the rail at all — its H1 and grid run to the container edge (`app/projects/page.tsx:12,24`). The detail page has a third scheme (sticky sidebar). A left margin that isn't consistent isn't a grid; it's a suggestion.

**Summary:** the build is *competent* the way a very good template is competent: nothing is broken, nothing is memorable. Craft is precisely the part that never got built.

### 1.2 Where the layout does information-display but has no depth, texture, or physicality

**Finding F — "flat and bordered" was executed as "no shadows" and nothing else.**
Principle 5 in DESIGN.md bans soft drop-shadows and calls the absence "a signal of intent." Executed halfway: it bans a depth system without installing a replacement. The result is a colorized wireframe — every element on one Z-plane, every element a bordered rectangle, and the Graph Paper background a *flat color* with no grid texture. Nothing overlaps, nothing stacks, nothing casts even a *hard* offset shadow (the one depth affordance that fits a flat, print-inspired system). The page has hierarchy but no *topology*; nothing occupies space.

**Finding G — the flagship panel is the one place built for physicality, and it wastes it.**
A full-bleed magenta slab is the strongest move on the site — spent on a flat rectangle with a static screenshot in a bordered frame. No layering (the screenshot could sit *on* the panel, breaking its top edge, casting a hard offset shadow), no scroll response, no tactility on the CTA. The most expensive real estate performs the least.

**Finding H — screenshots: the *product* of a portfolio is its least interactive element.**
On a developer's portfolio, screenshots are the closest thing to the work itself. Today they are `<img>` tags in bordered frames with a mono caption (`app/projects/[slug]/page.tsx:108-124`). No lightbox, no zoom, no pan, no keyboard navigation, no indication there is more than one. The data layer already gives each project 2–4 images (`content/projects/types.ts`), and the UI treats them as an undifferentiated stack. Biggest gap in the build; addressed as Phase 2 below.

**Finding I — the paper has no grain.**
Graph Paper is a color, not a texture. The one asset the palette's name invites — a faint, almost subliminal grid on the ground — was skipped, so the page reads as default-light-mode rather than as a deliberate material. Cheap to fix, high yield (§3.2).

### 1.3 Where motion is absent where it could create delight

Inventory of *all* motion in the current build:
1. `.hl-sweep` — amber highlighter sweep on the home H1 (0.7s, once, on load). Genuinely good. Keep.
2. `.fade-in` — intro paragraph fade. Fine.
3. `hover:bg-amber` + 2px translate on cards (150ms, default easing). Marginal.
4. Color-swap transitions on links/CTA. Marginal.
5. `prefers-reduced-motion` handling on (1) and (2) only.

That is the entire budget. What's missing:

- **Page-to-page transitions: zero.** The site's core loop — browse → open → next → next — hard-cuts between every route. For a site whose stated goal is now "deeply immersive," a hard flash between every page is the opposite of immersive.
- **No press feedback.** No `:active` state exists anywhere in the codebase. Nothing responds when pressed; users click, they don't operate.
- **No scroll-linked motion.** Detail pages are long-form documents — the one layout where scroll-positioned reveals or sticky progress genuinely aid comprehension — and they are fully static.
- **No entrance choreography.** The project grid renders all at once. A 60ms-per-card stagger is the difference between a list appearing and objects being *placed*.
- **No hover affordance on figure frames.** The element DESIGN.md compares to "a figure in a spec" has no affordance at all — including the click affordance Phase 2 will need it to invite.

**Panel consensus:** one good idea (the highlighter sweep), applied once, on one page. Everything else is a 150ms color transition. The site currently feels like a well-typeset PDF.


## 2. Is the left-rail RFC layout still the right call?

**Verdict: keep the rail as a *structure*, stop letting it define the *entire* visual system.**

The honest answer: the left rail is the right *information architecture* and the wrong *totality*. What it gets right — and why we keep it:
- It makes metadata structural (year / role / stack always visible on detail pages). Genuinely distinctive, genuinely developer-native.
- It gives every page the same reading line — real craft *when consistent* (Finding E shows it currently isn't; fix that).

What it gets wrong at the scale of "deeply immersive": a single rigid 14rem column applied to *every* section of *every* page produces a metronome — the same left-aligned block repeated top to bottom. RFCs are meant to be scanned flat; a portfolio meant to feel physical needs moments where the grid *breaks*. The flagship panel is already a full-bleed exception, and it's the best thing on the site *because* it is. The rail should be the site's **default**, not its **cage**:

- Keep the rail for: project grids, case-study body, detail-page metadata column.
- Allow deliberate full-bleed breakouts for: the flagship panel (exists today), figures/screenshots (Phase 2 uses this), and the "What I'd do differently" panel.
- Vary the rail's *density*: the home hero's rail is currently an empty `aria-hidden` spacer — a 14rem hole. It can hold a fixed vertical rule plus a compact "2026 — 3 projects" mono meta line so the gap is authored, not empty.

The RFC layout is not the problem. Applied with total uniformity and zero exceptions, it reads as flat. The fix is a defined set of *breakouts* that create rhythm, not abandonment.

---

## 3. What we keep (explicitly)

The panel is not proposing a redesign — it is proposing a depth layer on a system that is directionally right. Kept unchanged in spirit:

| Decision | Status |
| --- | --- |
| Content-type-mapped palette (ultramarine = interactive, mint = shipped, magenta = flagship, amber = selection) | **Keep — the site's best idea.** It encodes structure like syntax highlighting. V2 adds *materiality*, never a new accent. |
| Bricolage Grotesque / IBM Plex Sans / IBM Plex Mono | Keep. No type changes except tokenizing the Display size (fixing Finding C). |

---

## 4. Revised direction — "Physical Spec"

### 4.1 New Principle 5 (supersedes the old Principle 5)

> **5. Depth is physical, not atmospheric.** Where the old principle banned soft shadows, V2 builds depth from the same flat vocabulary: **hard offset shadows** (solid color, zero blur — a 4px Ink offset reads as a printed sheet on a desk, not as a SaaS card), **layering** (elements overlap and break each other's edges), **paper texture** (the Graph Paper ground gets its actual grid), and **state that moves** (everything pressable depresses; everything hoverable responds before the click). Depth comes from geometry and contrast, never from blur.

Three-token elevation system (new CSS custom properties, dark-mode variants included):

| Token | Light value | Dark value | Used on |
| --- | --- | --- | --- |
| `--shadow-rest` | `4px 4px 0 var(--ink)` | same, brightened | static stacked elements (figures, panels) |
| `--shadow-lift` | `6px 6px 0 var(--ultramarine)` | same | hover on cards / CTA |
| `--shadow-press` | `0 0 0` (element translates to meet it) | same | `:active` on anything interactive |

The tactile grammar is uniform site-wide: **hover = lift toward the viewer; press = collapse onto the surface.** A card at rest sits with a hard 4px ink offset shadow; on hover it translates `-2px -2px` and the shadow grows to 6px Ultramarine; on `:active` it translates `+2px +2px` and the shadow collapses to zero — the card is physically pushed *into* the page. This is DESIGN.md's "file selection" metaphor finally built properly, and it needs zero JavaScript.

### 4.2 Texture & depth pass (Phase 1)

- **Graph paper becomes graph paper.** A faint 24px grid on the page ground (two crossing 1px `linear-gradient` lines at ~4% opacity, `background-size: 24px 24px`), CSS-only, ~zero cost. The palette's name stops being a lie.
- **The flagship panel gets physicality.** The screenshot breaks the magenta slab's top edge and sits with a hard offset shadow, so the panel reads as a surface with an object *on* it. The white-on-magenta body copy moves onto a `bg-paper` inner panel in `--ink` (resolving Finding D) — the slab keeps its magenta energy, the text becomes fully legible.
- **Detail-page figures get layering.** Each frame gets the rest-shadow and a hover lift; the mono caption's `Figure N` index renders as a small tab overlapping the frame's top border. Figures behave like objects on a page, not rectangles in one.
- **The home hero's empty rail gets authored content** (vertical rule + "2026 — Selected work" mono meta line), so the indentation reads as intentional at every viewport.
- **Alignment consistency fix** (Finding E): `/projects` adopts the rail grid for its heading; cards align to the content column site-wide.

### 4.3 Tactile feedback pass (Phase 1, same phase)

- Project cards: rest → lift (shadow grows, turns Ultramarine) → press (collapse to `--shadow-press`), 120ms with `cubic-bezier(0.2, 0.9, 0.3, 1)` — fast and mechanical, not floaty. The amber background hover is kept but becomes a real *selected-file* state: a small amber filename tab (the project slug in Plex Mono) appears attached to the card's top edge on hover.
- Every button (flagship CTA first) gets the same lift/press grammar.
- Header nav gets the missing **active-route state**: Ultramarine + 2px underline rule + `aria-current="page"` (fixing Finding C directly).
- Scroll entrances: sections and grid cards get a one-shot 400ms rise-and-settle (`opacity 0→1`, `translateY 12px→0`, 60ms stagger per card) via a tiny `IntersectionObserver` hook. As with the existing `hl-sweep`, base styles are the *final* state, so `prefers-reduced-motion` renders the finished page with zero motion — we extend that pattern, never abandon it.
- **Dependency decision (flagged for review):** all of the above is CSS + one small hook — **zero new dependencies**. If Phase 2b's lightbox later needs spring physics, we would add `motion` (Framer Motion's React 19 package) *only for that component*. Panel recommendation: do not add it preemptively.

| "What I'd do differently" panel; the posture of retro-honesty | Keep — the site's actual flex. V2 protects it, never decorates it away. |
| Rejections: near-black + accent, cream + terracotta, Tailwind indigo, soft SaaS shadows, tracked-caps eyebrows, numbered badges, arrow-suffixed links | Keep every rejection. |
| RFC-shaped detail page, left rail as default reading structure, metadata as first-class content | Keep (with the breakouts in §2). |
| Amber text selection, 2px ink borders as structural grammar, the `hl-sweep` gesture | Keep. These are the existing seeds of physicality — V2 extends the same logic. |

One principle is formally revised: **Principle 5 ("Flat and bordered, not soft and shadowed") is superseded** by the new Principle 5 in §4.1. We are not adding soft shadows; we are adding *hard, flat, physical depth* — printed spec sheets, stacked index cards, paper on a desk — the same reference material the original design already claimed to borrow from.


### 4.4 Page-to-page transitions (Phase 2a)

- **Mechanism: the View Transitions API, as progressive enhancement.** Next.js 16 supports React's experimental `<ViewTransition>` with no new dependency. Chromium gets real shared-element transitions; other browsers get a 160ms crossfade (strictly better than today's hard cut). No polyfill.
- **The signature transition: card → case study.** Clicking a project card makes the card's screenshot the shared element — it visually *expands* into the hero figure on the detail page — while the amber highlight sweeps once across the detail H1 (reusing the existing `.hl-sweep` asset). The site already owns the metaphor; V2 makes it the site's *arrival gesture*, consistent on every page entry.
- **The "next project" link** gets a matching gesture (screenshot contracts out of the outgoing page, into the incoming one), so browse → open → next is continuous. Highest-impact immersive upgrade available, and it costs one wrapper component.

### 4.5 Phase 2b — the tactile screenshot browser (the centerpiece)

The panel's strongest shared opinion: **screenshots are the product.** Today they are inert. V2 turns each case study's figure stack into a genuinely tactile object:

- **The stack.** All 2–4 screenshots render at the hero position as a *fanned stack of index cards* — hard offset shadows, slight rotation offsets (−1.5°, 0°, +1.5°), each frame overlapping the previous by ~24px. It reads immediately as a pile of physical artifacts, not a vertical list. Wheel/drag/scroll on the stack cycles the top card to the back with an overshoot-and-settle so cards land with weight; the active index ("Figure 2 / 4") lives in the mono caption tab, which lifts with the frame.
- **Open into a lightbox.** Clicking (or `Enter` on) a figure opens a full-viewport lightbox via the same View Transition — the figure *is* the shared element, no duplicate flash. Inside: **drag to pan** (`grab`/`grabbing` cursor), **wheel/pinch/± to zoom** toward the cursor, `Esc` to close, arrow keys between figures, `0` to reset. Focus is trapped, background scroll is locked, focus returns to the originating figure on close.
- **The tactility is in the resistance.** Pan and zoom are critically damped (fast, no bounce); the stack cycles with slight overshoot; the hard border and hard offset shadow survive *inside* the lightbox — the browser belongs to the same material world, not a generic modal.
- **Constraint:** no third-party lightbox. Pan/zoom/stack is ~150 lines of React + CSS; the View Transition integration is worth owning rather than fighting a library's DOM. Keyboard and reduced-motion paths are first-class: with `prefers-reduced-motion`, the stack renders flat and cycles via crossfade; the lightbox works fully by keyboard with no smoothing.

### 4.6 What we are explicitly *not* doing

- No soft/blurred shadows, no glassmorphism, no gradient decoration (unchanged from DESIGN.md).
- No parallax on body copy or headings — parallax is reserved for *figure layers only*, where it describes physical stacking; text never moves relative to scroll for decoration.
- Texture, elevation, and transition systems ship with **both** dark and light themes from day one — no theme gets a degraded version.
- No new dependencies beyond the conditional `motion` package in §4.3, and only if Phase 2b actually needs it.

---

## 5. Implementation plan

| Phase | Deliverable | Acceptance criteria |
| --- | --- | --- |
| **1** | Elevation tokens + paper texture; flagship panel rebuild (contrast fix + layered screenshot); detail-figure layering + caption tabs; card lift/press grammar + file-tab hover; nav active state; alignment fix on `/projects`; scroll entrances with reduced-motion path | No interactive element without a press state; flagship body-copy contrast ≥ 4.5:1; `prefers-reduced-motion` renders every new feature fully-formed and static; zero new dependencies; lint/build clean |
| **2a** | View Transitions wrapper; card→detail shared-element (screenshot) transition; detail→next-project transition; amber-sweep arrival gesture on page entry | Route changes visually continuous in Chromium; graceful 160ms crossfade elsewhere; no layout shift; back/forward behave correctly |
| **2b** | Screenshot stack (fan + cycle + figure index); lightbox with pan/zoom/keyboard/Esc/focus-trap/scroll-lock | All acceptance criteria in §4.5 verified manually plus a keyboard-only pass; no third-party lightbox dependency |
| **3** | Polish: audit every interactive element against the lift/press grammar; perf budget check (no long-task regressions from the observer hook or View Transitions); promote DESIGN-V2.md to the authoritative DESIGN.md | `npm run lint` and `npm run build` clean; doc and code in agreement |

**Out of scope for all phases:** content changes, data-layer changes (`content/projects/types.ts` already supports everything Phase 2b needs — `images: string[]`), SEO/OG changes, and any restructuring of the RFC layout beyond the breakouts defined in §2.

---

*Prepared for review. On approval, Phase 1 begins with the elevation/texture tokens in `app/globals.css` and the flagship panel rebuild in `app/page.tsx`. ~~Nothing is implemented until this document is signed off.~~ — **All phases are now implemented; this document is the authoritative DESIGN.md.**

