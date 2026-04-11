import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://taylankuscu6674-art.github.io',
  base: '/limonchelooa',
  integrations: [tailwind()],
});