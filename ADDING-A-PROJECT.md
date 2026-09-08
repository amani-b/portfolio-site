# Adding a new project

Adding a project requires **two steps** and no code changes anywhere else. The site reads every project from a single registry, so the home page grid, the projects page, and the detail page all update automatically.

## Step 1 — Create the project file

Create a new file in `content/projects/` named after the project's URL slug:

```
content/projects/my-new-project.ts
```

The filename becomes the URL: `my-new-project.ts` → `/projects/my-new-project`. Use lowercase with hyphens.

Start from this template (copy it into the file):

```ts
import type { Project } from "./types";

const project: Project = {
  slug: "my-new-project",
  title: "My New Project",
  tagline: "One sentence: what the project does.",
  year: "2026",
  role: "Solo developer — what you worked on",
  techStack: ["TypeScript", "React", "PostgreSQL"],
  summary:
    "Two or three sentences describing the project. This shows on the project cards.",
  caseStudy: `## Problem

What problem did it solve?

## Approach

How did you build it?

## Key Decisions

- **Decision** — why you made it.

## Challenges

What was hard, and how you got through it.

## What I'd Do Differently

Honest retrospective.`,
  highlights: [
    "Short impressive fact one (numbers help)",
    "Short impressive fact two",
    "Short impressive fact three",
  ],
  links: {
    liveDemo: "https://my-new-project.example.com",
    repo: "https://github.com/example-username/my-new-project",
  },
  images: ["/images/projects/my-new-project-1.png"],
  featured: false,
};

export default project;
```

### Field reference

| Field | Required? | Notes |
| --- | --- | --- |
| `slug` | Yes | Must match the filename. Lowercase, hyphens, no spaces. |
| `title` | Yes | Project name, shown everywhere. |
| `tagline` | Yes | One sentence. Shown on the detail page and featured panel. |
| `year` | Yes | `"2026"` or `"2025–2026"`. Projects are sorted newest-first by this. |
| `role` | Yes | Your role on the project. |
| `techStack` | Yes | List of technologies. Count is shown on cards; names listed in mono on the detail page. |
| `summary` | Yes | 2–3 sentences. Shown on project cards. |
| `caseStudy` | Yes | Markdown string (note the backticks, not quotes). Sections must use `## ` headings. Keep the five headings from the template. |
| `highlights` | Yes | 2–4 short facts. Shown prominently on the detail page and the home page featured panel. |
| `links` | Optional | Omit fields you don't have — the site hides anything missing (no empty gaps). |
| `images` | Optional* | Paths to screenshots in `/public` (see Step 2). Empty or missing images are handled gracefully, but cards look much better with at least one. |
| `featured` | Yes | `true` puts the project in the magenta "Featured project" panel on the home page. Only set `true` for your single strongest project — the other featured projects (if any) appear in the grid as usual. |

In the `caseStudy` markdown, you can use `**bold**`, lists, and `code` — they're styled automatically.

## Step 2 — Register it

Open `content/projects/index.ts` and add your project to the list:

```ts
import myNewProject from "./my-new-project";

const projectRegistry: Project[] = [deployDashboard, recipeScanner, myNewProject];
```

## Step 3 — Add images (optional but recommended)

Put screenshots in:

```
public/images/projects/
```

e.g. `public/images/projects/my-new-project-1.png`, then reference them in the file as `"/images/projects/my-new-project-1.png"`. The first image is used on cards and the featured panel; all of them appear as captioned figures on the detail page.

## Step 4 — Check it

```bash
npm run dev
```

Visit `http://localhost:3000` (home grid), `/projects`, and `/projects/my-new-project`. Then build to confirm everything compiles:

```bash
npm run build
```

If the build succeeds, commit and push — deployment picks it up automatically.

## Quick checklist

- [ ] `content/projects/<slug>.ts` created, `slug` matches filename
- [ ] Registered in `content/projects/index.ts`
- [ ] `featured: true` only on your single best project
- [ ] Screenshots dropped in `public/images/projects/` (if using)
- [ ] `npm run build` passes
