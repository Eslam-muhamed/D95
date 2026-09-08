---
name: code-review
description: Perform a thorough code review of recently written or modified code — checking correctness, readability, maintainability, error handling, and consistency with the existing codebase. Use this whenever the user asks to "review", "check", or "look over" code, before merging a pull request, after generating a non-trivial piece of code, or any time code is about to be committed or shipped. This is especially important for AI-generated ("vibe coded") code, which can look plausible while hiding logic errors, inconsistent patterns, or unhandled edge cases — always run this skill before treating newly generated code as done.
---

# Code Review

## Purpose

Catch correctness, readability, and maintainability problems before code is merged or shipped — with special attention to the failure modes of AI-generated code, which tends to look polished on the surface while hiding logic gaps, inconsistent conventions, or silently-wrong edge case handling.

## When to Use This Skill

- Before merging any pull request or committing to a shared branch
- Immediately after generating or editing a non-trivial chunk of code (a new function, a new component, a new endpoint)
- When the user says "review this", "check this over", "does this look right?", or similar
- Before handing code off to `testing`, `security-audit`, or `production-readiness` — a clean code review first makes those audits faster

## Process

1. **Understand the intent first.** Read the surrounding code, the PR description, or ask what the change is supposed to do before judging whether it does it. A review without a clear target is just style-nitpicking.
2. **Read the diff, not just the final file.** What was added, removed, or changed tells you where the risk is concentrated.
3. **Trace the logic by hand** for anything non-trivial — don't assume it's correct because it compiles or "looks right."
4. **Check it against the checklist below**, grouped by category.
5. **Classify each finding** by severity so the author knows what's blocking vs. optional.
6. **Report findings using the format below** — don't just say "looks good" without evidence you actually traced the logic.

## Checklist

### Correctness & Logic
- [ ] The code does what the surrounding context/ticket/PR description claims it does
- [ ] Edge cases are handled: empty inputs, null/undefined, zero, negative numbers, empty arrays, duplicate entries
- [ ] Off-by-one errors in loops, pagination, and array slicing
- [ ] Async code is actually awaited; no unhandled promise rejections or race conditions
- [ ] Error paths don't silently swallow failures (no empty `catch` blocks)
- [ ] Return values and types match what callers expect

### Readability & Maintainability
- [ ] Names describe intent, not implementation (`getActiveDiscounts()` not `getData2()`)
- [ ] Functions do one thing; deeply nested conditionals are flattened or extracted
- [ ] No dead code, commented-out blocks, or leftover debug statements (`console.log`, `print`, `debugger`)
- [ ] No unused variables, imports, or parameters
- [ ] Comments explain *why*, not *what* — code that needs a comment to explain *what* it does often needs rewriting instead

### Consistency
- [ ] Matches existing project conventions (naming, file layout, formatting, error-handling style)
- [ ] Doesn't reinvent a utility/helper that already exists elsewhere in the codebase
- [ ] New patterns are justified — if this PR does something differently from the rest of the codebase, that should be intentional, not accidental

### Error Handling
- [ ] User-facing errors are helpful and don't leak internals (stack traces, SQL, file paths)
- [ ] Failures are logged with enough context to debug later
- [ ] Retries/timeouts exist for calls to external services (payment processors, email providers, etc.)

### Type Safety & Contracts
- [ ] Typed languages: no unnecessary `any`, no suppressed type errors (`@ts-ignore`) without a comment explaining why
- [ ] API contracts (request/response shapes) match what the frontend and backend both expect
- [ ] Database models match the actual schema

### Dependencies
- [ ] New dependencies are justified (not a 10MB library for one utility function)
- [ ] No duplicate libraries doing the same job as one already in use
- [ ] Lockfile is updated and committed alongside the manifest

### Tests
- [ ] New logic has tests, or a clear note on why it doesn't (see `testing` skill for depth)
- [ ] Existing tests still pass and weren't modified just to make them pass

### Housekeeping
- [ ] No duplicate or near-duplicate files left over from earlier generations (`Button2.jsx`, `ButtonNew.jsx`, `utils_old.js`) that are no longer imported anywhere
- [ ] No commented-out "previous version" of a component sitting next to its replacement
- [ ] `TODO`/`FIXME` comments for known-incomplete work are tracked in an issue tracker, not just left silently in the code where they'll be forgotten

## Severity Guide

| Severity | Meaning | Example |
|---|---|---|
| **Critical** | Breaks functionality, data loss, or security risk | Unvalidated input reaches the database; a discount code can be applied infinitely |
| **High** | Likely to cause bugs or maintenance pain soon | Unhandled promise rejection on the checkout call; duplicated business logic in two places |
| **Medium** | Real but non-urgent issue | Inconsistent naming, missing test for an edge case |
| **Low** | Style/nit, non-blocking | Minor formatting, a name that could be clearer |

## Common Issues in AI-Generated ("Vibe Coded") Code

- **Plausible but wrong logic**: code that reads fluently and looks idiomatic but doesn't actually implement the requested behavior correctly (e.g., an off-by-one in pagination, a filter applied in the wrong order)
- **Invented APIs**: calls to functions, library methods, or config options that don't actually exist or don't behave the way the code assumes — verify against real documentation, don't assume it's real because it looks right
- **Silent scope creep**: extra "helpful" changes bundled into the same generation that weren't asked for and weren't reviewed
- **Copy-pasted duplication**: near-identical logic repeated across files instead of extracted, because each generation solved its local problem without awareness of the rest of the codebase
- **Missing edge cases**: happy-path-only implementations with no handling for empty states, failures, or unexpected input
- **Over-engineering**: unnecessary abstraction layers, config options, or generality for a problem that didn't need it

## Reporting Format

```
## Code Review: <file/feature>

### Critical
- [file:line] <issue> — <why it matters> — <suggested fix>

### High
- ...

### Medium
- ...

### Low
- ...

### What's good
- <call out genuinely solid decisions — reviews that are 100% criticism train people to dread them>
```

## Boundaries

This skill covers general code quality. For deeper domain checks, hand off to the specialized skills:
- Security-specific concerns → `security-audit`
- Query/schema-specific concerns → `database-review`
- Speed/efficiency concerns → `performance-audit`
- Test coverage/quality in depth → `testing`
