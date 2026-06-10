---
name: taglow-supabase-api-analysis
description: Use when analyzing Taglow Supabase API behavior, ParticipantApiController and gateway contracts, PostgREST/RPC/Auth/Storage calls, payload size, request batching, API error normalization, signed URL behavior, duplicate submission checks, or whether views/hooks respect the participant API boundary.
---

# Taglow Supabase API Analysis

Use this skill for API boundary and Supabase-facing application behavior. It covers how the app calls Supabase, not only database internals.

## Default Project

Default project ref: `tkaltosbhdzkuazslhtp`.

If the repo is not linked and live inspection is needed:

```sh
supabase link --project-ref tkaltosbhdzkuazslhtp
```

Do not print API keys, bearer tokens, refresh tokens, cookies, database URLs, or full signed URLs.

## What To Inspect

Use `rg` before editing or judging code paths:

```sh
rg "ParticipantApiController|ParticipantApiGateway|SupabaseParticipantApiGateway|submitSurveyResponse|createSignedAssetUrl" src
rg "from\\(|rpc\\(|storage|auth" src/api src/view src/components
```

Boundary checks:

- Views and reusable components must not import Supabase SDK, gateways, raw database rows, or table names.
- Query hooks must call `ParticipantApiController`, not gateways or mappers directly.
- Gateways own external IO and raw payload shapes.
- Mappers own raw-to-domain and command-to-persistence conversions.

Live context commands when useful:

```sh
supabase --version
supabase inspect db calls --linked --output-format json
supabase inspect db outliers --linked --output-format json
```

Avoid `supabase status` in reports unless the user explicitly needs local service details; it can print local API keys. If it is run, summarize only non-sensitive fields.

## How To Judge

- **Round trips**: count requests for public survey load, access guard, asset URLs, draft restore, and submit.
- **Payload size**: flag broad `select("*")`, translated labels stored as answer values, raw auth payloads, or unnecessary returned rows.
- **Transactions**: prefer `submit_survey_response` RPC for response plus answers writes.
- **Errors**: normalize not found, closed, access denied, already submitted, validation, asset load, draft restore, network, and unknown errors.
- **Storage**: batch signed URL creation when many assets are loaded; never leak full signed URLs in reports unless the user asks and they are redacted.
- **Auth**: any Google account can submit unless survey status or duplicate guards block them.

## Report Format

```text
API Snapshot
- Project ref:
- Files inspected:
- Live commands:

Boundary Findings
- [HIGH|MEDIUM|LOW] title
  Evidence:
  Impact:
  Recommendation:

Call Shape
- Flow:
- Request count:
- Payload concerns:
- Batching/caching opportunity:
```

## Taglow Constraints

- Keep the dependency flow: View -> Query/Mutation Hook -> Controller -> Mapper -> Gateway -> Supabase.
- Drafts remain client-side until final submission and must not store tokens or unnecessary personal raw payloads.
- Final submit creates one `responses` row and many `answers` rows, preferably transactionally.
