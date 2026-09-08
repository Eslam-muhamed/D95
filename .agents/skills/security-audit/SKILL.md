---
name: security-audit
description: Perform a security audit of application code, looking for vulnerabilities such as injection flaws, broken authentication/authorization, exposed secrets, insecure data handling, and missing security headers. Use this whenever the user asks to "check for security issues", "audit security", or "is this safe to ship", before handling payments, user accounts, or personal data, and always before production-readiness sign-off. Treat this as mandatory — not optional — for any code that touches authentication, payment, personal data, or admin functionality, since these are exactly the areas where AI-generated code tends to quietly cut corners.
---

# Security Audit

## Purpose

Find exploitable weaknesses before an attacker does. This is not a style review — every finding here should be evaluated on "can this be exploited, and what happens if it is."

## When to Use This Skill

- Before shipping any code that touches authentication, sessions, payments, personal data, or admin/privileged actions
- When the user asks "is this secure?", "check for vulnerabilities", or "audit this for security"
- As a mandatory gate before `production-readiness` sign-off
- After any dependency upgrade or new third-party integration (payment gateway, email provider, analytics)

## Process

1. **Map the attack surface**: list every place untrusted input enters the system — form fields, URL params, query strings, headers, cookies, file uploads, webhooks, third-party callbacks.
2. **Trace each input** from entry to where it's used (rendered, queried, executed, stored) and check it's validated/sanitized/escaped appropriately for that context.
3. **Check authentication and authorization separately** — authentication answers "who are you," authorization answers "are you allowed to do this specific thing." A user being logged in does not mean they're allowed to access another user's order.
4. **Search for secrets** committed to the repo, hardcoded in source, or logged in plaintext.
5. **Check dependencies** for known vulnerabilities.
6. **Classify and report** using the severity guide below — don't bury a critical finding in a wall of low-severity nitpicks.

## Checklist

### Input Validation & Injection
- [ ] All user input is validated server-side (client-side validation is UX only, never a security boundary)
- [ ] Database queries use parameterized queries/prepared statements — never string-concatenated SQL
- [ ] User-supplied content rendered in HTML is escaped (XSS) — check any `dangerouslySetInnerHTML`, `v-html`, `innerHTML`, or raw template interpolation
- [ ] File uploads validate type, size, and content — not just the filename extension
- [ ] No use of `eval()`, dynamic `require()`/`import()`, or shell commands built from user input

### Authentication
- [ ] Passwords are hashed with a modern algorithm (bcrypt/argon2/scrypt) — never stored in plaintext or reversibly encrypted
- [ ] Session tokens/JWTs are generated with sufficient entropy and expire appropriately
- [ ] Login endpoints are rate-limited against brute force and credential stuffing
- [ ] Password reset flows use single-use, time-limited tokens — not predictable values
- [ ] No way to enumerate valid accounts via different error messages on login/reset ("email not found" vs "wrong password")

### Authorization
- [ ] Every endpoint checks that the authenticated user is allowed to access *that specific resource* (no IDOR — e.g., `/api/orders/123` must verify order 123 belongs to the requester)
- [ ] Admin/privileged routes check role/permission server-side, not just hide the UI button client-side
- [ ] Object references (order IDs, user IDs) aren't guessable/sequential where that matters, or are properly access-checked regardless

### Secrets & Configuration
- [ ] No API keys, DB credentials, or tokens committed to the repository (check `.env` is gitignored, check git history if unsure)
- [ ] Secrets are loaded from environment variables or a secrets manager, never hardcoded
- [ ] Different secrets for dev/staging/production — a leaked dev key shouldn't compromise production
- [ ] Third-party API keys use the minimum required scope/permissions

### Payments & Sensitive Data (e-commerce specific)
- [ ] Raw card numbers are never handled, logged, or stored directly — use a PCI-compliant processor (Stripe, Braintree, etc.) and their tokenization/hosted fields
- [ ] Payment webhook endpoints verify the signature from the provider before trusting the payload
- [ ] Personal data (addresses, phone numbers, order history) is only exposed to the account it belongs to and to authorized staff
- [ ] Sensitive data is encrypted at rest where required by policy/regulation

### Session & Transport Security
- [ ] Cookies used for sessions are `HttpOnly`, `Secure`, and `SameSite=Lax` or `Strict`
- [ ] All traffic is served over HTTPS, with HTTP redirecting to HTTPS
- [ ] CSRF protection on state-changing requests (forms, non-GET API calls) that rely on cookie auth
- [ ] Security headers are set: `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors`, `Strict-Transport-Security`

### Dependencies
- [ ] Run the ecosystem's audit tool (e.g. `npm audit`) and review high/critical findings
- [ ] No abandoned/unmaintained packages handling anything security-sensitive
- [ ] Lockfile committed so builds are reproducible

### Logging & Monitoring
- [ ] Logs never contain passwords, tokens, full card numbers, or other sensitive fields
- [ ] Failed auth attempts and suspicious activity (rapid checkout attempts, repeated failed payments) are logged for review

## Severity Guide

| Severity | Meaning | Example |
|---|---|---|
| **Critical** | Remotely exploitable, no auth required, high impact | SQL injection on the search endpoint; anyone can view any user's orders by changing an ID |
| **High** | Exploitable with some precondition, or high impact if triggered | Missing CSRF protection on the "change email" form; API key with excessive permissions |
| **Medium** | Real weakness, limited impact or hard to exploit | Verbose error messages leaking stack traces; missing rate limiting on a low-value endpoint |
| **Low** | Best-practice gap, minimal practical risk | Missing a non-critical security header |

## Common Issues in AI-Generated ("Vibe Coded") Code

- **Client-side-only validation**: AI-generated forms often validate nicely in the browser but skip server-side validation entirely, assuming the client is trustworthy
- **Missing authorization checks**: generated CRUD endpoints frequently check *authentication* ("is someone logged in") but forget *authorization* ("is this specific user allowed to touch this specific record")
- **Copy-pasted auth patterns applied inconsistently**: one endpoint gets a proper permission check, a similar endpoint added later doesn't
- **Secrets in example code**: generated example `.env` values or config sometimes end up committed verbatim
- **Trusting webhook payloads**: generated webhook handlers often process the payload without verifying the provider's signature first

## Reporting Format

```
## Security Audit: <scope>

### Critical
- [file:line] <vulnerability> — <exploit scenario> — <fix>

### High / Medium / Low
- ...

### Verified safe
- <call out areas you specifically checked and found solid, so it's clear they weren't just skipped>
```

## Boundaries

This skill covers application-level security. It does not cover infrastructure/network security (firewalls, VPC config), penetration testing, or formal compliance certification (PCI-DSS, SOC 2) — flag when those are needed but treat them as out of scope for this checklist. For database-specific integrity/access concerns, pair this with `database-review`.
