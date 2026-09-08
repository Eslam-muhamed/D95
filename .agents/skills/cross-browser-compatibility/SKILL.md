---
name: cross-browser-compatibility
description: Check that the site or app actually renders and behaves correctly across the browsers and devices real users will use — not just the one browser it was built and tested in. Use this whenever the user asks about "browser compatibility", "does this work on Safari/mobile", or before any client delivery or launch, since AI-assisted frontend generation is frequently validated in a single environment and silently breaks on other browsers, screen sizes, or touch devices.
---

# Cross-Browser & Device Compatibility

## Purpose

Confirm the UI actually works everywhere real users will load it — different browsers, different rendering engines, different screen sizes, and touch vs. mouse input — rather than just the one setup it happened to be built and glanced at in.

## When to Use This Skill

- Before any client delivery or public launch
- When asked about browser or device compatibility
- After any significant CSS/layout change or new frontend component
- When a bug report says "works for me" but not for someone else — environment differences are a prime suspect

## Process

1. **Identify the target environments**: which browsers, OS versions, and device classes actually matter for this audience (check analytics if available; default to the current versions of Chrome, Safari, Firefox, and Edge, plus iOS Safari and Android Chrome, if no data exists).
2. **Test the critical path first** (browse → cart → checkout) on at least one real mobile device and one non-Chromium browser — most vibe-coded issues surface exactly here, since development and AI tooling defaults skew heavily toward Chrome on desktop.
3. **Check layout at multiple breakpoints**, not just resizing a desktop window — real mobile browsers have different viewport and input behavior than a resized desktop window.
4. **Check interaction, not just appearance**: taps vs. clicks, hover-dependent UI on touch devices, on-screen keyboard behavior over form fields.
5. **Check for silent JavaScript errors** in each browser's console — a feature can look fine while quietly failing due to a browser-specific API difference.

## Checklist

### Rendering
- [ ] Layout holds up correctly on at least one Chromium browser, Safari (WebKit), and Firefox (Gecko) — these three engines cover the vast majority of real behavior differences
- [ ] iOS Safari specifically checked — it has the most frequent and distinct quirks (viewport height, input styling, date pickers, `position: fixed` behavior)
- [ ] No layout that only works at exactly one viewport width; test common breakpoints (small phone, large phone, tablet, small laptop, large desktop)
- [ ] Fonts, icons, and custom form controls render consistently, not falling back to broken/default styling in any target browser

### Interaction
- [ ] Every interactive element works with touch, not just mouse hover/click (hover-only menus or tooltips are inaccessible on touch devices)
- [ ] Forms are usable with mobile on-screen keyboards (correct input types so the right keyboard appears — numeric for card numbers, email for email fields)
- [ ] Pinch-to-zoom and text scaling aren't accidentally disabled unless there's a specific reason
- [ ] Sticky/fixed elements (headers, add-to-cart bars) don't overlap content or misbehave on mobile scroll

### JavaScript & API Compatibility
- [ ] No console errors in any target browser on page load or through the core flow
- [ ] No use of browser APIs unsupported in a target browser without a fallback (check anything recently added to the web platform)
- [ ] Polyfills or graceful degradation exist for any feature not universally supported across the target list

### Performance Parity
- [ ] The experience is checked on a mid-range mobile device or throttled connection, not only on the developer's high-end machine — vibe-coded frontends are typically only ever run on fast hardware during development

## Common Issues in AI-Generated ("Vibe Coded") Frontends

- **Chrome/desktop-only validation**: generated and self-reviewed code is usually only ever opened in the default desktop browser during development, so Safari- and mobile-specific bugs ship untouched
- **Hover-dependent interactions**: menus, tooltips, or reveal-on-hover UI with no touch equivalent
- **Viewport-unit surprises on mobile Safari**: `100vh` and similar units behaving unexpectedly with the mobile browser chrome, causing cut-off or overflowing layouts
- **Unverified new/less-common web APIs**: adopting a convenient browser API without checking its actual support across the target browser list

## Reporting Format

```
## Cross-Browser Audit: <scope>

### Broken in a target environment
- <browser/device> — <what's broken> — <fix or fallback>

### Works, but degraded
- ...

### Verified consistent
- <browsers/devices tested and confirmed working>
```

## Boundaries

This skill covers rendering and interaction consistency across environments. For accessibility concerns (keyboard/screen reader), see `accessibility-audit`. For raw speed on a given device, see `performance-audit`.
