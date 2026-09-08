---
name: database-review
description: Review database schema design, queries, migrations, and data integrity — checking for missing indexes, N+1 queries, unsafe migrations, missing constraints, and improper transaction boundaries. Use this whenever the user adds or changes a database schema, writes a new query or migration, or mentions "slow query" or "database design", and always before any migration is run against production data, since these changes are often irreversible.
---

# Database Review

## Purpose

Catch schema and query problems while they're still cheap to fix — before they cause a production outage, data loss, or a performance cliff that only shows up at scale.

## When to Use This Skill

- Any new table, column, or schema change
- Any new or modified query, especially ones running in a loop or a hot path (checkout, product listing, search)
- Before running any migration against real data, especially destructive ones (drop column, drop table, change column type)
- When the user mentions slow pages, timeouts, or "why is this query slow"
- As input into `performance-audit` and `production-readiness`

## Process

1. **Understand access patterns first**: how will this data be queried, how often, and at what scale? Schema decisions should follow from how the data is actually read and written, not just how it's conceptually modeled.
2. **Review the schema**: data types, nullability, constraints, relationships.
3. **Review queries** generated against that schema for N+1 patterns, missing indexes, and unnecessary data fetched.
4. **Review migrations** for reversibility and safety against a live, populated database — not just against a fresh empty one.
5. **Check transaction boundaries** for any multi-step write (e.g., create order + decrement stock + record payment must succeed or fail together).
6. **Flag anything destructive or hard to reverse** as a blocking finding, not a suggestion.

## Checklist

### Schema Design
- [ ] Data types match the data (don't store money as floating point; use integer cents or a decimal type)
- [ ] Columns that shouldn't be empty are `NOT NULL`
- [ ] Foreign keys are declared (not just implied by naming convention) so the database enforces referential integrity
- [ ] Unique constraints exist where duplicates would be a bug (email, SKU, order number)
- [ ] Enums/status fields use a constrained type or check constraint, not a free-text column that can drift

### Indexes
- [ ] Foreign key columns are indexed
- [ ] Columns used in `WHERE`, `JOIN`, and `ORDER BY` on frequently-run queries are indexed
- [ ] Composite indexes match the actual query patterns (column order matters)
- [ ] No redundant or unused indexes bloating write performance for no read benefit

### Query Patterns
- [ ] No N+1 queries — check anywhere a list is fetched and then looped over to fetch related data one row at a time; use joins, includes/eager-loading, or batched queries instead
- [ ] Queries fetch only the columns/rows needed (specific columns over `SELECT *` on wide tables, pagination on large lists)
- [ ] Pagination is implemented correctly (stable ordering, no duplicate/skipped rows across pages)
- [ ] Full table scans on large tables are avoided or explicitly justified

### Migrations
- [ ] Migrations are reversible, or the irreversibility is explicit and intentional
- [ ] Adding a `NOT NULL` column to an existing populated table includes a default or backfill step — it won't just fail against real data
- [ ] Renaming/dropping a column or table is checked against all code (and any external consumers) still referencing the old name first
- [ ] Large migrations on big tables consider locking behavior — an `ALTER TABLE` that locks a busy table can cause an outage, not just a slow deploy
- [ ] Migrations have been tested against a copy of realistic data volume, not just an empty dev database

### Transactions & Integrity
- [ ] Multi-step writes that must succeed or fail together are wrapped in a transaction (e.g., payment recorded + stock decremented + order created)
- [ ] Race conditions on shared counters (stock quantity, coupon usage count) are handled with proper locking or atomic updates, not read-then-write
- [ ] Idempotency is considered for operations that might be retried (payment webhooks, order creation)

### Sensitive Data
- [ ] Passwords are hashed, never stored in plaintext (cross-check with `security-audit`)
- [ ] PII that needs encryption at rest is encrypted, per policy/regulatory requirement
- [ ] Backups exist and have actually been tested for restore, not just configured

## Common Issues in AI-Generated ("Vibe Coded") Database Code

- **N+1 queries hidden behind clean-looking code**: an ORM call inside a loop or `.map()` looks innocent but issues one query per row
- **Missing indexes on new foreign keys**: generated migrations often create the relationship but skip the index that makes it performant
- **Non-atomic "read, modify, write" for counters**: e.g., reading stock count, checking it in application code, then writing a new value — this races under concurrent load, and generated code frequently does this instead of an atomic decrement
- **Migrations that work on an empty dev database but break on production data**: adding a `NOT NULL` column without a default, assuming the table is empty
- **Money stored as floating point**, causing rounding errors in totals

## Reporting Format

```
## Database Review: <scope>

### Blocking (data loss / outage risk)
- <migration or query> — <what could go wrong> — <safe alternative>

### Performance concerns
- <query/index issue> — <expected impact at scale> — <fix>

### Suggestions
- ...
```

## Boundaries

This skill covers schema, query, and migration correctness/safety. For query-level performance tuning at scale (caching strategy, read replicas, sharding), pair with `performance-audit`. For access-control on data (who can query what), pair with `security-audit`.
