---
name: taglow-participant-survey-renderer
description: Build the Taglow Survey participant renderer. Use when implementing section-based survey screens, progress UI, LocalizedText rendering, profile/scale/single/multi/ranking/text/image_tag/attention components, low-score follow-up display, signed asset loading, or review/complete survey pages.
---

# Taglow Participant Survey Renderer

Use this skill for participant-facing survey screens and question components.

## Read first

- PRD sections: `2.2 UX Principles`, `6. Multilingual Rendering`, `7. Start Screen`, `8. Section Structure`, `9. Profile`, `10-17. Question Types`, `20. Review`, `21. Complete`, `25. Mobile/Accessibility`.
- TDD v2 sections: `3. State Management`, `11. Query Key`, `13. Question Rendering`, `18. Storage Image Loading`, `19. Error Handling`.

## State ownership

- TanStack Query: public survey data, status, duplicate status, signed asset URL, submit mutation.
- Zustand: locale, current section, completed sections, draft restore state, image tagging edit state, login/access transition UI state.
- React Hook Form: question values, touched/dirty, section validation, full review validation.
- Draft storage: persistence only; do not make it the source of UI state.

## Locale rendering

- Render `LocalizedText` by selected locale when available.
- If missing, fall back to default locale or Korean text.
- Store the participant's chosen language on submit.
- Store answers as language-independent values: ids, option values, score values, topic keys, ratios.

## Section UX

- Show current section title and optional description.
- Show section-level and survey-level progress.
- Block next navigation when required visible questions are missing.
- Keep mobile screens focused: one clear answer task per screen or compact group.
- Provide a review screen that shows incomplete sections and deep-links back to fix them.

## QuestionRenderer contract

Prefer a discriminated switch over ad hoc conditionals:

```tsx
switch (question.questionType) {
  case 'profile':
  case 'scale':
  case 'single_choice':
  case 'multi_select':
  case 'ranking':
  case 'text':
  case 'image_tag':
  case 'attention_check':
}
```

If adding a new question type, update the domain model, renderer switch, validation schema, mapper, tests, and review summary together.

## Question behavior

- `profile`: use selection controls for gender, semester, department, RC, dormitory, room type, dorm experience.
- `scale`: 1-5 value, clear endpoint labels, preserve `metric_type` and `topic_key`.
- `single_choice`: store stable option value, not display text.
- `multi_select`: enforce min/max and optional other text.
- `ranking`: tap-first mobile UI; prevent duplicate options.
- `text`: category/space/type selectors before free text when configured.
- `attention_check`: store correctness metadata for quality review.
- `image_tag`: load signed asset URLs through controller/query behavior and delegate coordinate/pin details to `taglow-participant-image-tagging`.

## Low-score follow-up

Use `taglow-participant-answer-validation` for thresholds and requiredness. Default PRD behavior:

- Score 1-2: follow-up reason required.
- Score 3: follow-up optional.
- Score 4-5: follow-up hidden.

## Tests to add

- Sections render in order and progress updates as answers change.
- Required visible questions block navigation.
- Locale `en` renders English and falls back where missing.
- Signed asset URL failure shows retry and blocks required image submit.
- Each question component writes the expected `AnswerDraft` shape.
- Review screen points users to missing required sections/questions.
