# src/api/participant/query Guide

This directory owns TanStack Query hooks for participant server state.

## Expected Files

- `queryKeys.ts`
- `useParticipantSessionQuery.ts`
- `usePublicSurveyQuery.ts`
- `useSubmissionMutation.ts`
- `useDuplicateSubmissionQuery.ts`
- `useAssetUrlQuery.ts`

## Responsibilities

- Define stable participant query keys.
- Fetch public survey data through `ParticipantApiController`.
- Check duplicate submission through `ParticipantApiController`.
- Cache current participant session and signed asset URLs through `ParticipantApiController` when implemented.
- Submit survey through `ParticipantApiController`.
- Keep mutation success/failure hooks predictable for draft cleanup and retry UI.

## Rules

- Do not import gateways, mappers, or Supabase SDK.
- Do not perform React Hook Form validation here; call validated commands.
- Keep query keys aligned with TDD v2: session, public survey by slug, duplicate by survey/user, asset URL by asset id.
- Include the current auth scope in public survey query keys and wait for session hydration before fetching; Supabase RLS can hide survey rows from anonymous clients.
- `useSubmissionMutation` owns only the submit mutation. Draft cleanup should go through the participant controller/draft hook after successful submit, and route navigation stays in the page.

## Performance Rules

- Use the `taglow-performance-first` skill when adding or changing server-state hooks.
- Set `staleTime`/`gcTime` deliberately; read-mostly survey structure and signed URLs should not refetch on every route transition.
- Seed downstream query cache when a guard/access response already contains the survey bundle.
- Avoid query keys that include unstable objects or cause repeated fetches after auth/session hydration.
- Batch asset/status queries when one screen needs multiple related resources.
