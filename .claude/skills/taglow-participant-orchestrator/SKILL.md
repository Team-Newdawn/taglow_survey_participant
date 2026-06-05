---
name: taglow-participant-orchestrator
description: Coordinate implementation of the Taglow Survey participant view from PRD/TDD. Use when a task spans multiple participant areas, asks for implementation planning, phase sequencing, or coordinating API boundary, auth/routing, survey rendering, draft cache, image tagging, submission, UX copy, and tests.
---

# Taglow Participant Orchestrator

Use this as the entry skill for broad Taglow Survey participant work. Keep the PRD/TDD as source of truth and route focused implementation to the narrower skills.

## Read first

Open these files before planning or editing:

- `dev/Taglow_Survey_Participant_PRD.md`
- `dev/Taglow_survey_Participant_TDD_v2.md`

`dev/Taglow_survey_Participant_TDD_v2.md` supersedes the older participant TDD. Use the older file only as historical context if v2 is silent.

If the codebase exists, inspect `src/`, `package.json`, test setup, Supabase config, and existing route/provider patterns before proposing new structure.

## Phase order

Follow the TDD v2 phase order unless the user narrows the request:

1. Public Survey Read: gateway, mapper, public slug bundle, sections/questions/assets, locale rendering.
2. Auth / Access: Supabase Google Auth, `@handong.ac.kr`, access denied/closed/not-found, duplicate submission query.
3. Survey Rendering: QuestionRenderer, question components, section navigation, validation.
4. Draft Cache: localStorage draft key, 5-10s debounce, visibility/beforeunload save, restore banner, submit-success delete.
5. Submission: response insert plus answers bulk insert or `submit_survey_response` RPC, unique violation handling, complete page.
6. Hardening: signed asset URLs, RLS staging tests, E2E tests, edge cases.

## Dispatch map

Use the specific skill that matches the main edit surface:

| Work area | Skill |
| --- | --- |
| Cross-cutting plan or phase sequencing | `taglow-participant-orchestrator` |
| Domain models, gateways, controller, mapper, RLS | `taglow-participant-api-boundary` |
| Routes, OAuth, `@handong.ac.kr`, duplicate guard | `taglow-participant-auth-routing` |
| Sections, progress, locale text, question components | `taglow-participant-survey-renderer` |
| Zod schemas, branch rules, answer normalization | `taglow-participant-answer-validation` |
| localStorage/IndexedDB draft autosave and restore | `taglow-participant-draft-cache` |
| Image/floorplan tagging and coordinate persistence | `taglow-participant-image-tagging` |
| Vitest/RTL/Playwright fixtures and coverage | `taglow-participant-testing` |
| Mobile UX, accessibility, Korean/English microcopy | `taglow-participant-ux-copy` |

## Sub-agent routing

When a `spawn_agent` capability is available and the task is broad enough to benefit from an independent pass, use these agents:

- `taglow-participant-architect`: architecture plan or boundary review before large implementation.
- `taglow-participant-ux-auditor`: mobile survey UX, accessibility, and copy review.
- `taglow-participant-qa-auditor`: test plan, coverage review, and regression checklist.

Pass only the user request, target files, and PRD/TDD paths. Do not pass your intended answer as ground truth.

## Non-negotiables

- Views must not import Supabase SDK or raw database rows.
- Query and mutation hooks call `ParticipantApiController`, not gateways directly.
- `ParticipantApiGateway` is replaceable: Supabase now, HTTP later.
- Drafts stay client-side until final submit; delete only after successful submit.
- Drafts must not store service role keys, raw access tokens, raw refresh tokens, or unnecessary long-lived personal raw payloads.
- Final submit creates one `responses` row and many `answers` rows.
- Image tagging stores `x_ratio` and `y_ratio` in the inclusive `0..1` range.
- Email domain checks happen in UI flow and API/RLS or server boundary.
- Duplicate submitted response per `(survey_id, participant_user_id)` is blocked.
- Already submitted users route to `/survey/:publicSlug/already-submitted`.
- Locale affects rendered text; answers are stored as language-independent values.

## Working loop

1. Identify which PRD/TDD sections govern the task.
2. Inspect current files and patterns before choosing implementation details.
3. Use the narrowest relevant skill and keep edits scoped.
4. Add focused tests for the touched layer and at least one behavior-level regression when user-facing flow changes.
5. Verify the boundary rules in "Non-negotiables" before handoff.
