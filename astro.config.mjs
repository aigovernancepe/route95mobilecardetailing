// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://route95mobilecardetailing.com',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en-US',
          es: 'es-ES',
        },
      },
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      serialize(item) {
        // Homepage — highest priority
        if (item.url.match(/\.com\/$/) || item.url.match(/\.com\/es\/$/)) {
          item.priority = 1.0;
          item.changefreq = 'daily';
        }
        // Category pages
        else if (
          item.url.includes('/car-wash-fort-lauderdale/') ||
          item.url.includes('/upholstery-cleaning-fort-lauderdale/') ||
          item.url.includes('/car-detailing-services-fort-lauderdale/') ||
          item.url.includes('/lavado-de-autos-fort-lauderdale/') ||
          item.url.includes('/limpieza-de-tapiceria-fort-lauderdale/') ||
          item.url.includes('/servicios-de-detallado-fort-lauderdale/')
        ) {
          item.priority = 0.9;
          item.changefreq = 'weekly';
        }
        // About and Contact pages
        else if (
          item.url.includes('/about/') ||
          item.url.includes('/contact/') ||
          item.url.includes('/nosotros/') ||
          item.url.includes('/contacto/')
        ) {
          item.priority = 0.8;
          item.changefreq = 'monthly';
        }
        // All service pages keep default 0.7 / weekly
        return item;
      },
    }),
  ],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
