---
name: taglow-participant-answer-validation
description: Normalize and validate Taglow Survey participant answers. Use when implementing Zod schemas, answer draft shapes, branchEvaluator, low-score follow-up requiredness, section/full submission validation, answer normalizers, attention-check correctness, or validation tests.
---

# Taglow Participant Answer Validation

Use this skill for validation logic that sits between question UI, draft cache, and submit mapping.

## Read first

- PRD sections: `10. Experience`, `11. Satisfaction/Importance`, `12. Low Satisfaction Follow-up`, `13-17. Question Types`, `24. Validation`.
- TDD v2 sections: `13. Question Rendering`, `14. Validation`, `15. Submission Payload`, `16. Duplicate Prevention`, `20. Test Strategy`.

## Core shapes

Keep a single `AnswerDraft` shape shared by form, draft, mapper, and review:

```ts
export type AnswerDraft = Readonly<{
  questionId: string;
  answerType: string;
  metricType?: string;
  scoreValue?: number;
  textValue?: string;
  choiceValue?: string;
  valueJson?: Record<string, unknown>;
  tagPoints?: ImageTagPoint[];
}>;
```

Do not duplicate incompatible answer shapes in UI components.

## Validation rules

- Required profile values must be present before submission.
- Required visible questions must have valid answers.
- `scale.scoreValue` must be an integer from 1 to 5.
- `multi_select` must satisfy configured min/max and carry other text when required.
- `ranking` must contain no duplicate option values.
- Required text must be non-blank after trimming.
- `image_tag` points must respect max tag count, ratio bounds, required tag type, and required text.
- `image_tag` answers must reference an existing `assetId`.
- `attention_check` should be validated by `attentionCheckValidator.ts` and record whether the expected value matched.
- Participant email must already be validated as `@handong.ac.kr` before submit.
- Submission validation must confirm duplicate-submission query success before final submit proceeds.

## Branch evaluator

Implement `shouldShowQuestion` as a pure function:

```ts
export function shouldShowQuestion(args: {
  question: PublicQuestion;
  values: Record<string, unknown>;
}): boolean;
```

Support only operators present in existing configs. For MVP, `eq`, `neq`, `in`, `not_in`, `lt`, `lte`, `gt`, and `gte` are enough. Unknown operators should fail closed and be covered by tests.

## Low-score follow-up

Default threshold:

```text
score 1-2: reason required
score 3: reason optional
score 4-5: hidden
```

If question config overrides threshold or requiredness, use config. Store MVP low-score data on the same answer in `valueJson.low_score_reason` unless the survey schema explicitly provides a separate follow-up question.

## Normalization

Normalize before saving draft and before submit:

- Trim text values.
- Remove empty optional fields.
- Preserve stable option values, not translated labels.
- Clamp image ratios in the image utility, but still validate they are in range.
- Keep `topicKey`, `spaceKey`, and `metricType` for analytics.

## Tests to add

- Each question type has valid and invalid cases.
- Attention-check expected value has pass/fail cases.
- Branch evaluator hides and shows questions based on current answers.
- Low-score requiredness changes with score and config.
- Corrupted or unknown answer types fail validation with a routeable error.
- Submission validation reports enough location data to send the user back to the failing section.
