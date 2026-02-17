import en from './en.json';
import es from './es.json';
import { slugMap, reverseSlugMap } from './slugs';

const translations = { en, es } as const;
export type Locale = 'en' | 'es';
export type TranslationKeys = typeof en;

/**
 * Get the translation object for a given locale.
 */
export function getTranslations(locale: string | undefined): TranslationKeys {
  return locale === 'es' ? es : en;
}

/**
 * Build a localized URL given a locale and an English slug.
 */
export function localizedUrl(locale: Locale, enSlug: string): string {
  const base = import.meta.env.BASE_URL;
  if (locale === 'en') {
    return enSlug === '' ? base : `${base}${enSlug}/`;
  }
  const esSlug = slugMap[enSlug] ?? enSlug;
  return esSlug === '' ? `${base}es/` : `${base}es/${esSlug}/`;
}

/**
 * Given the current page URL, return the URL for the alternate language.
 */
export function getAlternateUrl(url: URL, targetLocale: Locale): string {
  const base = import.meta.env.BASE_URL;
  const pathAfterBase = url.pathname.replace(base, '').replace(/^\//, '').replace(/\/$/, '');
  const isSpanish = pathAfterBase.startsWith('es/') || pathAfterBase === 'es';

  let currentEnSlug: string;

  if (isSpanish) {
    const esSlug = pathAfterBase.replace(/^es\/?/, '').replace(/\/$/, '');
    currentEnSlug = reverseSlugMap[esSlug] ?? esSlug;
  } else {
    currentEnSlug = pathAfterBase;
  }

  return localizedUrl(targetLocale, currentEnSlug);
}

/**
 * Get current locale from URL path.
 */
export function getLocaleFromUrl(url: URL): Locale {
  const base = import.meta.env.BASE_URL;
  const pathAfterBase = url.pathname.replace(base, '');
  return pathAfterBase.startsWith('es/') || pathAfterBase === 'es' ? 'es' : 'en';
}

/**
 * Build localized navigation link arrays for Header and Footer.
 */
export function getLocalizedNavLinks(locale: Locale) {
  const t = getTranslations(locale);
  const url = (enSlug: string) => localizedUrl(locale, enSlug);

  return {
    carWashServices: [
      { href: url('hand-wash-fort-lauderdale'), label: t.nav.handWash },
      { href: url('car-waxing-fort-lauderdale'), label: t.nav.carWaxing },
      { href: url('clay-bar-treatment-fort-lauderdale'), label: t.nav.clayBarTreatment },
      { href: url('wheel-cleaning-fort-lauderdale'), label: t.nav.wheelCleaning },
      { href: url('water-spot-removal-fort-lauderdale'), label: t.nav.waterSpotRemoval },
      { href: url('trim-restoration-fort-lauderdale'), label: t.nav.trimRestoration },
    ],
    upholsteryServices: [
      { href: url('seat-shampooing-fort-lauderdale'), label: t.nav.seatShampooing },
      { href: url('carpet-shampooing-fort-lauderdale'), label: t.nav.carpetShampooing },
      { href: url('leather-cleaning-fort-lauderdale'), label: t.nav.leatherCleaning },
      { href: url('leather-conditioning-fort-lauderdale'), label: t.nav.leatherConditioning },
      { href: url('steam-cleaning-fort-lauderdale'), label: t.nav.steamCleaning },
      { href: url('odor-removal-fort-lauderdale'), label: t.nav.odorRemoval },
    ],
    detailingServices: [
      { href: url('quick-wash-fort-lauderdale'), label: t.nav.quickWash },
      { href: url('fresh-start-fort-lauderdale'), label: t.nav.freshStart },
      { href: url('complete-clean-fort-lauderdale'), label: t.nav.completeClean },
      { href: url('premium-refresh-fort-lauderdale'), label: t.nav.premiumRefresh },
    ],
    mobileNavLinks: [
      { href: url(''), label: t.header.home },
      { href: url('car-wash-fort-lauderdale'), label: t.header.carWash },
      { href: url('upholstery-cleaning-fort-lauderdale'), label: t.header.upholsteryCleaning },
      { href: url('car-detailing-services-fort-lauderdale'), label: t.header.detailingServices },
      { href: url('mobile-car-detailing-prices-fort-lauderdale'), label: t.header.pricing },
      { href: url('faq'), label: t.header.faq },
      { href: url('blog'), label: t.blog.title },
      { href: url('about'), label: t.header.about },
      { href: url('contact'), label: t.header.contact },
    ],
    footerServiceLinks: [
      { href: url('hand-wash-fort-lauderdale'), label: t.nav.handWash },
      { href: url('car-waxing-fort-lauderdale'), label: t.nav.carWaxing },
      { href: url('leather-cleaning-fort-lauderdale'), label: t.nav.leatherCleaning },
      { href: url('seat-shampooing-fort-lauderdale'), label: t.nav.seatShampooing },
      { href: url('complete-clean-fort-lauderdale'), label: t.nav.completeClean },
      { href: url('odor-removal-fort-lauderdale'), label: t.nav.odorRemoval },
      { href: url('mobile-car-detailing-prices-fort-lauderdale'), label: t.nav.pricing },
      { href: url('faq'), label: t.nav.faq },
    ],
  };
}
