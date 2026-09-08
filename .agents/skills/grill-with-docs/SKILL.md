---
name: grill-with-docs
description: Before building anything non-trivial, interview the user one question at a time until the plan is actually unambiguous — and write down every resolved term and hard decision as you go, so the alignment isn't lost the moment the session ends. Use this at the start of any new feature, before writing a spec, whenever a request is vague enough that two reasonable people could build it two different ways, or whenever the user asks to be interviewed about a plan. This is the fix for the single most common cause of vibe-coding drift — building the wrong thing correctly, because nobody actually agreed on what "right" meant first.
---

# Grill With Docs

## Purpose

Close the gap between what the user meant and what gets built — before a single line of implementation code exists — by interviewing them properly instead of guessing, and by writing down what gets agreed so it survives past this one conversation.

## When to Use This Skill

- The start of any feature or change that isn't trivially small
- Before writing a spec or breaking work into tickets
- Whenever a request uses a term that could mean more than one thing in this project (e.g., "order," "active," "admin" — words that sound precise but often aren't)
- Whenever you catch yourself about to fill a gap in the request with an assumption instead of a question
- On a codebase with no existing documentation — this skill can be pointed at the code itself and asked to help build that documentation from scratch

## Process

1. **Ask one question at a time.** Never front-load a wall of ten questions — it's exhausting to answer, and later questions are often invalidated by earlier answers anyway.
2. **Group only truly independent questions into a round.** A round should never contain a question whose answer might change because of another question in the same round. Once a round is answered, work out the next round from what was just learned — don't work from a fixed, pre-written list.
3. **Resolve ambiguous terms as they come up**, not at the end. If "active customer" could mean "logged in this session" or "made a purchase in the last 90 days," stop and ask which one right when it appears — don't let two different meanings quietly coexist in the same conversation.
4. **Write down what's resolved immediately**, in two places depending on what kind of thing it is:
   - A **glossary entry** for any term whose meaning was just pinned down (a running project glossary — call it `CONTEXT.md` or similar — so this vocabulary is available in every future session, not just this one)
   - A short **decision record** for anything hard to reverse later (a chosen approach among real alternatives, a constraint the user explicitly imposed) — enough to capture what was decided and why, so nobody re-litigates it by accident three sessions from now
5. **Ground questions in the real codebase where one exists.** Read the relevant code first so questions are about actual ambiguity in this project, not generic requirements-gathering boilerplate.
6. **Know when to stop.** Once every branch of the plan has a clear, agreed answer, close the interview and move to writing it up as a spec — or straight to `tdd` if the change is small enough that a formal spec would be overkill.

## What a Good Round Looks Like

- Each question in the round is answerable without knowing the answer to any other question in that round
- Each question is specific to this project (uses names/terms that actually exist here), not a generic template question
- A question that surfaces a genuinely ambiguous term stops and resolves that term before moving on, rather than letting the interview continue past it

## What a Good Glossary Entry / Decision Record Looks Like

- **Glossary entry**: the term, the one meaning it has in this project, and — if it was previously overloaded — what it no longer means
- **Decision record**: what was decided, the real alternatives that were on the table, and why this one was chosen — short enough to actually get read later, not an essay

## Common Issues This Prevents in "Vibe Coded" Projects

- **Silent scope drift**: the AI fills every gap in a vague request with a plausible-sounding assumption, and ends up building something adjacent to, but not actually, what was asked
- **The same word meaning different things in different files**: because nobody ever stopped to pin down what "order status" or "active" actually means, different parts of the codebase quietly implement different definitions
- **Re-litigating settled decisions**: a choice gets made, forgotten, and re-argued (or silently reversed) two sessions later because it only ever lived in one person's memory of one conversation
- **A fresh AI session with no memory of any of this**, starting from zero on vocabulary and past decisions every single time, because nothing was ever written to disk

## Output Format

```
## Alignment Summary: <feature/change>

### Resolved
- <question> → <answer, in the user's own words where possible>

### New/updated glossary terms
- <term>: <meaning> (previously ambiguous: <what it could have meant instead>)

### Decisions recorded
- <decision> — chosen over <alternative(s)> — because <reason>

### Ready to build?
<Yes, hand off to a spec/ticket or straight to `tdd` — or No, open branches remaining: ...>
```

## Boundaries

This skill is about alignment and shared vocabulary before code exists — it doesn't write the code or the tests (`tdd` does that once the plan is settled) and it doesn't audit finished code (the 12 audit skills do that afterward). It's the highest-leverage place to catch a vibe-coding problem, because a misunderstanding caught here costs a conversation; the same misunderstanding caught in `functional-qa` or `client-handoff-readiness` costs a rebuild.

*This skill is adapted from the `grill-with-docs` / `grilling` skills in [mattpocock/skills](https://github.com/mattpocock/skills), which pioneered this one-question-at-a-time interview pattern with live documentation — worth exploring directly for the fuller, more composable version.*
