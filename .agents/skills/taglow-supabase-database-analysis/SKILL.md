---
name: taglow-supabase-database-analysis
description: Use when analyzing Taglow Supabase database health, storage growth, table/index size, bloat, vacuum health, locks, blocking sessions, schema-level database risk, or running Supabase CLI inspect db health commands such as db-stats, table-stats, bloat, locks, blocking, index-stats, and unused-indexes.
---

# Taglow Supabase Database Analysis

Use this skill for database-level health checks. Keep it separate from query, API, network, and overall performance synthesis unless the user asks for a combined review.

## Default Project

Default project ref: `tkaltosbhdzkuazslhtp`.

If the repo is not linked, run:

```sh
supabase link --project-ref tkaltosbhdzkuazslhtp
```

Do not print secrets, access tokens, refresh tokens, database passwords, or full connection strings.

## Baseline Commands

Prefer JSON when the CLI supports it so findings are easy to compare:

```sh
supabase --version
supabase inspect db db-stats --linked --output-format json
supabase inspect db table-stats --linked --output-format json
supabase inspect db index-stats --linked --output-format json
supabase inspect db bloat --linked --output-format json
supabase inspect db vacuum-stats --linked --output-format json
supabase inspect db locks --linked --output-format json
supabase inspect db blocking --linked --output-format json
```

Also run deprecated commands when the user explicitly asks or when comparing older reports:

```sh
supabase inspect db unused-indexes --linked --output-format json
```

## How To Judge

- **Blocking**: any active blocker on participant submission, public survey read, auth guard, or asset fetch paths is high severity.
- **Bloat**: prioritize large bloated tables or indexes over tiny relations with high percentages.
- **Vacuum**: stale `last_autovacuum`, high dead tuples, or frozen XID risk needs action before adding write-heavy features.
- **Indexes**: treat unused indexes as candidates, not automatic removals. Check uniqueness, constraints, foreign keys, RLS predicates, and recent traffic first.
- **Table growth**: watch `responses`, `answers`, assets, auth-related tables, and any analytics tables used by admin output.
- **Locks**: distinguish short maintenance locks from recurring app-path contention.

## Report Format

Return in the user's language:

```text
Database Snapshot
- Project ref:
- CLI version:
- Commands:

Findings
- [HIGH|MEDIUM|LOW] title
  Evidence:
  Impact:
  Recommendation:

Deferred Checks
- Anything not verified, such as missing staging traffic, missing EXPLAIN plan, or deprecated command limitations.
```

## Taglow Constraints

- Keep participant storage analytics-friendly: stable values, scores, topic keys, space keys, and image ratios.
- Do not recommend denormalization unless it reduces a verified hot-path cost and preserves analytics correctness.
- Any schema/index/RLS recommendation must respect the participant API boundary and RLS invariants in `AGENTS.md`.
