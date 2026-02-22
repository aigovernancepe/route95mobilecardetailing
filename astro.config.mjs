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
          item.url.includes('/interior-car-detailing-fort-lauderdale/') ||
          item.url.includes('/lavado-de-autos-fort-lauderdale/') ||
          item.url.includes('/limpieza-de-tapiceria-fort-lauderdale/') ||
          item.url.includes('/servicios-de-detallado-fort-lauderdale/') ||
          item.url.includes('/detallado-interior-fort-lauderdale/')
        ) {
          item.priority = 0.9;
          item.changefreq = 'weekly';
        }
        // Pricing and FAQ pages — high priority
        else if (
          item.url.includes('/mobile-car-detailing-prices-fort-lauderdale/') ||
          item.url.includes('/precios-detallado-movil-fort-lauderdale/') ||
          item.url.includes('/faq/') ||
          item.url.includes('/preguntas-frecuentes/')
        ) {
          item.priority = 0.9;
          item.changefreq = 'weekly';
        }
        // Blog index pages
        else if (
          item.url.match(/\/blog\/$/) ||
          item.url.match(/\/es\/blog\/$/)
        ) {
          item.priority = 0.8;
          item.changefreq = 'weekly';
        }
        // Blog posts
        else if (item.url.includes('/blog/')) {
          item.priority = 0.6;
          item.changefreq = 'monthly';
        }
        // Service area pages — high priority
        else if (
          item.url.includes('/mobile-car-detailing-dania-beach/') ||
          item.url.includes('/mobile-car-detailing-hollywood-fl/') ||
          item.url.includes('/mobile-car-detailing-pompano-beach/') ||
          item.url.includes('/detallado-movil-dania-beach/') ||
          item.url.includes('/detallado-movil-hollywood-fl/') ||
          item.url.includes('/detallado-movil-pompano-beach/')
        ) {
          item.priority = 0.9;
          item.changefreq = 'weekly';
        }
        // Areas hub pages
        else if (
          item.url.match(/\/areas\/$/) ||
          item.url.match(/\/es\/areas\/$/)
        ) {
          item.priority = 0.7;
          item.changefreq = 'monthly';
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
  redirects: {
    '/chrome-polishing-fort-lauderdale/': '/car-wash-fort-lauderdale/',
    '/es/pulido-de-cromo-fort-lauderdale/': '/es/lavado-de-autos-fort-lauderdale/',
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
