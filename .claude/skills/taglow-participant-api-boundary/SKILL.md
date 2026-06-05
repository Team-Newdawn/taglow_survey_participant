---
name: taglow-participant-api-boundary
description: Implement Taglow Survey participant API boundary code. Use when working on participant domain models, ParticipantApiController, ParticipantApiGateway, Supabase or HTTP gateways, payload mappers, response/answer persistence, RLS, duplicate submission constraints, or API error normalization.
---

# Taglow Participant API Boundary

Use this skill for the participant data layer. The participant view must remain insulated from Supabase details and raw database row shapes.

## Read first

- TDD v2 sections: `6. Database`, `7. Domain Model`, `8. Participant API Gateway Interface`, `9. Payload Mapper`, `10. Participant Controller Use Cases`, `11. Query Key`, `15. Submission Payload`, `16. Duplicate Prevention`, `17. Access Control and Security`, `18. Storage Image Loading`, `19. Error Handling`.
- PRD sections: `22. Data Storage`, `23. Admin Output Mapping`, `24. Validation`.

## Target structure

Prefer the TDD structure unless the repo already established a compatible pattern:

```text
src/api/participant/
  model/
  service/gateway/
  service/mapper/
  service/validation/
  controller/
  query/
  runtime/
```

## Boundary rules

- Domain model files expose camelCase participant concepts: `ParticipantSession`, `LocalizedText`, `PublicSurvey`, `PublicSurveySection`, `PublicQuestion`, `SurveyAsset`, `AnswerDraft`, `SubmissionCommand`.
- Gateway files own raw Supabase/HTTP payloads and table names.
- Mapper files convert raw rows to domain models and commands to persistence payloads.
- Controller files orchestrate gateway calls, mapper calls, duplicate checks, and error normalization.
- Query hooks call only the controller from runtime/provider context.
- View/components must never import Supabase clients, table row types, or gateways.

## Gateway contract

Keep this TDD v2 shape stable:

```ts
export interface ParticipantApiGateway {
  getSession(): Promise<RawSession | null>;
  signInWithGoogle(redirectTo: string): Promise<void>;
  signOut(): Promise<void>;
  fetchPublicSurveyBySlug(publicSlug: string): Promise<RawPublicSurveyBundle>;
  checkDuplicateSubmission(args: {
    surveyId: string;
    participantUserId: string;
  }): Promise<RawDuplicateSubmissionResult>;
  createResponse(payload: RawCreateResponsePayload): Promise<RawResponse>;
  createAnswers(payloads: RawCreateAnswerPayload[]): Promise<RawAnswer[]>;
  submitSurveyResponse?(payload: RawSubmitSurveyPayload): Promise<RawSubmitSurveyResult>;
  createSignedAssetUrl(args: {
    bucket: string;
    path: string;
  }): Promise<string>;
}
```

Implement Supabase first. Leave an HTTP gateway placeholder only if it fits existing conventions; it should target:

```text
GET  /api/surveys/:publicSlug/public
GET  /api/surveys/:surveyId/submission-status
POST /api/surveys/:surveyId/responses
```

## Persistence mapping

| Question type | Storage rule |
| --- | --- |
| `profile` | Store canonical fields on `responses` plus optional `profile_json`. |
| `experience` | `answer_type=experience`, `value_json.experience_status`. |
| `scale` | `answer_type=scale`, `score_value`, `metric_type`, `topic_key`. |
| `single_choice` | `answer_type=single_choice`, `choice_value`. |
| `multi_select` | `answer_type=multi_select`, `value_json.selected_values` or existing local key. |
| `ranking` | `answer_type=ranking`, `value_json.ranked_values`. |
| `text` | `answer_type=text`, `text_value`, optional topic/space metadata. |
| `image_tag` | Expand each point into one `answers` row with asset/ratio/tag fields. |
| `attention_check` | Store selected value plus correctness in `value_json`. |

## Submit transaction

Prefer `submit_survey_response(payload jsonb)` RPC before launch so `responses` and `answers` are written transactionally. Initial development may use response insert plus answers bulk insert:

1. Insert `responses` for the authenticated user.
2. Bulk insert `answers` with the returned `response_id`.
3. If answers insert fails after response creation, mark the response as discarded or route a recoverable `SUBMISSION_FAILED`.
4. Normalize database errors into API errors the UI can route: not found, closed, access denied, already submitted, validation, asset load, draft restore, network/unknown.
5. Do not delete local draft here; draft cleanup belongs to mutation success handling.

## RLS and constraints

When adding SQL, preserve these invariants:

- Published surveys are readable only by authenticated `@handong.ac.kr` users, or through a server endpoint that performs equivalent validation.
- `survey_sections`, `questions`, and `survey_assets` are readable only when their survey is published.
- Participants can insert only their own `responses`.
- Participants can insert `answers` only for their own response.
- Add or document a unique submitted response constraint on `(survey_id, participant_user_id)` where `status='submitted'`.
- Participant code must not access `admin_members`.
- Browser code must not store service role keys or raw access/refresh tokens in draft storage.

## Sub-agent routing

When available, use `taglow-participant-architect` before large data-layer edits or when reviewing whether an implementation still satisfies the PRD/TDD boundary. Ask it to report boundary leaks and phase risks with file references.

## Tests to add

- Mapper: raw survey bundle rows to `PublicSurvey`, `LocalizedText`, response payload, answer payloads, image tag payloads.
- Controller: session, sign-in, public fetch, access check, duplicate check, asset URL, submit success, already-submitted/closed/error paths.
- Gateway: session/auth, public bundle fetch, signed asset URL, response insert plus answers bulk insert or RPC payload.
- Boundary regression: no Supabase imports from `src/view`, `src/components`, or query hooks.
