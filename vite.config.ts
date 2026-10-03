import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/*
 * Two plugins, no configuration. There is deliberately no `@/` path alias: it
 * was declared here and in tsconfig, and nothing ever imported through it, so
 * it was two files of configuration maintaining a convention the source did
 * not use. Relative imports are the convention.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
