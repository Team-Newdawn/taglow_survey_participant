---
name: taglow-participant-auth-routing
description: Implement Taglow Survey participant routing and access control. Use when working on public survey routes, survey status guards, Supabase Google OAuth, login return URLs, `@handong.ac.kr` checks, duplicate-submission prevention, access-denied/closed/not-found pages, or auth-related tests.
---

# Taglow Participant Auth Routing

Use this skill for the public survey entry flow and participant access control.

## Read first

- PRD sections: `4. Participant Flow`, `5. Login and Access Control`, `7. Start Screen`, `24. Validation`, `26. Auth Tests`.
- TDD v2 sections: `5. Routing`, `10. Participant Controller Use Cases`, `16. Duplicate Prevention`, `17. Access Control and Security`, `19. Error Handling`, `20. Test Strategy`.

## Routes

Implement or preserve the TDD route model:

```text
/survey/:publicSlug
/survey/:publicSlug/login
/survey/:publicSlug/intro
/survey/:publicSlug/sections/:sectionKey
/survey/:publicSlug/review
/survey/:publicSlug/complete
/survey/:publicSlug/closed
/survey/:publicSlug/already-submitted
/survey/:publicSlug/access-denied
```

Route redirects may vary by framework, but URLs should remain stable enough for QR/public-link use.

## Guard order

Apply guards in this order so failures route to the right screen:

1. `RequirePublicSurvey`: public slug exists.
2. `RequirePublishedSurvey`: survey status is `published`; `closed` or `archived` routes to closed.
3. `RequireParticipantAuth`: Supabase session exists for intro and later routes.
4. `RequireHandongEmail`: session email ends with `@handong.ac.kr`.
5. `PreventDuplicateSubmission`: submitted user routes to already-submitted.

Keep duplicate-submission checks out of purely public/not-found paths until user identity is known.

## Auth flow

1. Public URL loads survey status and intro/login gate.
2. Login page starts Supabase Google OAuth with a return target for the same public slug.
3. After callback/session hydration, validate email domain.
4. If valid, check duplicate submission.
5. If already submitted, route to `/survey/:publicSlug/already-submitted`; otherwise route to intro or restore prompt, then sections.

## Domain validation

- Implement `authDomain.ts` or equivalent pure utility for `isAllowedParticipantEmail(email)`.
- Treat email comparison as case-insensitive.
- Allow only the exact domain suffix `@handong.ac.kr`.
- Repeat validation at API/RLS/server boundary; UI validation is not sufficient.

## Error pages and copy

- `SurveyNotFoundPage`: slug missing or inaccessible.
- `SurveyClosedPage`: survey exists but not published/respondable.
- `AccessDeniedPage`: non-Handong account.
- `AlreadySubmittedPage`: duplicate submitted state.

Use participant-friendly language. For Korean, prefer:

```text
이 설문은 한동대학교 계정(@handong.ac.kr)으로만 참여할 수 있습니다.
학교 Google 계정으로 다시 로그인해주세요.
```

## Tests to add

- Unauthenticated URL shows survey intro/login CTA.
- `@handong.ac.kr` user can continue.
- Non-Handong Google account sees access denied.
- Existing submitted user is blocked.
- Existing submitted user sees already-submitted route/page.
- OAuth return preserves the original public slug.
- Query hooks/controllers are mocked in route tests; do not import Supabase in view tests.
