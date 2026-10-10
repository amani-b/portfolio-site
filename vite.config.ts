import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { validateProjects } from './src/data/projects';

/*
 * Two plugins, no configuration. There is deliberately no `@/` path alias: it
 * was declared here and in tsconfig, and nothing ever imported through it, so
 * it was two files of configuration maintaining a convention the source did
 * not use. Relative imports are the convention.
 *
 * The project registry is validated here — at dev-server and build start —
 * rather than on the client. The data is bundled statically, so a malformed
 * entry fails `npm run dev` / `npm run build` with a named error instead of
 * shipping broken content or spending client bytes re-checking fixed data.
 */
validateProjects();

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
