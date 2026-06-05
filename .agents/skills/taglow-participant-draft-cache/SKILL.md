---
name: taglow-participant-draft-cache
description: Implement Taglow Survey participant draft persistence. Use when working on draft keys, localStorage or IndexedDB DraftStorage, 5-10s autosave, visibility/beforeunload save, restore prompts, schemaVersion mismatch, corrupted drafts, quota errors, submit-success cleanup, submit-failure draft retention, or draft security.
---

# Taglow Participant Draft Cache

Use this skill for client-side draft autosave and restore. The MVP explicitly does not store drafts on the server.

## Read first

- PRD sections: `4.2 Restore Flow`, `19. Frontend Draft Save`, `20. Review`, `24. Validation`.
- TDD v2 sections: `3.4 Draft Cache`, `12. Draft Cache`, `17. Access Control and Security`, `19. Error Handling`, `20. Test Strategy`.

## Canonical key

The PRD and TDD use slightly different separators:

- PRD: `taglow_survey_draft:{survey_id}:{participant_user_id}`
- TDD: `taglow-survey-draft:{surveyId}:{participantUserId}`

Choose one canonical key in `buildDraftKey` and use it everywhere. Prefer the TDD hyphenated key for new code. If existing users may already have underscore keys, add a tiny migration read path and remove it after successful save.

```ts
export function buildDraftKey(args: {
  surveyId: string;
  participantUserId: string;
}): string {
  return `taglow-survey-draft:${args.surveyId}:${args.participantUserId}`;
}
```

## Storage contract

```ts
export interface DraftStorage {
  loadDraft(key: string): Promise<SurveyDraft | null>;
  saveDraft(key: string, draft: SurveyDraft): Promise<void>;
  removeDraft(key: string): Promise<void>;
}
```

Start with localStorage. Add IndexedDB fallback only when quota or payload size makes localStorage unreliable.

## Draft shape

```ts
export type SurveyDraft = Readonly<{
  surveyId: string;
  participantUserId: string;
  locale: Locale;
  currentSectionId?: string;
  values: Record<string, unknown>;
  updatedAt: string;
  schemaVersion: number;
}>;
```

Include profile answers and image tag points through the same `values` object used by React Hook Form.

## Autosave policy

- Save on a 5-10s debounce after value changes.
- Save immediately on section navigation.
- Save on `visibilitychange` when the document becomes hidden.
- Save on `beforeunload`.
- Save selected locale and current section.
- Show "saved/saving/restore available" status only when it helps confidence.
- On submit success, remove the draft.
- On submit failure, keep the draft and show retry.
- On parse failure, ignore the draft and let the participant start fresh with a clear notice.
- On schemaVersion mismatch, ask before restoring or migrate only when deterministic.
- On quota failure, fall back to IndexedDB or show that temporary save failed while allowing final submit.
- Never store Supabase service role keys, raw access tokens, raw refresh tokens, or unrelated secrets in draft storage.
- Avoid long-lived storage of unnecessary personal raw payloads.

## Restore flow

Restore only after the user identity is known, because drafts are keyed by `surveyId + participantUserId`.

1. User reopens same survey in same browser.
2. Auth session is available and domain is valid.
3. Load draft for the exact survey/user key.
4. Show restore banner/modal.
5. If continue, hydrate locale, section, and answers.
6. If restart, remove or supersede old draft.

## Tests to add

- `buildDraftKey` is stable.
- save/load/remove round trip.
- 5-10s debounce writes after answer changes.
- visibility hidden and beforeunload trigger saves.
- section navigation forces immediate save.
- corrupted JSON returns null and does not throw into UI.
- submit success removes draft; submit failure keeps it.
- draft is separated across survey ids and participant user ids.
