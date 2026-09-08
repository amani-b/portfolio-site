import type { Project } from "./types";

const project: Project = {
  slug: "recipe-scanner",
  title: "Recipe Scanner",
  tagline: "A mobile web app that turns a photo of any recipe into clean, structured, cookable steps.",
  year: "2024",
  role: "Solo developer — product design, frontend, and OCR pipeline",
  techStack: ["React", "TypeScript", "Vite", "Tesseract.js", "IndexedDB", "PWA", "Tailwind CSS"],
  summary:
    "A PWA that lets users photograph a recipe — from a book, card, or screenshot — and get structured ingredients and steps back via on-device OCR. It works fully offline and stores the parsed recipes locally in IndexedDB.",
  caseStudy: `## Problem

My family's recipes live on paper cards and in cookbooks. Typing them into a recipe app by hand is tedious enough that nobody did it, so the collection stayed locked on paper. I wanted a "point the camera and done" experience.

## Approach

I built a React PWA around an on-device OCR pipeline: the camera capture is preprocessed (grayscale, contrast boost, perspective crop) in a canvas, fed to Tesseract.js running in a Web Worker, then the raw text passes through heuristics that split it into ingredients versus steps. Parsed recipes persist in IndexedDB, so the app is fully usable offline after the first load.

## Key Decisions

- **On-device OCR instead of a cloud API** — privacy and offline use were core goals, and Tesseract.js in a Web Worker kept the main thread smooth. It also meant zero ongoing API costs.
- **A PWA, not a native app** — installability plus a single codebase. Camera and storage APIs covered everything the app needed.
- **Heuristic parsing over an ML model** — for v1, simple layout heuristics (line lengths, units regex, section keywords) parsed the majority of recipes correctly, and failures are cheap to fix by hand in the UI.

## Challenges

OCR accuracy on glossy cookbook paper was much worse than expected. The biggest wins came from image preprocessing rather than OCR tuning: adaptive thresholding and letting users drag a crop rectangle roughly doubled recognition quality on difficult pages.

## What I'd Do Differently

I underestimated sync. Once people had recipes on two devices, "how do I get them across?" became the top request, and bolt-on export/import was a band-aid. I'd design a sync story (even a simple file-based one) into the data layer from the start.
`,
  highlights: [
    "Works fully offline — on-device OCR via Tesseract.js in a Web Worker, zero API costs",
    "Image preprocessing (adaptive thresholding, user crop) roughly doubled OCR accuracy on glossy pages",
    "Shipped as an installable PWA with a single codebase across desktop and mobile",
  ],
  links: {
    liveDemo: "https://recipe-scanner.example.com",
    repo: "https://github.com/example-username/recipe-scanner",
  },
  images: ["/images/projects/recipe-scanner-1.png", "/images/projects/recipe-scanner-2.png"],
  featured: false,
};

export default project;
