// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

const SITE = 'https://route95mobilecardetailing.com';
const PAGES_DIR = fileURLToPath(new URL('./src/pages', import.meta.url));
const BLOG_DIR = fileURLToPath(new URL('./src/content/blog', import.meta.url));

/**
 * Real modification dates for the sitemap, keyed by absolute URL.
 *
 * The sitemap used to stamp `lastmod: new Date()` on every URL, so each build
 * claimed all ~90 pages had just changed. A lastmod that is wrong on every URL
 * is worse than none: Google stops trusting the field for the whole sitemap.
 *
 * Instead we read the date each page already declares — `const dateModified`
 * in the page's own frontmatter script, which is the same value rendered in
 * the visible "Last updated" line and in the WebPage schema. Blog posts use
 * the `date` field of their content-collection frontmatter.
 *
 * Pages that declare no date get NO lastmod. That is deliberate — an absent
 * lastmod lets Google fall back to its own crawl signals, a fabricated one
 * poisons the field. Adding `dateModified` to a page automatically adds it
 * here too.
 */
function collectLastmod() {
  const dates = new Map();

  const walk = (dir, urlPrefix) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, `${urlPrefix}${entry.name}/`);
        continue;
      }
      if (!entry.name.endsWith('.astro') || entry.name.startsWith('[')) continue;

      const match = fs.readFileSync(full, 'utf8')
        .match(/const\s+dateModified\s*=\s*["'`](\d{4}-\d{2}-\d{2})["'`]/);
      if (!match) continue;

      const slug = entry.name.replace(/\.astro$/, '');
      const url = slug === 'index'
        ? `${SITE}${urlPrefix}`
        : `${SITE}${urlPrefix}${slug}/`;
      dates.set(url, match[1]);
    }
  };
  walk(PAGES_DIR, '/');

  // Blog posts are content-collection entries, not pages: src/content/blog/en/
  // renders to /blog/<slug>/ and es/ to /es/blog/<slug>/ (see blog/[slug].astro).
  for (const [locale, prefix] of [['en', '/blog/'], ['es', '/es/blog/']]) {
    const dir = path.join(BLOG_DIR, locale);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.md') && !file.endsWith('.mdx')) continue;
      const match = fs.readFileSync(path.join(dir, file), 'utf8')
        .match(/^date:\s*(\d{4}-\d{2}-\d{2})/m);
      if (!match) continue;
      dates.set(`${SITE}${prefix}${file.replace(/\.mdx?$/, '')}/`, match[1]);
    }
  }

  return dates;
}

const lastmodByUrl = collectLastmod();

// https://astro.build/config
export default defineConfig({
  site: 'https://route95mobilecardetailing.com',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      filter: (page) => !page.includes('/404/') && !page.endsWith('/404'),
      serialize(item) {
        // Real per-page modification date, or none at all — never a build stamp.
        const lastmod = lastmodByUrl.get(item.url);
        if (lastmod) {
          item.lastmod = lastmod;
        } else {
          delete item.lastmod;
        }

        // Homepage — highest priority
        if (item.url.match(/\.com\/$/) || item.url.match(/\.com\/es\/$/)) {
          item.priority = 1.0;
          item.changefreq = 'daily';
        }
        // Category pages
        else if (
          item.url.includes('/car-wash-fort-lauderdale/') ||
          item.url.includes('/interior-car-detailing-fort-lauderdale/') ||
          item.url.includes('/car-detailing-services-fort-lauderdale/') ||
          item.url.includes('/interior-car-detailing-fort-lauderdale/') ||
          item.url.includes('/lavado-de-autos-fort-lauderdale/') ||
          item.url.includes('/detallado-interior-fort-lauderdale/') ||
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
  vite: {
    plugins: [tailwindcss()]
  }
});
