---
name: performance-audit
description: Audit frontend and backend performance — bundle size, render performance, Core Web Vitals, API response times, caching, and database query speed. Use this whenever the user mentions the site or app feels slow, before a launch or high-traffic event (sale, promotion), or when asked to "check performance", "optimize", or "audit speed". Especially important for e-commerce, where slow product pages and checkout flows directly cost conversions and revenue.
---

# Performance Audit

## Purpose

Find what's actually making the application slow, prioritized by user and business impact — not just theoretical inefficiencies. A performance audit should end with a ranked list of fixes, not just a pile of observations.

## When to Use This Skill

- The user reports the site/app "feels slow"
- Before a launch, sale, or any expected traffic spike
- When asked to audit or improve performance
- As part of `production-readiness` sign-off
- After `database-review` surfaces slow queries, to assess their real-world impact

## Process

1. **Measure before guessing.** Get real numbers: Lighthouse/PageSpeed scores, actual API response times, database query timings. Don't optimize based on assumption.
2. **Follow the user's actual critical path**: for a store, that's typically browse → product page → cart → checkout. Prioritize performance work on pages with the highest traffic and highest revenue sensitivity.
3. **Separate frontend, backend, and database concerns** — they need different fixes.
4. **Check for the highest-impact, lowest-effort wins first** (image compression, caching headers) before diving into deep architectural changes.
5. **Re-measure after changes** to confirm actual improvement, not just theoretical improvement.

## Checklist

### Frontend / Core Web Vitals
- [ ] Largest Contentful Paint (LCP): hero/product images are optimized (compressed, correctly sized, modern formats like WebP/AVIF) and not render-blocked
- [ ] Cumulative Layout Shift (CLS): images and ads/embeds have explicit dimensions so content doesn't jump as it loads
- [ ] Interaction latency (INP): heavy JavaScript isn't blocking the main thread during user interaction (add to cart, apply filter)
- [ ] JavaScript bundle size is reasonable; code-splitting is used so users don't download the whole app for one page
- [ ] Unused CSS/JS isn't shipped to every page
- [ ] Fonts are loaded efficiently (preloaded, `font-display: swap`) to avoid invisible text or layout shift
- [ ] Critical rendering path isn't blocked by render-blocking scripts/stylesheets

### Backend / API
- [ ] API response times are measured for key endpoints (product listing, search, checkout) — flag anything over ~200-300ms for user-facing calls
- [ ] Slow endpoints are profiled to find the actual bottleneck (database? external API call? serialization?) rather than guessed at
- [ ] Expensive computations are cached where the result doesn't change per-request (product listings, category pages)
- [ ] External API calls (payment, shipping rate lookups, tax calculation) have timeouts and don't block unrelated work

### Caching & CDN
- [ ] Static assets (images, CSS, JS) are served with long cache lifetimes and content-hashed filenames
- [ ] A CDN serves static assets and, where appropriate, cacheable pages close to the user
- [ ] Server-side/application caching exists for expensive, repeatable queries (e.g., homepage featured products)
- [ ] Cache invalidation is correct — stale prices or stock levels are a real business risk, not just a UX nit

### Database (cross-check with `database-review`)
- [ ] No N+1 queries on high-traffic pages
- [ ] Indexes exist for the actual query patterns on hot paths
- [ ] Connection pooling is configured sensibly for expected concurrency

### Scalability
- [ ] The system has been load-tested (or at least reasoned about) for expected peak traffic, especially around sales/promotions
- [ ] Rate limiting exists so one abusive client or bot can't degrade service for everyone
- [ ] Autoscaling or sufficient headroom is in place for traffic spikes, if on cloud infrastructure

## Prioritization Framework

Rank findings by impact × effort, not just severity:

| | Low effort | High effort |
|---|---|---|
| **High impact** | Do first (image compression, caching headers, obvious N+1 fix) | Plan for next (query redesign, code-splitting overhaul) |
| **Low impact** | Nice-to-have, batch with other work | Usually skip |

## Common Issues in AI-Generated ("Vibe Coded") Code

- **Unoptimized images shipped as-is**: generated components often reference full-resolution uploaded images directly with no resizing/compression pipeline
- **Missing memoization/re-render control** in frontend frameworks, causing expensive re-computation on every render
- **New dependency for something trivial**: pulling in a large library for functionality that could be a few lines of code, bloating bundle size
- **No caching by default**: generated backend code typically hits the database fresh on every request unless explicitly asked to cache
- **Synchronous/blocking calls to third-party APIs** on the critical request path instead of async/background processing where the UX allows it

## Reporting Format

```
## Performance Audit: <scope>

### High impact, low effort (do now)
- <finding> — <measured impact> — <fix>

### High impact, high effort (plan)
- ...

### Low priority
- ...

### Baseline metrics
- LCP: __ | CLS: __ | INP: __ | Key API p95: __ms
```

## Boundaries

This skill covers application and infrastructure-adjacent performance. For query/index specifics, pair with `database-review`. For SEO impact of page speed, pair with `seo-audit` (Core Web Vitals affect both UX and ranking).
