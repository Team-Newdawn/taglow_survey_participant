---
name: taglow-performance-first
description: Use whenever working on Taglow API, Supabase, database migrations, query hooks, gateways, controllers, payload mappers, storage signed URLs, RPCs, Edge Functions, RLS, indexes, or data-access code. Prioritizes memory efficiency, network efficiency, normalized database design, query performance, API batching/caching, and scalable behavior before implementation.
---

# Taglow Performance First

## Core Rule

For API or DB work, treat performance as a product invariant, not a cleanup task. Before editing, identify the hot path, expected row counts, payload size, network round trips, memory pressure, and RLS/index implications.

## Workflow

1. **Map the path**
   - Count client calls and DB queries for the user action.
   - Mark burst paths: login/access guard, public survey load, submit, signed URLs, uploads, analysis dashboards.
   - Prefer one transactional RPC for multi-table writes and one bundled read for repeated dependent reads.

2. **Shape the data**
   - Return only columns the caller needs.
   - Avoid returning inserted bulk rows unless the UI actually uses them.
   - Keep stable domain values in normalized columns; use JSON only for flexible extras.
   - Do not duplicate translated labels or large raw payloads unless required by the product.

3. **Reduce network work**
   - Batch requests for Storage signed URLs, dependent lookups, and repeated status checks.
   - Use TanStack Query `staleTime`/`gcTime` deliberately for read-mostly data.
   - Avoid refetch loops caused by unstable query keys or auth scope changes.
   - Prefer cache seeding when one API response already contains data a later view needs.

4. **Protect database performance**
   - Check indexes for every filter/join/order path used by new queries.
   - Keep RLS predicates index-friendly and avoid expensive per-row helper calls on large tables.
   - Prefer `security invoker` functions unless privilege elevation is explicitly required.
   - For `security definer`, use private schemas where possible and lock `search_path`.

5. **Validate**
   - Add tests proving the optimized path is used, not only that output is correct.
   - Run type checks and relevant tests.
   - For SQL, verify live/staging behavior with realistic auth claims when available.
   - Report residual risks such as missing load tests, bundle warnings, or unverified index plans.

## Decision Heuristics

- **RPC**: use for transaction boundaries, multi-table writes, access checks that combine auth + survey status + duplicate status, and aggregated analysis.
- **Edge Function**: use for server-side secrets, external APIs, cross-service orchestration, CDN/cache-control, webhook-style entrypoints, or work that should not expose table structure to clients.
- **Direct PostgREST/Supabase call**: acceptable for simple single-table reads/writes with small payloads, clear RLS, and no transactional coupling.
- **Client cache only**: acceptable for stable read-mostly survey structure, signed URLs within expiry, and route guards that can seed downstream queries.

## Sub-Agent Review

When the task is broad, performance-sensitive, or changes API/DB contracts, use a sub-agent if available. Ask it for a read-only review with this prompt:

```text
Review this Taglow API/DB change for memory use, network round trips, DB normalization, query/index/RLS performance, payload size, cache behavior, and API batching opportunities. Return only actionable findings with file/line or SQL references.
```

If no sub-agent tool is available, do the same review yourself before finalizing.
