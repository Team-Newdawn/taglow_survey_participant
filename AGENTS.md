# Taglow Survey Participant Agent Guide

This repository implements the Taglow Survey participant view. Treat these documents as the product and technical source of truth:

- `dev/Taglow_Survey_Participant_PRD.md`
- `dev/Taglow_survey_Participant_TDD_v2.md`

`dev/Taglow_survey_Participant_TDD_v2.md` supersedes the earlier participant TDD. Use the older TDD only as historical context if v2 is silent.

Before editing under `src/`, read this file plus the nearest `AGENTS.md` in the target directory.

## Product Invariants

- Participants enter by public URL or QR, authenticate with Google, and any Google account can submit unless duplicate or survey-status guards block them.
- The participant view is mobile-first, section-based, bilingual (`ko` and `en`), and designed to reduce survey fatigue.
- Drafts are client-side only until final submission. Keep drafts separated by `survey_id + participant_user_id`.
- Drafts must never store Supabase service role keys, raw access/refresh tokens, or long-lived unnecessary personal raw payloads.
- Final submit creates one `responses` row and many `answers` rows.
- Store analytics-friendly values: stable option values, score values, topic keys, space keys, and image ratios. Do not store translated labels as answer values.
- Image or floorplan points are stored with `x_ratio` and `y_ratio` in the inclusive `0..1` range.

## Required Stack

- React + TypeScript
- React Router
- TanStack Query for server state
- Zustand for participant UI/progress state
- React Hook Form for section/question form state
- Zod for validation
- Supabase Auth/Database/Storage behind the participant API boundary
- Vitest + React Testing Library
- Playwright for E2E

## API Boundary

Keep this dependency flow:

```text
View
  -> Query / Mutation Hook
  -> ParticipantApiController
  -> ParticipantPayloadMapper
  -> SupabaseParticipantApiGateway or HttpParticipantApiGateway
  -> Supabase Database / Auth / Storage
```

Rules:

- Views and reusable components must not import Supabase SDK, gateways, raw database rows, or table names.
- Query hooks must call `ParticipantApiController`, not gateways or mappers directly.
- Gateways own external IO and raw payload shapes.
- Mappers own raw-to-domain and command-to-persistence conversions.
- Supabase SDK belongs only inside `SupabaseParticipantApiGateway` and runtime wiring that remains hidden behind the gateway/controller.
- Gateway replacement from Supabase to HTTP must not require view, hook, or controller rewrites.

## Implementation Order

Follow the TDD v2 phases unless the user narrows the task:

1. Public Survey Read: gateway, mapper, public slug bundle, sections/questions/assets, locale rendering.
2. Auth / Access: Google auth, access denied/closed/not-found, duplicate query.
3. Survey Rendering: question renderer, question components, section navigation, validation.
4. Draft Cache: draft key, localStorage, 5-10s debounce, visibility/beforeunload save, restore banner, submit-success delete.
5. Submission: response insert plus answers bulk insert or `submit_survey_response` RPC, unique violation handling, complete page.
6. Hardening: signed asset URL, RLS staging tests, E2E tests, edge cases.

## Testing Expectations

- Add unit tests for pure mappers, validators, draft storage, branch evaluation, and image ratio utilities.
- Add component tests for each question type and section navigation behavior.
- Add route tests for auth, duplicate, closed, not-found, and generic access-denied states.
- Add Playwright coverage for the full happy path and at least one draft restore or submit failure path.
- Add coverage for already-submitted routing and asset load failure.
- Add database policy checks for RLS when using Supabase local or staging.
- When changing a layer boundary, add a regression test or lint-like check that prevents Supabase imports from leaking into views.

## File Organization

Use the `src/` tree defined in the TDD. Every `src` directory has its own `AGENTS.md`; keep those files updated when responsibilities change.

<!-- omd:start v=1 hash=be71c8d154c9 -->
## Design System (oh-my-design)

**Before any UI, styling, copy, or motion change, open and read `./DESIGN.md` in full.** It is the authoritative brand/design spec. Treat its tokens, voice, and component rules as binding unless the user overrides in chat.

If present, read `./.omd/preferences.md` — pending corrections not yet folded into DESIGN.md. Apply them; flag conflicts.
<!-- omd:end -->
