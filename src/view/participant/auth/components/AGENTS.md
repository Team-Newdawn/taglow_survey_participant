# src/view/participant/auth/components Guide

This directory contains small presentational auth components.

## Responsibilities

- Render login callouts, provider requirement notices, and account retry UI.
- Keep copy participant-friendly and bilingual-ready.

## CSS Ownership

- Each auth component that needs styles should keep a matching CSS file beside it.
- Component CSS owns internal layout, states, and variants only.

## Rules

- No data fetching.
- No Supabase SDK imports.
- No route definitions.
- Accept data and callbacks through props.
