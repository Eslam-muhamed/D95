---
name: client-handoff-readiness
description: Verify the project is actually ready to hand over to the client — not just technically deployed, but documented, owned by the client (not the developer), and supportable without you in the room. Use this as the final step before delivering any project to a client, before a contract is marked complete, or when asked "is this ready to hand off / deliver / send to the client". This is the step vibe-coded projects most often skip — the code can be perfect and the launch flawless, and the client can still be stuck the moment the developer is unreachable, because credentials, documentation, or ownership were never transferred.
---

# Client Handoff Readiness

## Purpose

A project isn't actually delivered until the client can run, maintain, and grow it without you. This skill checks the business and operational side of handoff — ownership, access, documentation, and support — a completely different failure mode from a technical bug, and one that's easy to skip when all the focus has been on shipping working code.

## When to Use This Skill

- The final step before marking a project/contract complete
- Before sending final handoff materials or invoicing final payment
- When asked "is this ready to deliver to the client?"
- Always run *after* `production-readiness` gives a technical GO — this skill assumes the product itself works and checks whether the client can actually take ownership of it

## Process

1. **List every account, credential, and service the project depends on**, and confirm who owns each one.
2. **Confirm documentation exists** for anything the client or a future developer would need to operate or extend the system — don't assume tribal knowledge will transfer verbally.
3. **Remove or hand over anything developer-only** that shouldn't ship to (or remain accessible in) the client's production environment.
4. **Check the deliverable against the original scope/contract**, so nothing agreed upon is silently missing.
5. **Confirm a support/warranty understanding exists** — what happens when the client finds a bug next week, and who fixes it.

## Checklist

### Ownership & Access
- [ ] Domain registration is under the client's account (or a registrar/account they control), not the developer's personal account
- [ ] Hosting/cloud provider account is owned by the client, or the client has full admin access if shared
- [ ] Payment processor (Stripe/PayPal/etc.) account is registered to the client's business, not the developer's — money should never flow through a developer-owned account for a client's store
- [ ] Source code repository is transferred to (or already lives in) the client's organization/account, with the client as an owner, not just a collaborator
- [ ] Domain/SSL, DNS, transactional email sending, and analytics accounts are all listed with clear ownership
- [ ] All API keys and third-party service accounts (email provider, SMS, maps, etc.) are under the client's ownership or clearly documented as needing transfer

### Documentation
- [ ] A README (or equivalent) explains how to run the project locally and how to deploy it
- [ ] Environment variables are documented — what each one is for, and where to get/set real values (without committing actual secrets)
- [ ] Architecture/tech stack is summarized somewhere a new developer could read in under an hour, not just inferable from the code
- [ ] Admin/back-office usage is documented for non-technical staff (how to add a product, process a refund, view orders)
- [ ] Known limitations or intentionally-deferred work are written down explicitly, not left to be "discovered" later

### Security Hygiene Before Handoff
- [ ] Developer-only debug routes, test endpoints, or admin backdoors created during development are removed or properly access-controlled
- [ ] Test/sample data (fake products, test orders, seeded admin accounts with default passwords) is cleared out of production
- [ ] Any hardcoded developer credentials or personal API keys used "just to get it working" are replaced with the client's own
- [ ] Access is revoked or transitioned appropriately if the working relationship is ending (developer accounts, temporary contractor access)

### Scope & Contract Completeness
- [ ] Every feature listed in the original scope/proposal is present and was verified via `functional-qa`, not just assumed done
- [ ] Any agreed-upon changes or descoped items during the project are documented, so there's no dispute about what was promised vs. delivered
- [ ] Deliverables outside the code itself (brand assets, content, exported data) are actually handed over, not left in the developer's local files

### Support & Continuity
- [ ] It's clear, in writing, what happens after handoff: is there a warranty period, a support retainer, or is this a clean handoff with no further obligation?
- [ ] The client knows who to contact (or what process to follow) if something breaks, especially in the first weeks after launch
- [ ] Monitoring/error alerts (from `production-readiness`) are routed somewhere the client — or their ongoing support provider — will actually see them, not just to the original developer's personal inbox

## Common Issues in "Vibe Coded" Handoffs

- **Everything running under the developer's personal accounts**: hosting, domain, payment processor, and even the database are all tied to the developer, with no plan to transfer them — the client discovers this only when something needs changing and they have no access
- **No documentation because the developer "just knows" how it works**: fine until the developer is unavailable, at which point the client has a black box
- **Debug/test artifacts left in production**: seeded test accounts, a `/debug` route, or a hardcoded admin password used during development that never got removed
- **Scope drift never reconciled**: the AI-assisted build process quietly added, changed, or dropped features over many sessions, and nobody checked the final result against what was actually promised

## Reporting Format

```
## Client Handoff Readiness: <project>

### Blocking (client cannot operate or own the product as-is)
- <gap> — <risk if unresolved> — <what's needed to close it>

### Should resolve before final handoff
- ...

### Confirmed ready
- <what was verified: ownership, docs, scope, support plan>
```

## Boundaries

This skill assumes the product already passed `production-readiness` technically. It focuses entirely on ownership, documentation, and business continuity — not code quality or security, which belong to the other audit skills.
