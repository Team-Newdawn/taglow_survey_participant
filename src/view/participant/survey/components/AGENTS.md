# src/view/participant/survey/components Guide

This directory contains participant survey components shared by more than one survey page.

## Expected Files

- `DraftRestoreBanner.tsx`
- `css/DraftRestoreBanner.css`

## Responsibilities

- Keep only components used by multiple survey page folders.
- Move page-specific components into that page folder, for example `section/components/`.
- Keep shared survey components independent from a single page's local form state when possible.

## CSS Ownership

- Each component with custom styles should keep a matching CSS file under `css/`.
- Component CSS owns only internal structure, local states, and variants for that component.
- Do not style page shells, route-level spacing, or sibling components from component CSS.
- Prefer stable, component-prefixed class names so page CSS does not need descendant overrides.

## Rules

- Do not fetch public survey data here.
- Do not submit survey data here.
- Do not import Supabase SDK, gateways, or mappers.
- Keep mobile touch targets large and errors specific.
