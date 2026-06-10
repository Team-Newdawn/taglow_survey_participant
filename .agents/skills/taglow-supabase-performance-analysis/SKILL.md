---
name: taglow-supabase-performance-analysis
description: Use when producing an overall Supabase performance assessment for Taglow across database health, slow queries, API boundary, network round trips, cache behavior, RLS/index cost, payload size, submission transaction shape, and participant hot-path scalability.
---

# Taglow Supabase Performance Analysis

Use this skill for synthesis across Database, Query, API, and Network findings. For deep work in one area, load the matching focused skill first.

## Default Project

Default project ref: `tkaltosbhdzkuazslhtp`.

If live inspection is needed and the repo is not linked:

```sh
supabase link --project-ref tkaltosbhdzkuazslhtp
```

Do not print secrets, tokens, database passwords, pooler URLs, raw answer content, or full signed URLs.

## Minimal Live Baseline

Run only what is needed for the user's scope. For a broad performance pass:

```sh
supabase --version
supabase inspect db long-running-queries --linked --output-format json
supabase inspect db outliers --linked --output-format json
supabase inspect db calls --linked --output-format json
supabase inspect db index-stats --linked --output-format json
supabase inspect db table-stats --linked --output-format json
supabase inspect db bloat --linked --output-format json
supabase inspect db vacuum-stats --linked --output-format json
supabase inspect db blocking --linked --output-format json
supabase inspect db traffic-profile --linked --output-format json
supabase inspect db role-stats --linked --output-format json
```

Use deprecated checks only when requested or useful for historical comparison:

```sh
supabase inspect db unused-indexes --linked --output-format json
supabase inspect db seq-scans --linked --output-format json
```

## App Baseline

Inspect the participant hot paths:

```sh
rg "useQuery|useMutation|staleTime|gcTime|refetch|ParticipantApiController|submitSurveyResponse|createSignedAssetUrl" src
rg "from\\(|rpc\\(|storage|auth" src/api src/view src/components
```

## Synthesis Heuristics

- Prioritize user-visible participant paths: survey load, auth guard, duplicate check, section navigation, asset loading, and final submit.
- Pair each database finding with the app path that can trigger it.
- Separate root cause from symptom: a slow query may be caused by missing index, RLS cost, refetch loop, or oversized payload.
- Prefer fewer round trips, stable cache keys, batched signed URLs, and transactional submission RPCs.
- Treat high memory, high network transfer, and high DB round trips as performance bugs even if individual queries look acceptable.

## Report Format

```text
Performance Verdict
- Overall status: Healthy | Watch | At Risk | Critical
- Main bottleneck:
- Fastest safe win:

Evidence By Area
- Database:
- Query:
- API:
- Network:

Action Plan
- Priority 1:
- Priority 2:
- Priority 3:

Open Risks
- Unverified assumptions, missing load test, staging-only caveats, or deprecated command limits.
```

## Taglow Constraints

- Keep View -> Hook -> Controller -> Mapper -> Gateway dependency flow intact.
- For writes, prefer one transactional RPC when response and answers must succeed together.
- Return only columns the caller needs and avoid storing translated labels as answer values.
- Keep RLS predicates index-friendly and avoid expensive per-row helper calls on large tables.
