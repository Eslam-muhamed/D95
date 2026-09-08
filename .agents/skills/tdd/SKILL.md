---
name: tdd
description: Drive feature and bug-fix work with a strict red-green test-first loop — write one failing test for a single behavior, write the minimum code to pass it, then move to the next behavior. Use this whenever the user wants to build a feature or fix a bug "test-first," mentions "red-green-refactor" or "TDD," or whenever a behavior is concrete enough to pin down in a test before writing the implementation. This produces tests that actually catch regressions, which is exactly what `testing` checks for after the fact — this skill is how you get there during the build itself instead of retrofitting tests later.
---

# Test-Driven Development (TDD)

## Purpose

Make sure every piece of new behavior is proven by a test before — and only before — the code that implements it exists. Writing tests this way, one at a time against one behavior at a time, naturally produces tests that describe what the system does rather than how it's built, which is exactly the difference between a test suite that catches regressions and one that just mirrors the code (see the failure modes described in `testing`).

## When to Use This Skill

- Building any new feature with concrete, describable behavior
- Fixing a bug — write the failing test that reproduces it first, then fix it
- Whenever the user says "TDD," "red-green-refactor," or "test-first"
- Any time behavior is important enough that a future refactor shouldn't be allowed to silently break it (pricing, checkout, auth, inventory)

If the behavior isn't pinned down yet — you're still deciding what the feature should even do — settle that first with `grill-with-docs` before starting the loop. TDD verifies behavior; it doesn't discover it.

## The Loop

1. **Red — write one failing test for one behavior.** Not a batch of tests. Not the whole feature. One specific, nameable behavior (e.g., "applies free shipping when the cart exceeds the threshold"), expressed as a test that fails because the behavior doesn't exist yet.
2. **Green — write the minimum code to make that one test pass.** Resist adding anything the test doesn't require yet, even if you can see it coming — it gets added when its own test demands it.
3. **Refactor only from green.** Never clean up code while a test is red — get to green first, then improve the implementation with the safety net already in place. If refactoring breaks a test, that's information: either the refactor changed real behavior, or the test was coupled to an implementation detail it shouldn't have cared about.
4. **Repeat for the next behavior**, informed by what the last cycle taught you — not from a pre-written master list of every test the feature will eventually need.

The first cycle of a new feature should be a **tracer bullet**: the smallest possible test that proves one full path works end-to-end (e.g., one successful checkout with the simplest possible cart), before building out every variation and edge case from there.

## What Makes a Test Worth Keeping

- **Tests behavior through the public interface, not internals.** A test should describe an outcome a user or caller of the code actually cares about ("checkout succeeds and returns an order id"), not an implementation detail ("calls `calculateTax` with these arguments"). The implementation should be free to change completely without the test needing to change.
- **Reads like a specification.** A well-named test tells you what capability exists just from its name, without reading the body.
- **Expected values come from the spec, not from the implementation.** If a test computes its expected value using the same formula the code uses, it will pass even if that formula is wrong — it proves the code agrees with itself, not that it's correct.
- **One behavior per test**, so a failure tells you exactly what broke.

## Anti-Patterns to Avoid

- **Horizontal slicing**: writing every test for the whole feature first (all red), then writing all the implementation to turn them all green at once. This forces you to guess at the full test structure before you understand the implementation, and produces tests that check the shape you imagined rather than the behavior that actually matters.
- **Implementation-coupled tests**: mocking internal collaborators, calling private methods, or reaching around the public interface to check internal state directly (e.g., querying the database instead of going through the function that reads it).
- **Tautological tests**: re-deriving the expected value with the same logic the code uses, so the test can't fail even when the logic is wrong.
- **The refactor-while-red trap**: "cleaning up as you go" before the test is even passing, which conflates two different jobs — make it work, then make it good — and makes it hard to tell why something is broken.
- **Testing at the wrong seam**: writing a test around an incidental implementation detail instead of a real, intentional boundary in the code — this is what produces tests that break on every unrelated refactor.

## Common Issues in AI-Generated ("Vibe Coded") Tests

- Tests generated *after* the code, by reading the code and asserting what it already does — these are tautological by construction and prove nothing about correctness
- A whole feature's worth of tests generated in one shot, all green on the first run because the implementation was generated alongside them to satisfy exactly those tests — this is horizontal slicing wearing a TDD costume
- Heavy mocking of internal functions rather than testing through the real public interface, making tests brittle to harmless refactors

## Reporting Format (when reviewing whether TDD was actually followed)

```
## TDD Review: <feature>

### Followed correctly
- <behavior> — test written first, minimal implementation, passes for the right reason

### Concerns
- <behavior> — <what's off: tautological, horizontal slicing, implementation-coupled, etc.> — <fix>
```

## Boundaries

This skill governs *how* code and tests get written together during implementation. It doesn't replace `testing` (which audits the resulting suite's coverage and quality after the fact) or `functional-qa` (manual, human verification of the finished feature). The alignment step this skill assumes already happened belongs to `grill-with-docs`.

*The red-green-refactor discipline here is adapted from the `tdd` skill in [mattpocock/skills](https://github.com/mattpocock/skills) — a well-regarded, widely-used reference worth exploring directly for its fuller, more composable version (it also integrates with a dedicated interface-design skill this adaptation doesn't include).*
