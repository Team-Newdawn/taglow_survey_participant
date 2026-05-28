# src/view/participant/survey/components Guide

This directory contains participant survey feature components.

## Expected Files

- `SectionNavigator.tsx`
- `SectionNavigator.css`
- `QuestionRenderer.tsx`
- `QuestionRenderer.css`
- `ProfileQuestion.tsx`
- `ProfileQuestion.css`
- `ScaleQuestion.tsx`
- `ScaleQuestion.css`
- `SingleChoiceQuestion.tsx`
- `SingleChoiceQuestion.css`
- `MultiSelectQuestion.tsx`
- `MultiSelectQuestion.css`
- `RankingQuestion.tsx`
- `RankingQuestion.css`
- `TextQuestion.tsx`
- `TextQuestion.css`
- `ImageTagQuestion.tsx`
- `ImageTagQuestion.css`
- `ParticipantImageTagQuestion.tsx`
- `LowScoreFollowUp.tsx`
- `LowScoreFollowUp.css`
- `AttentionCheckQuestion.tsx`
- `AttentionCheckQuestion.css`
- `DraftRestoreBanner.tsx`
- `DraftRestoreBanner.css`

## Responsibilities

- Render question-type UI and update React Hook Form values through props/context.
- Keep `QuestionRenderer` exhaustive over supported question types.
- Use plain participant wording for image/floorplan location selection.
- Display low-score follow-up only when validation/branch logic says it is relevant.
- `QuestionRenderer` supports v2 types: profile, scale, single_choice, multi_select, ranking, text, image_tag, participant_image_tag, attention_check.

## CSS Ownership

- Each component with custom styles should keep a matching CSS file beside the component.
- Component CSS owns only internal structure, local states, and variants for that component.
- Do not style page shells, route-level spacing, or sibling components from component CSS.
- Prefer stable, component-prefixed class names so page CSS does not need descendant overrides.

## Rules

- Do not fetch public survey data here.
- Do not submit survey data here.
- Do not import Supabase SDK, gateways, or mappers.
- Question components should emit `AnswerDraft`-compatible values.
- Keep mobile touch targets large and errors specific.
- Image tag components should receive signed asset URLs or asset loading state through props/hooks, not construct storage URLs directly.
