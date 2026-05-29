# src/utils Guide

This directory contains generic utilities.

## Expected Files

- `envConfig.ts`
- `i18nText.ts`
- `imageRatio.ts`
- `answerNormalizer.ts`
- `draftKey.ts`
- `dateTime.ts`

## Responsibilities

- Provide pure helpers for environment reading, locale fallback, image ratios, answer normalization, draft keys, and date formatting.
- Keep utilities framework-light and easy to unit test.

## Rules

- Do not import React components, Zustand stores, routes, gateways, or Supabase SDK.
- Keep `imageRatio` clamped to `0..1` and covered by edge tests.
- Keep `draftKey` canonical and shared by all draft code.
