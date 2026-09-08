---
name: seo-audit
description: Audit a website's search engine optimization — meta tags, structured data, URL structure, sitemap/robots.txt, mobile-friendliness, and page speed as it relates to ranking. Use this whenever the user asks about SEO, search rankings, organic traffic, or "why isn't this showing up on Google", and always for e-commerce product/category pages before launch, since these pages depend heavily on search visibility for discovery.
---

# SEO Audit

## Purpose

Make sure pages are structured so search engines can crawl, understand, and rank them correctly — and that nothing in the implementation is accidentally hiding content from search or creating duplicate-content problems.

## When to Use This Skill

- Before launching new pages, especially product/category pages
- When asked to check or improve SEO, organic traffic, or search rankings
- When a page or product isn't appearing in search results as expected
- As part of `production-readiness` sign-off for public-facing pages

## Process

1. **Check crawlability first**: can search engines even reach and render the page? (robots.txt, sitemap, no accidental `noindex`, server-rendered or properly hydrated content)
2. **Check each page's uniqueness**: title, description, and content should be unique per product/category — duplicate or templated-with-no-variation content hurts ranking.
3. **Check structured data** so search engines can show rich results (price, availability, ratings) directly in search listings.
4. **Check technical fundamentals**: canonical tags, URL structure, mobile-friendliness, page speed.
5. **Cross-check with `performance-audit`** — Core Web Vitals are a ranking factor, not just a UX concern.

## Checklist

### Crawlability & Indexing
- [ ] `robots.txt` doesn't accidentally block important pages (check it isn't disallowing `/products/` or similar)
- [ ] `sitemap.xml` exists, is submitted to Search Console, and stays in sync with actual live pages (no dead links, no missing new products)
- [ ] No accidental `noindex` tags left on pages that should be indexed (common leftover from staging/dev config)
- [ ] Content is present in the initial server-rendered HTML or properly handled for client-side-rendered pages — don't assume a crawler executes JS the same way a browser does

### Meta Tags & Content
- [ ] Every page has a unique, descriptive `<title>` (not a generic template repeated site-wide)
- [ ] Every page has a unique meta description that accurately summarizes the page
- [ ] Product descriptions are original content, not copy-pasted manufacturer boilerplate duplicated across many other sites
- [ ] Heading hierarchy is logical (one `<h1>` per page, descriptive, not skipped/misordered)

### Structured Data (schema.org)
- [ ] Product pages include `Product` schema with price, availability, and (if present) aggregate rating
- [ ] Breadcrumb navigation includes `BreadcrumbList` structured data
- [ ] Organization/site-level schema is present where relevant (logo, social links)
- [ ] Structured data validates without errors (test with Google's Rich Results Test)

### URLs & Duplicate Content
- [ ] URLs are clean and descriptive (`/products/chocolate-chip-cookies`, not `/product?id=482`)
- [ ] Canonical tags are set correctly, especially on pages reachable via multiple URLs (filters, sort params, tracking params)
- [ ] Filtered/sorted category views don't create infinite crawlable duplicate-content variations without canonicalization
- [ ] Redirects (301) are in place for any changed or removed product/category URLs — broken links lose both users and ranking

### Mobile & Page Experience
- [ ] Pages are mobile-friendly (responsive layout, appropriately sized tap targets) since indexing is mobile-first
- [ ] Core Web Vitals are within acceptable ranges (cross-check with `performance-audit`)
- [ ] No intrusive interstitials blocking content on mobile

### Images & Media
- [ ] Product images have descriptive `alt` text (also an accessibility requirement — cross-check with `accessibility-audit`)
- [ ] Images are reasonably sized/compressed so they don't drag down page speed
- [ ] Open Graph and Twitter Card tags are set so shared links show a proper preview

### Internal Linking
- [ ] Related products, categories, and breadcrumbs create a logical internal link structure so crawlers (and users) can discover all pages
- [ ] No orphaned pages that aren't linked from anywhere on the site

## Common Issues in AI-Generated ("Vibe Coded") Sites

- **Generic, repeated meta titles/descriptions**: generated page templates often use the same title pattern with no real per-page uniqueness
- **Client-side-only rendering with no fallback**: generated single-page apps sometimes ship content that only appears after JS execution, which can be missed or delayed in indexing
- **Missing or malformed structured data**: schema markup is easy to get subtly wrong (wrong property names, missing required fields) in a way that fails validation silently
- **Duplicate content from URL parameters**: generated filter/sort UIs often create new crawlable URLs for every combination without canonical tags

## Reporting Format

```
## SEO Audit: <scope>

### Blocking (pages not indexable / major duplicate content)
- <finding> — <impact> — <fix>

### Ranking impact
- <finding> — <impact> — <fix>

### Improvements
- ...
```

## Boundaries

This skill covers on-page and technical SEO. It does not cover off-page SEO (backlink building, digital PR) or paid search strategy — flag those as separate workstreams if relevant. Page-speed specifics belong to `performance-audit`; this skill only flags speed as a ranking factor.
