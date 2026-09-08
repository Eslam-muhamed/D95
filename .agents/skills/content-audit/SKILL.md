---
name: content-audit
description: Check the site for leftover placeholder content, sample/seed data, and unlicensed or unverified media that shouldn't ship to a real client's production site. Use this before any client delivery or launch, and whenever content was generated, copied, or filled in quickly to "make the UI look complete" during development — a very common vibe-coding shortcut that's easy to forget to clean up before the client (or their customers) see it.
---

# Content Audit

## Purpose

Catch anything in the live product that isn't real, isn't owned, or isn't ready for a customer to see — placeholder text, sample data, and unlicensed media are cosmetic issues until the moment they ship, at which point they become visible, embarrassing, and sometimes legally risky mistakes.

## When to Use This Skill

- Before any client delivery or public launch
- Whenever content (copy, images, sample products) was added quickly just to fill out a UI during development
- As part of `production-readiness` and `client-handoff-readiness` sign-off

## Process

1. **Search systematically for placeholder markers**: "lorem ipsum," "TODO," "test," "sample," "your company name," "coming soon," default framework starter text, and obviously fake data (e.g., "Test Product 1", "asdf@test.com").
2. **Review every image and media asset** for source and license — was it actually licensed/purchased/created for this client, or pulled from a generic stock/AI source without checking usage rights?
3. **Review real product/business content** for accuracy — prices, descriptions, contact info, business hours, legal entity name — matching what the client actually provided, not an approximation.
4. **Check metadata and hidden content**, not just what's visually obvious: page titles, alt text, admin-only labels, and console/log output that might reference test data or internal names.
5. **Confirm with the client** on anything ambiguous, such as a stock photo that looks fine but was never actually cleared for commercial/licensed use.

## Checklist

### Placeholder & Sample Content
- [ ] No "Lorem ipsum," "Your Company Name," default framework starter text, or similar filler remains anywhere customer-visible
- [ ] No obviously fake/test data (test products, `test@test.com` accounts, "asdf" entries) remains in what will be the live database
- [ ] "Coming soon" or stub pages are either finished or intentionally and clearly marked as such — not silently incomplete
- [ ] Every product, category, and page has real content the client actually approved, not an AI-generated filler description nobody reviewed

### Accuracy
- [ ] Prices, product descriptions, and specs match what the client actually provided
- [ ] Business information (address, contact email/phone, hours, legal/entity name) is correct and current
- [ ] Legal pages (privacy policy, terms, returns/refund policy) reflect this business's actual practices, not a generic template left unedited

### Media & Licensing
- [ ] Every image, icon, and font in production has a clear, legitimate license for this commercial use (purchased stock, client-provided, properly licensed free-use, or original)
- [ ] No images pulled directly from a search engine or a competitor's site "temporarily" that never got replaced
- [ ] AI-generated images (if used) are reviewed for anything that could unintentionally resemble a real person, trademarked logo, or copyrighted character
- [ ] Attribution is given anywhere a license requires it

### Hidden/Metadata Content
- [ ] Page titles, meta descriptions, and alt text don't contain leftover placeholder or template text
- [ ] No test/internal notes leak into user-visible fields (e.g., a product "internal notes" field accidentally rendered on the public page)
- [ ] Console/network output doesn't reveal internal or test-only labels to end users

## Common Issues in "Vibe Coded" Projects

- **Starter-template content never replaced**: default framework demo text or images left in place because the layout "looked done" and nobody read the actual words
- **AI-filled product catalogs**: realistic-sounding but entirely fabricated product names, descriptions, or prices generated to populate the UI during development, never swapped for the client's real catalog
- **Unlicensed "temporary" images**: a placeholder image grabbed from a search engine to fill a hero section that quietly becomes the permanent, shipped image
- **Legal boilerplate left generic**: a privacy policy or terms-of-service template inserted for structure, never actually customized to the business

## Reporting Format

```
## Content Audit: <scope>

### Must fix before launch
- <location> — <what's wrong> — <what's needed (real content, license, correction)>

### Should verify with client
- ...

### Confirmed real & licensed
- ...
```

## Boundaries

This skill covers content accuracy and rights, not code quality, SEO structure, or the accessibility of that content (see `seo-audit` and `accessibility-audit` for those angles on the same pages).
