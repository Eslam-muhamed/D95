---
name: functional-qa
description: Manually walk through every user-facing feature end-to-end, as a real user would, to verify it actually works against the original requirements — not just that it compiles or passes automated tests. Use this after a feature is marked "done", before any client demo or handoff, and whenever you suspect a feature "looks finished" but hasn't actually been clicked through. This is the single most effective way to catch the classic vibe-coding failure mode — a button, form, or flow that exists visually and reads correctly in the code, but was never actually wired end-to-end, or silently breaks on a step nobody tried.
---

# Functional QA

## Purpose

Catch the gap between "the code looks right" and "the feature actually works when a human uses it." Automated tests (see `testing`) verify what someone thought to test; this skill verifies the product against what it's actually supposed to do, by using it the way a real user — or the client — will.

## When to Use This Skill

- Any time a feature is marked "done" by an AI coding session, before treating it as actually done
- Before any client demo, UAT (user acceptance testing), or handoff
- After merging several features together — integration gaps often only appear when features are used in sequence
- When something "should" work per the code but nobody has personally clicked through it

## Process

1. **Build (or ask for) a requirements list per feature** — what is this screen/flow actually supposed to let the user do? Vibe-coded features often drift from the original ask without anyone noticing.
2. **Walk every primary flow start to finish**, using the UI exactly as a customer would — no shortcuts through the API, no skipping steps.
3. **Deliberately try to break it**: go back with the browser button, refresh mid-flow, double-click submit buttons, use invalid input, abandon and resume a cart, open two tabs at once.
4. **Check every state a feature can be in**, not just the default: empty, loading, error, success, partial/edge (e.g., last item in stock, quantity limits, expired session mid-checkout).
5. **Verify integrations actually fire**: does the confirmation email really arrive? Does the payment really show up in the payment dashboard? Does inventory really decrement? Don't assume a call succeeded because the UI didn't show an error.
6. **Log every discrepancy** between what the requirements said and what you observed — not just outright crashes.

## Checklist

### Core User Journeys (adapt to the actual product)
- [ ] Browse / search / filter products and get correct, expected results
- [ ] Add to cart, update quantity, remove from cart — cart total recalculates correctly every time
- [ ] Full checkout: guest and logged-in, every supported payment method, every supported shipping option
- [ ] Order confirmation actually arrives (email/SMS) and matches what was actually ordered and charged
- [ ] Account creation, login, logout, and password reset all work start to finish
- [ ] Order history / order status page shows accurate, current data

### State Coverage
- [ ] Empty states look intentional (empty cart, no orders yet, no search results) — not a blank page or raw error
- [ ] Loading states exist for anything that takes noticeable time
- [ ] Error states are shown to the user, not just logged silently — a failed action should never look like it succeeded
- [ ] Success states clearly confirm what happened (which item, what price, what's next)

### Integration Reality Check
- [ ] Payment actually appears in the payment processor's dashboard, matching the amount shown to the user
- [ ] Inventory/stock numbers actually update after a purchase, and out-of-stock is enforced (not just displayed)
- [ ] Transactional emails/notifications actually arrive, to a real inbox, with correct content
- [ ] Any admin/back-office view reflects what customers actually did, in real time or on an acceptable delay

### Abuse & Edge Interactions
- [ ] Double-clicking "place order" doesn't create duplicate orders/charges
- [ ] Browser back button after checkout doesn't allow re-submitting payment
- [ ] Refreshing mid-flow doesn't lose the cart or create an inconsistent state
- [ ] Two sessions/tabs interacting with the same cart or the same limited-stock item behave sensibly

### Cross-Feature Interactions
- [ ] Applying a discount, then removing an item, recalculates correctly
- [ ] Features built in separate sessions/PRs actually integrate (e.g., a new wishlist feature doesn't break the cart it reads from)

## Common Issues in "Vibe Coded" Projects

- **UI without a wired backend**: a button, form, or page that was generated and looks complete, but calls an endpoint that doesn't exist, isn't connected, or silently no-ops
- **Happy-path-only demos**: a feature that works exactly once, in the exact sequence it was generated/tested in, and breaks under any variation
- **Silent failures**: an action fails (network error, validation error) but the UI shows a success state anyway, because only the success path was ever written
- **Drift from the original requirement**: the AI implemented *something* plausible, but not quite what was actually asked for, and nobody compared the two side by side
- **Integration theater**: a feature that looks connected to a third-party service in the code, but was never actually verified against that service's real dashboard/logs

## Reporting Format

```
## Functional QA: <feature/flow>

### Broken (doesn't work as required)
- <flow/step> — <expected vs. actual> — <how to reproduce>

### Works but risky (edge case not handled)
- ...

### Confirmed working end-to-end
- <flow> — <what was verified, including the real integration check>
```

## Boundaries

This skill is manual, exploratory, and requirements-driven — it complements, not replaces, `testing` (automated regression coverage) and feeds directly into `production-readiness` and `client-handoff-readiness`. If a bug found here reveals a deeper pattern, route it back through `code-review` or the relevant audit skill.
