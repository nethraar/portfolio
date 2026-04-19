// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://nethraar.github.io',
  output: 'server',
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()]
  }
});