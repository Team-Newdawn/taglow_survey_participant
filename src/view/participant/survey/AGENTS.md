# src/view/participant/survey Guide

This directory contains participant survey pages.

## Expected Files

- `entry/SurveyEntryPage.tsx`
- `entry/css/SurveyEntryPage.css`
- `intro/SurveyIntroPage.tsx`
- `intro/css/SurveyIntroPage.css`
- `section/SurveySectionPage.tsx`
- `section/css/SurveySectionPage.css`
- `section/components/`
- `section/navigation/`
- `review/SurveyReviewPage.tsx`
- `review/css/SurveyReviewPage.css`
- `complete/SurveyCompletePage.tsx`
- `complete/css/SurveyCompletePage.css`
- `components/` for survey components shared by multiple page folders

## Responsibilities

- Load public survey data through query hooks.
- Render intro, language selection/default locale, sections, review, and completion.
- Own React Hook Form setup for question values.
- Coordinate draft autosave/restore with draft storage and stores.
- Submit only validated commands.
- Load image/floorplan assets through signed asset URL controller/query behavior.

## CSS Ownership

- Each survey page owns a matching `css/` directory under its page folder.
- Page CSS should handle route shell layout, section/page spacing, and page-specific responsive composition.
- Section-only question component styles belong in `section/components/css/<ComponentName>.css`.
- Shared survey component styles belong in `components/css/<ComponentName>.css`, not in page CSS.
- Do not use a survey page CSS file to reach into another page or component's private class names.

## Rules

- Do not import gateways, mappers, raw rows, or Supabase SDK.
- Do not put reusable primitive styling here when it belongs in `components/`.
- Do not delete draft until submit mutation succeeds.
- Keep network failure behavior retryable and draft-preserving.
- If submit reports `ALREADY_SUBMITTED`, navigate to `/survey/:publicSlug/already-submitted`.
