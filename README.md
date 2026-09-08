# Portfolio Site

Personal portfolio built with [Next.js](https://nextjs.org) (App Router), TypeScript, and Tailwind CSS.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

## Adding a new project

See [ADDING-A-PROJECT.md](./ADDING-A-PROJECT.md).

## Scripts

| Command                | Description                       |
| ---------------------- | --------------------------------- |
| `npm run dev`          | Start the dev server (Turbopack)  |
| `npm run build`        | Production build                  |
| `npm run start`        | Serve the production build        |
| `npm run lint`         | Run ESLint                        |
| `npm run format`       | Format all files with Prettier    |
| `npm run format:check` | Verify formatting without writing |

## Deployment

The site is fully static (every page is prerendered at build time) and deploys to Vercel with zero configuration:

1. Push the repository to GitHub.
2. In Vercel, "Add New Project" → import the repo.
3. Accept the defaults (framework preset: Next.js; build command `next build`). Deploy.

Set the production URL in two places once it's known: `metadataBase` in `app/layout.tsx`, and the real email/GitHub/LinkedIn links in `app/about/page.tsx` and `components/Footer.tsx`.

### Hosting elsewhere (static export)

If you're not using Vercel, the site can be exported to plain static files:

1. In `next.config.ts`, add `output: "export"` inside `nextConfig`.
2. Run `npm run build` — the site is emitted to `./out`.
3. Serve the `out` directory with any static host (the `next start` script is not needed).

Note: with static export the generated Open Graph image is still built as `/opengraph-image/index.png` inside `out`, so OG tags keep working.

## Folder Structure

- `/app` — routes (App Router: layouts, pages, metadata)
- `/components` — reusable UI components
- `/content` — project data (case studies, project metadata)
- `/lib` — utilities and helpers
- `/public` — static assets served from the site root
