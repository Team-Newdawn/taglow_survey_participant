# src/api/participant/controller Guide

This directory exposes the controller contract used by query hooks and runtime providers.

## Expected Files

- `participantApiController.ts`
- `gatewayBackedParticipantApiController.ts`
- `participantApiControllerProvider.tsx`

## Responsibilities

- Define `ParticipantApiController`.
- Implement session/auth, public survey, access check, duplicate check, asset URL, and submit use cases by orchestrating gateway and mapper modules.
- Keep participant image upload behind the controller so views never call Storage directly.
- Expose a React provider/hook only for controller access, not for business UI.
- Normalize controller-level errors for pages and mutations.

## Controller Contract

Include these v2 use cases:

```ts
getCurrentSession(): Promise<ParticipantSession | null>;
signInWithGoogle(command: SignInCommand): Promise<void>;
signOut(): Promise<void>;
getPublicSurvey(publicSlug: string): Promise<PublicSurvey>;
checkAccess(publicSlug: string): Promise<SurveyAccessResult>;
checkDuplicateSubmission(command: DuplicateSubmissionCommand): Promise<DuplicateSubmissionResult>;
getAssetUrl(asset: SurveyAsset): Promise<string>;
uploadQuestionImage(command: ParticipantQuestionImageUploadCommand): Promise<ParticipantQuestionImageUpload>;
submitSurvey(command: SubmissionCommand): Promise<SubmissionResult>;
```

## Rules

- Query hooks may depend on this directory.
- Views should not instantiate controllers directly.
- Do not import Supabase SDK here; inject a gateway from runtime.
- Keep the public contract stable when changing gateway internals.
- Controller should hide whether submit uses response+answers inserts or `submit_survey_response` RPC.
