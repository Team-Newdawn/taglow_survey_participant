---
name: taglow-supabase-network-analysis
description: Use when analyzing Supabase network and connection behavior for Taglow, including connection pressure, traffic profile, pooling, latency symptoms, replication slots, role connection usage, Storage signed URL network cost, retry/refetch loops, and Supabase CLI inspect db commands such as traffic-profile, role-stats, replication-slots, locks, and blocking.
---

# Taglow Supabase Network Analysis

Use this skill for network, connection, and traffic-shape analysis. Keep findings focused on request volume, connection pressure, pooling, retries, and transfer cost.

## Default Project

Default project ref: `tkaltosbhdzkuazslhtp`.

If the repo is not linked:

```sh
supabase link --project-ref tkaltosbhdzkuazslhtp
```

Do not print pooler URLs, database passwords, JWTs, cookies, API keys, or full signed URLs.

## Baseline Commands

```sh
supabase --version
supabase inspect db traffic-profile --linked --output-format json
supabase inspect db role-stats --linked --output-format json
supabase inspect db replication-slots --linked --output-format json
supabase inspect db locks --linked --output-format json
supabase inspect db blocking --linked --output-format json
```

Use deprecated role connection commands only when requested:

```sh
supabase inspect db role-connections --linked --output-format json
```

## App-Side Inspection

Search for retry, polling, refetch, signed URL, and upload behavior:

```sh
rg "refetchInterval|retry:|staleTime|gcTime|createSignedAssetUrl|upload|signed" src
```

For browser-visible symptoms, inspect network waterfall only through redacted summaries: endpoint type, count, duration, payload size, and cache behavior.

## How To Judge

- **Connection pressure**: high active connections, long idle-in-transaction sessions, or blocked roles are high risk.
- **Traffic profile**: many small repeated reads usually means missing bundling or unstable query keys.
- **Storage**: repeated signed URL calls or image uploads can dominate mobile performance even when DB queries are fine.
- **Replication slots**: inactive slots retaining WAL are a database and network storage risk.
- **Retries/refetches**: flag loops caused by auth state churn, unstable query keys, focus refetch, or missing cache windows.

## Report Format

```text
Network Snapshot
- Project ref:
- Commands:
- App files inspected:

Findings
- [HIGH|MEDIUM|LOW] title
  Evidence:
  Impact:
  Recommendation:

Traffic Shape
- Request source:
- Count/frequency:
- Payload or transfer concern:
- Cache/batch opportunity:
```

## Taglow Constraints

- Mobile-first participant flow means latency and repeated requests matter as product quality.
- Batch signed URL/status requests when possible.
- Prefer one public survey bundle over dependent request chains.
- Keep sensitive URLs and auth material redacted in all summaries.
