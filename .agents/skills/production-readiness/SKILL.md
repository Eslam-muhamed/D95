---
name: production-readiness
description: Run a final go/no-go readiness check before deploying to production or launching — covering configuration, monitoring, rollback plans, backups, and a sanity pass across code quality, security, testing, database safety, performance, SEO, and accessibility. Use this whenever the user asks "is this ready to launch/deploy/ship", before a production release, and always before a first launch or a major feature going live to real users and real payments.
---

# Production Readiness

## Purpose

Be the last checkpoint before real users and real money hit the system. This skill assumes the other audits (code review, security, testing, database, performance, SEO, accessibility) have already happened, and focuses on operational readiness plus a final sanity sweep across all of them.

## When to Use This Skill

- Before any production deployment, and especially before the first public launch
- Before a major feature goes live (new checkout flow, new payment method, new integration)
- When the user asks "is this ready to ship/launch/go live?"
- Before and immediately after a high-traffic event (sale, promotion, press coverage)

## Process

1. **Confirm the other audits happened.** This skill is a gate, not a replacement — if `security-audit`, `testing`, `database-review`, `performance-audit`, `seo-audit`, `accessibility-audit`, `functional-qa`, `cross-browser-compatibility`, and `content-audit` haven't been run on the relevant changes, run them (or ask that they be run) before treating this as complete.
2. **Walk the operational checklist below** — this is the stuff that doesn't show up in a code review but causes real incidents (misconfigured environment variables, no rollback plan, no monitoring).
3. **Do a live smoke test** of the critical path (browse → cart → checkout → confirmation, using a real test transaction if the payment provider supports one) in the actual production environment, not just staging.
4. **Confirm there's a plan for when something goes wrong** — rollback, on-call, and communication — not just a plan for when it goes right.
5. **Give a clear go/no-go**, with blocking issues called out explicitly rather than buried in a long list.

## Checklist

### Configuration
- [ ] Environment variables are set correctly for production (no dev/test API keys, no debug flags left on)
- [ ] Payment provider is in live mode with production keys, and webhook endpoints point to production URLs
- [ ] DNS and SSL/TLS certificates are correctly configured and set to auto-renew
- [ ] Feature flags for unfinished work are off in production

### Monitoring & Observability
- [ ] Error tracking (e.g., Sentry or equivalent) is wired up and actually receiving events from production
- [ ] Uptime/health-check monitoring exists for the site and critical API endpoints
- [ ] Logs are accessible and searchable, and don't contain sensitive data (cross-check `security-audit`)
- [ ] Alerts are configured for the things that actually matter (payment failures spiking, error rate spiking, checkout conversion dropping) — not so noisy that real alerts get ignored

### Backups & Recovery
- [ ] Database backups are configured on a schedule
- [ ] A restore has actually been tested at least once — an untested backup is not a real backup
- [ ] There's a documented rollback plan for the deployment itself (previous version can be redeployed quickly)

### Resilience
- [ ] The system has headroom or autoscaling for expected traffic, with extra margin for a launch/sale spike
- [ ] Rate limiting/basic DDoS protection is in place at the edge
- [ ] Graceful degradation exists for non-critical third-party dependencies (e.g., if a recommendations widget's API is down, the page still loads without it)

### Legal & Compliance Basics
- [ ] Privacy policy and terms of service are present and accurate
- [ ] Cookie consent banner is present if using tracking/analytics cookies that require it in the target jurisdictions
- [ ] Data handling matches any applicable regulation the business is subject to (GDPR/CCPA-type obligations), especially for storing customer PII and payment data

### Final Smoke Test
- [ ] Full critical path tested end-to-end in production: browse → search → add to cart → checkout → payment → confirmation email/order record
- [ ] Test on both desktop and mobile
- [ ] Test at least one failure case on purpose (e.g., a declined test card) to confirm errors are handled gracefully, not just the happy path

### Cross-Check Against Other Audits
- [ ] `code-review`: no outstanding critical/high findings on the changes going live
- [ ] `security-audit`: no outstanding critical/high findings, especially on auth, payments, and PII
- [ ] `testing`: critical paths (checkout, payment, auth) have real test coverage, not just implementation-mirroring tests
- [ ] `database-review`: no unsafe/irreversible migrations queued without a tested plan
- [ ] `performance-audit`: key pages meet acceptable Core Web Vitals and API latency under expected load
- [ ] `accessibility-audit`: checkout and account flows are keyboard- and screen-reader-usable
- [ ] `seo-audit`: public pages are indexable and don't have obvious duplicate-content/meta issues (lower urgency than the above, but don't skip it for a public launch)
- [ ] `functional-qa`: every core user journey was manually walked through end-to-end, including real integration checks (payment, email, inventory)
- [ ] `cross-browser-compatibility`: the critical path was verified on at least one non-Chromium browser and one real mobile device
- [ ] `content-audit`: no placeholder/sample content or unlicensed media remains on customer-facing pages

### Incident Readiness
- [ ] Someone is designated to be reachable immediately after launch/deploy
- [ ] There's a way to communicate to users if something breaks (status page, support email monitored)
- [ ] The team knows how to roll back or disable the affected feature quickly if needed

## Common Issues in "Vibe Coded" Launches

- **Skipping straight to deploy once code "looks done"**: AI-assisted development can produce working-looking code fast, which creates pressure to ship before the operational and audit steps above have actually happened
- **Untested backups/rollback**: configured but never verified, discovered to be broken exactly when needed
- **Dev/test keys leaking into production config** during a rushed final deploy
- **No smoke test in the real production environment** — staging looking fine isn't the same as production being fine (different config, different data, different scale)

## Reporting Format

```
## Production Readiness Review: <release/feature>

### Go / No-Go: <GO | NO-GO | GO WITH CONDITIONS>

### Blocking issues (must fix before launch)
- <issue> — <source audit if applicable> — <owner/fix>

### Non-blocking, fix soon after launch
- ...

### Confirmed ready
- <what was checked and is solid>
```

## Boundaries

This skill is a synthesis and operational gate — it assumes the deep-dive audits (`code-review`, `security-audit`, `testing`, `database-review`, `performance-audit`, `seo-audit`, `accessibility-audit`, `functional-qa`, `cross-browser-compatibility`, `content-audit`) exist or get run alongside it. It doesn't replace them. A GO here means the product is technically safe to launch — it does not mean the project is ready to hand to a client; run `client-handoff-readiness` next for that.
