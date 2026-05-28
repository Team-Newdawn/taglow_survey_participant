# src/api/participant/service/gateway Guide

This directory owns external IO for participant APIs.

## Expected Files

- `participantApiGateway.ts`
- `supabaseParticipantApiGateway.ts`
- `httpParticipantApiGateway.ts`
- `apiErrors.ts`

## Responsibilities

- Define the `ParticipantApiGateway` interface.
- Provide session/auth IO: `getSession`, `signInWithGoogle`, and `signOut`.
- Fetch published public survey bundles by public slug from `surveys`, `survey_sections`, `questions`, and `survey_assets`; prefer one embedded PostgREST select so the View receives an HTTP-API-like bundle.
- Check duplicate submission status.
- Create one `responses` row and many `answers` rows. Call optional `submitSurveyResponse` only when the DB/server actually exposes it.
- Create signed asset URLs for private storage assets.
- Upload participant-provided question images through Storage under policy-compatible paths.
- Normalize Supabase/HTTP failures into routeable participant API errors.

## Gateway Contract

Keep the TDD v2 contract in mind:

```ts
getSession(): Promise<RawSession | null>;
signInWithGoogle(redirectTo: string): Promise<void>;
signOut(): Promise<void>;
fetchPublicSurveyBySlug(publicSlug: string): Promise<RawPublicSurveyBundle>;
checkDuplicateSubmission(args): Promise<RawDuplicateSubmissionResult>;
createResponse(payload): Promise<RawResponse>;
createAnswers(payloads): Promise<RawAnswer[]>;
submitSurveyResponse?(payload): Promise<RawSubmitSurveyResult>;
createSignedAssetUrl(args): Promise<string>;
uploadQuestionImage(command): Promise<RawParticipantQuestionImageUpload>;
```

## Rules

- Supabase SDK and raw database rows are allowed here.
- Do not export raw rows to views or query hooks.
- Do not delete drafts here; draft cleanup belongs to mutation success handling.
- Keep HTTP gateway parity with the Supabase gateway contract.
- The current Supabase participant RLS does not allow client-side response updates, so if answers bulk insert fails after response creation, route a recoverable submission failure instead of trying to mark the response as discarded in browser code.
- Map unique submitted-response violations to `ALREADY_SUBMITTED`.
