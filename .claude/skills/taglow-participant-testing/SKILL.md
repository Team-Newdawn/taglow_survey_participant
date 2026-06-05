---
name: taglow-participant-testing
description: Create and review Taglow Survey participant tests. Use when adding Vitest, React Testing Library, Playwright, fake ParticipantApiController fixtures, mapper/controller/storage tests, auth/draft/submission E2E scenarios, mobile viewport coverage, or PRD/TDD completion checks.
---

# Taglow Participant Testing

Use this skill to turn PRD/TDD requirements into focused unit, component, and E2E coverage.

## Read first

- PRD section: `26. Test/TDD Scenarios`, plus `24. Validation` and `27. MVP Scope`.
- TDD v2 sections: `20. Test Strategy`, `21. Implementation Order`, plus sections `16-19` for duplicate prevention, security, storage image loading, and error handling.

## Test pyramid

| Layer | Primary coverage |
| --- | --- |
| Mapper | raw rows to domain, locale fallback, submit payload conversion |
| Gateway | public fetch, response insert, answers bulk insert/RPC, error normalization |
| Controller | session/auth, public survey, access check, duplicate status, asset URL, submit success/failure |
| Draft Storage | save/load/remove, corrupted draft, schema mismatch |
| Branch Evaluator | conditional visibility |
| Attention Check | expected-value validation and submit policy |
| Image Ratio | coordinate conversion and clamp |
| Query | session, public survey, duplicate, asset URL, submit mutation state |
| Component | each question type and section navigation |
| E2E | login, draft restore, final submit, mobile viewport |

## Fixtures

Prefer shared fixtures under `src/test/fixtures/` or the existing test helper location:

- published survey with multiple sections
- closed survey
- archived survey
- already submitted response
- survey with missing English text for locale fallback
- participant profile options
- low-score scale question with follow-up reasons
- image tag question with one asset
- corrupted draft payload
- valid full submission command
- asset metadata and signed URL response

Use a fake `ParticipantApiController` for view/component tests. Do not mock Supabase in view tests if the view should not know Supabase exists.

## Must-cover scenarios

- Public URL before login shows intro/login gate.
- Handong email can enter; non-Handong email cannot.
- Duplicate submitted user is blocked.
- Duplicate submitted user sees already-submitted page.
- Sections render in order and required missing questions block next.
- Scale stores `scoreValue`.
- Experience "not used" hides follow-up questions.
- Low score requires reason.
- Multi-select stores selected values and respects max.
- Ranking prevents duplicates.
- Text stores trimmed `textValue`.
- Image touch stores `xRatio`/`yRatio`.
- Draft saves after debounce, restores on re-entry, deletes after submit success, stays after submit failure.
- Draft never stores raw access/refresh tokens or service role keys.
- Valid submit creates one response and N answers.
- Unique submitted-response violation routes to already-submitted.
- Asset load failure shows retry and blocks required image submit.
- Closed survey prevents submit.

## E2E guidance

- Use Playwright mobile viewport for at least one full happy path.
- Prefer seeded sessions or auth mocks over real Google login in CI.
- Mock network failure for submit retry/draft retention.
- Verify localStorage draft key and cleanup behavior.
- After successful submit, revisit the survey and verify already-submitted page.
- Avoid brittle text-only assertions when testing bilingual fallback; assert stable labels plus rendered locale where useful.
- Add database policy tests in Supabase local/staging for non-Handong access, draft survey denial, other-user response denial, invalid answer insert, and duplicate submitted response failure.

## Review checklist

Before calling participant work done:

- No Supabase imports in view/components/query hooks.
- Core validation rules have unit tests.
- Every question type has at least one component behavior test.
- Draft failure and submit failure are tested separately.
- Image tag coordinate utility has edge tests.
- At least one test proves locale fallback.
- The final submit mapper is covered for multi-select, ranking, text, scale, image_tag, and attention_check.

## Sub-agent routing

When available, use `taglow-participant-qa-auditor` for a read-only coverage review before declaring a phase complete. Ask it to compare the touched files and tests against PRD sections 24, 26, 27 and TDD sections 19, 20, 21.
