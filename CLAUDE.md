# Route95 Mobile Car Detailing — Website Context

## Business
- **Name:** Route95 Mobile Car Detailing LLC
- **Domain:** route95mobilecardetailing.com
- **Location:** Fort Lauderdale, Florida
- **Service Area:** Broward County — Fort Lauderdale, Pompano Beach, Coral Springs, Plantation, Davie, Hollywood, Deerfield Beach
- **Industry:** Auto services (mobile detailing)
- **Framework:** Astro
- **Languages:** English (root) + Spanish (`/es/` prefix)

## Structured Data Rules
- JSON-LD only (no Microdata/RDFa)
- **Schema @type: AutomotiveBusiness** (NOT AutoRepair — AutoRepair is for repair shops, this is a mobile detailing business)
- LocalBusiness with @type "AutomotiveBusiness" on homepage (EN + ES)
- Service schema on every service page
- FAQPage schema on any page with Q&A capsules (max 10 pairs, must match visible content)
- BreadcrumbList on every page except homepage
- Schema must match visible page content exactly

## SEO Content Rules

### Capsule Content Technique (mandatory)
Every H2 must be a real search query. The first 40-60 words directly answer it — no preamble, no hedging. Include one specific fact, number, or credential.

### Content Specs
- **Service pages:** 1,500-2,500 words, 5-8 Q&A capsules, Schema: Service + FAQPage + BreadcrumbList
- **City/area pages:** 1,000-1,800 words, 3-5 capsules with city-specific answers, ≥3 unique paragraphs per city
- **Meta title:** ≤60 chars, include primary keyword + city
- **Meta description:** ≤155 chars with CTA
- **H1:** One per page, "[Service] in [City] — Route95 Mobile Car Detailing"
- **Internal links:** ≥3 per page to related service/city pages
- **CTA:** Above the fold on every page

### Bilingual (EN/ES)
- Every EN page must have an ES counterpart under `/es/`
- Hreflang tags required on every page (en, es, x-default → EN)
- Sitemap must only include valid URLs per language (no cross-language slug mismatches)

## Compliance (Auto Services — Florida)
- FTC Act truth in advertising — no bait-and-switch
- All prices must be honored; conditions disclosed upfront
- "Starting at" pricing must reflect actual minimum
- Certification claims must be specific and verifiable (e.g., "IDA Certified" not "best detailers")
- Before/after photos must be actual work, no heavy digital enhancement
- "Eco-friendly" claims must be substantiated per FTC Green Guides
- No claims of "#1" or "cheapest" without verifiable data

## PR Workflow
- Create feature branches from `main`
- One PR per issue — push follow-up fixes to the same PR branch
- Do not modify deploy workflows or CI configuration
