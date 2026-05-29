# src/app Guide

This directory owns the React application shell and routing foundation.

## Expected Files

- `App.tsx`
- `router.tsx`
- `providers.tsx`
- `queryClient.ts`
- `routeGuards.tsx`

## Responsibilities

- Compose global providers: router, query client, participant API runtime/provider, and any app-wide UI providers.
- Define public survey routes exactly as described in the TDD unless a later product decision updates them.
- Implement route guards for survey existence/status, Google-authenticated sessions, and duplicate submission.
- Keep redirects stable for public URL and QR entry.
- Import `src/styles/global.css` once at the app entry or provider shell, never from page/component files.

## Routes

Use the TDD v2 participant route set:

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

If implementing an explicit not-found URL, route survey-not-found failures to `/survey/:publicSlug/not-found` while preserving `SurveyNotFoundPage`.

## Rules

- Do not render question UI here.
- Do not map raw Supabase rows here.
- Do not place survey business logic in routes; route guards should delegate to query/controller abstractions.
- Route guard order should be public survey -> status -> auth -> duplicate submission.
