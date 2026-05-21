import { defineConfig } from 'astro/config';
import pagefind from 'astro-pagefind';

export default defineConfig({
  site: 'https://rbdurgin.github.io',
  base: '/blog',
  server: { host: true },
  integrations: [pagefind()],
});
