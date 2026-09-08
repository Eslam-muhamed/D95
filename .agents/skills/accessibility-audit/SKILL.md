---
name: accessibility-audit
description: Audit UI code for accessibility — keyboard navigation, screen reader support, color contrast, semantic HTML, and WCAG compliance. Use this whenever the user asks about accessibility, a11y, WCAG, or ADA compliance, or screen reader support, and always for any new user-facing page or component before it ships — especially checkout and account flows, which are both the highest-stakes and most commonly-neglected for accessibility.
---

# Accessibility Audit

## Purpose

Make sure the interface is usable by people who navigate with a keyboard, a screen reader, or have low vision or color blindness — not as an afterthought, but as a real check against WCAG 2.1 AA, the common legal and practical baseline.

## When to Use This Skill

- Any new user-facing page, component, or form
- When asked about accessibility, a11y, WCAG, or ADA compliance
- Always for checkout, cart, and account flows — these are both revenue-critical and legally highest-risk if inaccessible
- As part of `production-readiness` sign-off

## Process

1. **Check semantic structure first**: is the page built from meaningful HTML elements (buttons, headings, lists, form labels), or is everything a generic container with a click handler?
2. **Try it with just a keyboard**: tab through the entire flow. Can you reach every interactive element, see where focus is, and operate everything (including modals and custom dropdowns) without a mouse?
3. **Check color contrast** on text, buttons, and any information conveyed by color alone.
4. **Check images and non-text content** for appropriate alt text or hidden-from-assistive-tech markup if purely decorative.
5. **Check forms** for proper labels and accessible error messaging.
6. **Prioritize the checkout/account flow** above general browsing pages — this is where inaccessibility most directly blocks someone from completing a purchase.

## Checklist

### Semantic HTML
- [ ] Interactive elements use real `<button>`/`<a>` elements, not a styled `<div>` with a click handler and no keyboard support
- [ ] Heading levels (`h1`–`h6`) form a logical, unskipped hierarchy describing page structure
- [ ] Lists of items use `<ul>`/`<ol>`, tables use `<table>` with proper headers — not styled `<div>` grids for tabular data
- [ ] Landmarks (`<nav>`, `<main>`, `<header>`, `<footer>`) are used so screen reader users can jump between regions

### Keyboard Navigation
- [ ] Every interactive element (links, buttons, form fields, custom dropdowns, carousels) is reachable and operable via Tab/Shift+Tab/Enter/Space
- [ ] Focus order follows visual/logical reading order
- [ ] Focus is visibly indicated at all times (never suppressed without a replacement focus style)
- [ ] Modals/dialogs trap focus while open and return focus to the trigger element on close
- [ ] No keyboard traps (a user can always Tab away from any component)

### ARIA & Screen Readers
- [ ] ARIA is used only where semantic HTML can't express the pattern (custom dropdowns, tabs, modals) — not sprinkled on everything
- [ ] Icon-only buttons have an accessible name (e.g., a cart icon button needs a label like "View cart", not just an icon)
- [ ] Live regions announce dynamic changes that matter (cart updated, form error appeared) without being so chatty they become noise
- [ ] Decorative images are hidden from assistive tech; meaningful images have descriptive alt text

### Color & Visual Design
- [ ] Text meets WCAG AA contrast (4.5:1 for normal text, 3:1 for large text) against its background
- [ ] Information is never conveyed by color alone (e.g., a "sale" or "out of stock" indicator has a text label or icon, not just red text)
- [ ] Interactive states (hover, focus, disabled) are distinguishable without relying on color alone

### Forms
- [ ] Every input has a properly associated label (not just placeholder text, which disappears on input and isn't a reliable substitute)
- [ ] Required fields are indicated in a way screen readers announce, not just visually (e.g., a red asterisk alone)
- [ ] Validation errors are programmatically associated with their field and announced, not just shown as floating text nearby
- [ ] Error messages are specific and actionable ("Enter a valid ZIP code" not just "Invalid input")

### Media
- [ ] Videos have captions; audio content has a transcript where meaningful

## Common Issues in AI-Generated ("Vibe Coded") UI

- **Generic-container soup**: generated components frequently build custom-styled buttons and dropdowns from non-interactive elements with click handlers, which look right visually but are invisible to keyboard and screen reader users
- **Placeholder-as-label**: forms generated quickly often use only a placeholder instead of a real associated label
- **Icon buttons with no accessible name**: a generated cart/search/menu icon button often has no accessible label, so a screen reader announces nothing useful
- **Missing focus management in modals**: generated modal/dialog components often skip focus trapping and focus return entirely
- **Contrast issues from design tokens**: generated UI sometimes uses low-contrast gray-on-white text combinations that look "clean" but fail AA contrast

## Reporting Format

```
## Accessibility Audit: <scope>

### Blocking (WCAG failures, blocks task completion)
- <finding> — <WCAG criterion if known> — <fix>

### Should fix
- ...

### Nice to have
- ...
```

## Boundaries

This skill covers front-end/UI accessibility. It does not replace testing with real assistive technology or real users when the stakes are high (e.g., before a compliance deadline) — recommend that as a follow-up for critical flows like checkout.
