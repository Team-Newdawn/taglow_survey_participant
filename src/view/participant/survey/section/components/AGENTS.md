# src/view/participant/survey/section/components Guide

This directory contains components and hooks owned by `SurveySectionPage`.

## Responsibilities

- Render question-type UI and update React Hook Form values through props/context.
- Keep `QuestionRenderer` exhaustive over supported question types.
- Use plain participant wording for image/floorplan location selection.
- Display low-score follow-up only when validation/branch logic says it is relevant.
- Keep section-only hooks such as draft autosave, question screens, and section form setup here.
- Repeated scale questions with the same `config.displayGroup` are grouped by the section page and rendered through `ScaleQuestionGroup` without changing their per-question draft or submit shape.

## CSS Ownership

- Each component with custom styles should keep a matching CSS file under `css/`.
- Component CSS owns only internal structure, local states, and variants for that component.
- Do not style page shells, route-level spacing, or sibling components from component CSS.
- Prefer stable, component-prefixed class names so page CSS does not need descendant overrides.

## Rules

- Do not fetch public survey data directly unless a question component receives a query hook as the established page boundary pattern.
- Do not submit survey data here.
- Do not import Supabase SDK, gateways, or mappers.
- Question components should emit `AnswerDraft`-compatible values.
- Keep mobile touch targets large and errors specific.
- Image tag components should receive signed asset URLs or asset loading state through props/hooks, not construct storage URLs directly.
