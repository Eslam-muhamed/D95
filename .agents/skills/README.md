# Pre-Delivery Skill Set — cookie-store

These 14 skills exist for one reason: this project was built with heavy AI assistance ("vibe coded"), which moves fast but leaves gaps that don't surface until a real user — or the client — hits them. They split into two kinds:

- **12 audit skills** — checklist-driven reviews of finished (or in-progress) work: `code-review`, `security-audit`, `testing`, `database-review`, `performance-audit`, `accessibility-audit`, `seo-audit`, `functional-qa`, `cross-browser-compatibility`, `content-audit`, `production-readiness`, `client-handoff-readiness`. Run these on a schedule (per phase, and again before delivery).
- **2 process skills** — discipline for *how* work gets built in the first place, used continuously rather than once: `grill-with-docs` (align on requirements before coding) and `tdd` (red-green test-first loop while coding). These two are adapted from the excellent [mattpocock/skills](https://github.com/mattpocock/skills) project — worth exploring directly for their fuller, more composable originals.

Catching a gap during the process skills is cheapest; catching it in the audit skills is next-cheapest; catching it after delivery is the expensive way to learn the same lesson.

## Suggested order for a full pre-delivery pass

A gap found late costs more than a gap found early, so roughly in this order:

**0. Before writing any code for a feature or phase**
- **`grill-with-docs`** — interview-align on what's actually being built; repeat for every new feature or phase, not just once at project start

**While writing the code for that feature or phase**
- **`tdd`** — one failing test, minimum code to pass it, repeat; this is how the code gets written, not a step after it

**Then, per phase and again at the end, the audit pipeline:**

1. **`code-review`** — clean up logic and structure first; everything downstream is easier to audit on solid code
2. **`database-review`** — schema and query correctness underlies almost everything else
3. **`security-audit`** — critical, and findings here often require rework, so surface them early
4. **`testing`** — lock in automated regression coverage once the code is stable
5. **`functional-qa`** — manually click through every flow as a real user; this catches what tests didn't think to check
6. **`performance-audit`**
7. **`accessibility-audit`**
8. **`seo-audit`**
9. **`cross-browser-compatibility`**
10. **`content-audit`**
11. **`production-readiness`** — the final *technical* go/no-go, synthesizing 1–10
12. **`client-handoff-readiness`** — the final *business* go/no-go, run only after production-readiness says GO

In practice you'll loop back — a `security-audit` finding might send you back to `code-review`; a `functional-qa` bug might turn out to be a `database-review` issue; a surprise in `tdd` might mean `grill-with-docs` needs another round. Treat this as where to start, not a strict one-way pipeline.

## All skills at a glance

| Skill | Answers |
|---|---|
| `grill-with-docs` | Do we actually agree on what's being built, before any code exists? |
| `tdd` | Is each behavior proven by a test before it's implemented? |
| `code-review` | Is the code correct, readable, and consistent? |
| `security-audit` | Can this be exploited? |
| `testing` | Does the automated test suite actually catch regressions? |
| `database-review` | Is the schema/query/migration layer safe and sound? |
| `performance-audit` | Is it fast enough, especially on the revenue-critical path? |
| `accessibility-audit` | Can everyone actually use it, including keyboard/screen-reader users? |
| `seo-audit` | Can search engines find, understand, and rank it? |
| `functional-qa` | Does every feature actually work end-to-end, as a real user? |
| `cross-browser-compatibility` | Does it work outside the one browser it was built in? |
| `content-audit` | Is everything on the live site real, accurate, and licensed? |
| `production-readiness` | Is it technically safe to launch? |
| `client-handoff-readiness` | Can the client actually own and run this without you? |

## Master report

When running a full pre-delivery pass, aggregate every skill's findings into one document instead of leaving twelve scattered reports behind — it's far easier to see the real state of the project at a glance, and it doubles as a paper trail you can show the client that this wasn't a rubber-stamp handoff.

```
# Pre-Delivery Readiness Report — <project> — <date>

## Summary
<one line per skill: PASS / ISSUES FOUND (n critical, n high) / NOT YET RUN>

## Critical & High findings (all skills, combined)
- [skill] <finding> — <fix> — <status: open / fixed / accepted risk>

## Full findings by skill
### code-review
...
### security-audit
...
(one section per skill actually run)

## Go / No-Go
- Production readiness: GO / NO-GO / GO WITH CONDITIONS
- Client handoff readiness: GO / NO-GO / GO WITH CONDITIONS
```

Keep one of these per release or handoff (e.g. `docs/readiness-reports/2026-08-23.md`) so there's always a record of what was actually checked before something shipped.
