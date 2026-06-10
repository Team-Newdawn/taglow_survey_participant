---
name: taglow-supabase-query-analysis
description: Use when analyzing Supabase query behavior, slow or long-running queries, query outliers, high call counts, sequential scans, pg_stat_statements output, EXPLAIN plans, query shape, index fit, RLS predicate cost, or Supabase CLI inspect db commands such as long-running-queries, outliers, calls, index-stats, and seq-scans.
---

# Taglow Supabase Query Analysis

Use this skill for query workload analysis. Focus on the SQL shape, frequency, latency, plan risk, and whether indexes and RLS support the path.

## Default Project

Default project ref: `tkaltosbhdzkuazslhtp`.

If the repo is not linked, run:

```sh
supabase link --project-ref tkaltosbhdzkuazslhtp
```

Do not print secrets or raw personally identifying survey answer content.

## Baseline Commands

```sh
supabase --version
supabase inspect db long-running-queries --linked --output-format json
supabase inspect db outliers --linked --output-format json
supabase inspect db calls --linked --output-format json
supabase inspect db index-stats --linked --output-format json
```

Use deprecated commands only when requested or useful for compatibility:

```sh
supabase inspect db seq-scans --linked --output-format json
supabase inspect db unused-indexes --linked --output-format json
```

For a specific SQL path, also inspect local source with `rg` and request or run an `EXPLAIN (ANALYZE, BUFFERS)` only when safe for the environment.

## Hot Paths To Check

- Public survey load by slug.
- Auth/session and duplicate submission guard.
- Submission RPC or response insert plus answers bulk insert.
- Signed asset URL generation and asset metadata reads.
- Admin analytics output, if included in the task.

## How To Judge

- **Long-running active query**: high severity if it blocks writes, consumes resources, or touches participant hot paths.
- **Outlier by total time**: optimize first when high total time combines with frequent calls.
- **Outlier by mean time**: check plan, rows scanned, stale statistics, missing index, or expensive RLS.
- **High call count**: look for N+1 app behavior, unstable TanStack Query keys, or missing bundled reads.
- **Sequential scan**: acceptable for small tables; risky for large tables or auth/RLS filters.
- **Unused index**: confirm it is not a constraint, unique index, recent migration, or low-traffic but necessary path before removal.

## Report Format

```text
Query Snapshot
- Project ref:
- CLI version:
- Commands:

Top Query Risks
- [HIGH|MEDIUM|LOW] title
  Evidence:
  Likely cause:
  App path:
  Recommendation:

Next EXPLAIN Targets
- Query/path:
- Why:
```

## Taglow Constraints

- Prefer bundled reads for survey structure and transactional RPC for multi-table submission.
- Recommend stable query keys and explicit `staleTime`/`gcTime` when client refetch behavior drives DB load.
- Never recommend exposing raw table shapes to views to solve performance issues.
