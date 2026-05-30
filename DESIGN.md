---
omd: 0.1
brand: Taglow Survey Participant
bootstrapped_from: toss
bootstrapped_at: 2026-05-27T15:45:36Z
last_updated: 2026-05-30
mode: inspired
---

# Taglow Survey Participant Design System

This document is the design contract for the Taglow Survey participant SPA. It reflects the current implementation in `src/styles/design-tokens.css`, `src/components`, and `src/view/participant`. Use it before changing UI, copy, styling, layout, motion, or question rendering.

The participant product is a focused survey flow for students and respondents who enter through a public link or QR, authenticate with Google, answer section by section, recover local drafts, tag locations on images, review, and submit. The UI should feel like a calm product experience, not an admin form.

## 1. Product Experience

### Primary Impression

"I can finish this without effort, and my answer will be handled carefully."

### Experience Goals

- Keep the respondent oriented: where they are, what is required, what happens next.
- Reduce survey fatigue by showing one focused step at a time.
- Make structured answers feel lightweight, not bureaucratic.
- Preserve trust through clear auth, draft recovery, validation, and submission states.
- Keep bilingual rendering predictable across Korean and English.
- Make image/floorplan location feedback easy enough to use on a phone.

### What Taglow Is Not

- Not a marketing landing page.
- Not an admin dashboard.
- Not a decorative brand showcase.
- Not a long single-page institutional form.
- Not a UI that relies on labels or colors that cannot be stored analytically.

## 2. Visual Direction

Taglow is inspired by Toss: white canvas, warm charcoal text, optimistic blue interaction, and plain language. The implementation is intentionally restrained.

Use:

- White or near-white page backgrounds.
- Border-first surfaces.
- Blue for primary actions, selected states, progress, and helpful information.
- Warm neutral text hierarchy.
- Large mobile tap targets.
- Compact but breathable question surfaces.
- Bottom sticky actions when they reduce effort.

Avoid:

- Decorative gradients, blobs, bokeh, heavy hero treatment, or generic illustration filler.
- Dense admin tables or dashboard composition.
- Excess shadows.
- Red as decorative emphasis.
- Placeholder-only labeling.
- Showing every survey question at once.
- Nested card-on-card layouts.

## 3. Runtime Token Source

`src/styles/design-tokens.css` is the runtime source of truth. DESIGN.md explains how to use those tokens. If a value changes, update both places.

### Color Tokens

| Token | Value | Current Use |
| --- | --- | --- |
| `--color-brand-700` | `#1b64da` | Pressed primary, eyebrow text, selected text |
| `--color-brand-600` | `#3182f6` | Primary CTA, progress, selected borders, focus |
| `--color-brand-500` | `#4f96ff` | Soft hover or emphasis when needed |
| `--color-brand-100` | `#eaf3ff` | Selected backgrounds, info borders |
| `--color-brand-50` | `#f4f9ff` | Info panels, draft restore tint |
| `--color-bg` | `#ffffff` | App canvas, sticky header background |
| `--color-bg-subtle` | `#f7f9fc` | Low-emphasis panels, grouped scale panel |
| `--color-surface` | `#ffffff` | Cards, inputs, choice controls |
| `--color-surface-subtle` | `#f2f5f9` | Progress track, neutral input surfaces, summary tiles |
| `--color-text` | `#191f28` | Primary text |
| `--color-text-muted` | `#6b7684` | Descriptions, helper text |
| `--color-text-subtle` | `#8b95a1` | Secondary helper, disabled text |
| `--color-border` | `#e5e8eb` | Default border |
| `--color-border-strong` | `#d1d6db` | Drag-ready or focusable neutral border |
| `--color-success` | `#00a86b` | Completion and success eyebrow |
| `--color-success-bg` | `#e8f8f1` | Success message background |
| `--color-warning` | `#f59f00` | Warning state |
| `--color-warning-bg` | `#fff5db` | Warning message background |
| `--color-danger` | `#e03131` | Blocking error text and danger action |
| `--color-danger-bg` | `#fff0f0` | Error or danger background |

Color rules:

- A normal viewport should have at most two saturated blue elements.
- Blue means action, selected state, information, or progress.
- Neutral surfaces use border and spacing before shadow.
- Error states must include text, not red alone.
- Do not store translated labels as values; UI color must not imply data shape.

Approved current non-token effects:

- Sticky bottom action background: `rgba(255, 255, 255, 0.96)`.
- Dialog backdrop: `rgba(25, 31, 40, 0.36)`.
- Sticker/image pin drop-shadow: `rgba(25, 31, 40, 0.18)`.
- Tokenize these before introducing additional similar effects.

### Typography Tokens

Use the Korean-first system stack:

```css
font-family: Pretendard, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

| Token | Size | Line | Weight | Current Use |
| --- | --- | --- | --- | --- |
| `--font-size-display` | `28px` | `36px` | `700` | Intro, review, complete, login/system page titles |
| `--font-size-title` | `22px` | `30px` | `700` | Section title in `StepHeader` |
| `--font-size-heading` | `18px` | `26px` | `700` | Question title, card headings, dialog title |
| `--font-size-body` | `16px` | `24px` | `400` | Main copy, option labels, buttons |
| `--font-size-small` | `14px` | `20px` | `400` | Helper text, errors, descriptions |
| `--font-size-caption` | `12px` | `16px` | `500` | Eyebrows, counters, rank labels, progress meta |

Typography rules:

- Letter spacing is always `0`.
- Do not scale font size with viewport width.
- Body copy is regular by default.
- Use bold for actions, selected options, section numbers, and headings.
- Numeric emphasis belongs to progress, review counts, scores, and section numbering.

### Spacing Tokens

| Token | Value | Current Use |
| --- | --- | --- |
| `--space-1` | `4px` | Tiny label/helper gaps |
| `--space-2` | `8px` | Option gaps, control inner groups |
| `--space-3` | `12px` | Choice row gap, bottom nav gap |
| `--space-4` | `16px` | Default component padding, sticky bottom padding |
| `--space-5` | `20px` | Mobile page side padding, question shell padding |
| `--space-6` | `24px` | Section separation |
| `--space-8` | `32px` | Page top padding, broad separation |
| `--space-10` | `40px` | Entry page top padding, bottom scroll buffer |
| `--space-12` | `48px` | Login/system/complete top padding |

Spacing rules:

- Mobile page horizontal padding is normally `--space-5`.
- Question shells use `--space-5` padding and `--space-4` internal gap.
- Question lists use `--space-5` vertical gap.
- Bottom sticky actions use `--space-4` plus safe-area inset.
- Never compress touch controls below 44px high.

### Radius Tokens

| Token | Value | Current Use |
| --- | --- | --- |
| `--radius-sm` | `8px` | Small affordances, accordion toggle |
| `--radius-md` | `12px` | Buttons, inputs, choices |
| `--radius-lg` | `16px` | Question shells, cards, review tiles |
| `--radius-xl` | `20px` | Draft restore banner, bottom sheets |
| `--radius-pill` | `999px` | Progress track, badges, segmented controls |

Radius rules:

- Default controls use `--radius-md`.
- Question and card surfaces should stay at `--radius-lg` or less.
- Use pill radius only for progress bars, small badges, and segmented controls.

### Elevation Tokens

| Token | Value | Current Use |
| --- | --- | --- |
| `--shadow-none` | `none` | Default surfaces |
| `--shadow-soft` | `0 8px 24px rgba(25, 31, 40, 0.08)` | Sticky bottom bars, selected locale control, focus combination |
| `--shadow-floating` | `0 16px 40px rgba(25, 31, 40, 0.12)` | Image tag editor dialog |

Elevation rules:

- Use borders first.
- Shadows are rare and should suggest floating or persistence.
- Do not use colored shadows.

### Layout Tokens

| Token | Value | Current Use |
| --- | --- | --- |
| `--layout-mobile-max` | `480px` | Login/system/complete narrow pages |
| `--layout-content-max` | `720px` | Entry, intro, section pages |
| `--layout-review-max` | `840px` | Review page |
| `--layout-bottom-action-height` | `80px` | Scroll padding above sticky actions |

### Motion Tokens

| Token | Value | Current Use |
| --- | --- | --- |
| `--motion-fast` | `120ms` | Button/choice feedback |
| `--motion-base` | `180ms` | Progress width and ordinary state changes |
| `--motion-slow` | `240ms` | Reserved for slightly larger transitions |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Default ease |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Exit/settle ease when needed |
| `--focus-ring` | `0 0 0 3px rgba(49, 130, 246, 0.24)` | Focus-visible box shadow |

Reduced motion:

- `prefers-reduced-motion: reduce` sets motion tokens to `0ms`.
- The image tag sticker hint must stop animating and remain visible at the image target position.

## 4. Global CSS Rules

Global styles live in `src/styles/global.css`.

- Use `box-sizing: border-box` globally.
- `html` and `body` use white background and `--font-family-base`.
- `button`, `input`, `textarea`, and `select` inherit font.
- `button` resets border to `0`; component CSS owns its border.
- Links inherit color.
- `:focus-visible` uses a brand outline with offset.
- `::selection` uses `--color-brand-100`.
- `.route-state` is a narrow fallback shell using `--layout-mobile-max` and `--space-12 --space-5`.

## 5. Page Layout Patterns

### Entry

`SurveyEntryPage` is a loading/redirect shell.

- Use `--layout-content-max`.
- Top padding uses `--space-10`.
- Copy should be brief: title plus one sentence.

### Login And System State

Login, access denied, already submitted, closed, not found, and complete-like states use a narrow `--layout-mobile-max` column.

- Page padding: `--space-12 --space-5`.
- Content is a grid with `--space-5` gap.
- Eyebrow uses brand or success color, caption size, bold weight.
- Body text is muted.

### Intro

The intro page sets expectations and gives the user a clean start.

- Use `--layout-content-max`.
- Header has eyebrow, display title, optional description.
- Information cards use border, `--radius-lg`, `--space-5`.
- Section list links are 52px high rows with subtle background and numbered pill.
- Locale control is segmented: subtle container, white selected segment, soft shadow.
- Bottom CTA is fixed and full width within content max.

### Section Answering

The section page is a viewport-height task surface.

- Use `height: 100vh` plus `100dvh`.
- Header is sticky at top with white background.
- Body scrolls independently and reserves bottom padding for fixed actions.
- Questions are not all shown if an image tag question is active; image tag questions become their own screen.
- Non-image questions in the same section can appear together in one screen.
- Bottom navigation is anchored as the final row of the viewport grid with secondary "previous" and primary "next/review" actions.

Section shell style:

- The root is a centered grid constrained to `--layout-content-max`.
- Page padding starts at `--space-6 --space-5 0`.
- The header row is visually part of the page, not a separate card.
- The header must remain calm and informational: section count eyebrow, section title, optional description, progress.
- The scroll body starts with a small top inset, then draft/validation messages, then the question stack.
- Use `scrollbar-gutter: stable` so validation messages and long questions do not shift horizontal layout.
- The bottom navigation uses two columns: a smaller secondary previous button and a wider primary next/review button.
- Bottom actions must not hide focused inputs or error text; reserve `--layout-bottom-action-height + --space-10` in the scroll body.

Question screen style:

- A question screen is the set of render blocks visible before the user presses next.
- Non-image questions can share a screen when that reduces navigation taps.
- Image/floorplan and participant-upload tagging questions must feel like a focused task and therefore occupy their own screen.
- Do not visually explain screen splitting to users; make it feel like ordinary next/previous progression.
- When a screen contains multiple question shells, keep a consistent `--space-5` vertical rhythm.
- When a screen contains a grouped question, the group counts as one visual block.

Navigation and validation style:

- Pressing next with missing required answers shows a `Message` error above the question stack.
- The affected question shell or group also receives an inline error.
- The user should never need to guess which field blocked navigation.
- Moving forward or backward saves draft state first; do not show a disruptive saving modal.
- The last section's primary action label is "검토하기"; earlier actions are "다음".

### Review

The review page is denser but still participant-focused.

- Use `--layout-review-max`.
- Show warning/success message first.
- Summary uses three neutral tiles: sections, answers, location marks.
- Section rows show completion or missing required counts plus action.
- Submit CTA is fixed at bottom and disabled until required answers are complete.

### Complete

The complete page confirms submission and explains use of the response.

- Narrow `--layout-mobile-max`.
- Success eyebrow.
- One clear title.
- One muted explanation.
- Success message and secondary return action.

## 6. Shared Components

### Button

Defined by `Button.tsx` and `Button.css`.

- Base height: 48px minimum.
- Shape: `--radius-md`.
- Padding: `0 --space-5`.
- Font: body size, bold.
- Active state moves down 1px.
- Disabled state uses `opacity: 0.56` and `not-allowed`.
- Variants:
  - `primary`: brand-600 background, white text, brand-700 hover.
  - `secondary`: white surface, border, text color.
  - `tertiary`: transparent, brand-700 text.
  - `danger`: danger background and danger text.
- One primary button per major decision surface.
- Use full-width buttons for bottom CTAs and narrow mobile pages.

### Message

Defined by `Message.tsx` and `Message.css`.

- Role is `alert` for error, `status` otherwise.
- Shape: `--radius-lg`.
- Padding: `--space-4`.
- Title is body size.
- Content is small muted text.
- Tone backgrounds:
  - Info: brand-50 with brand-100 border.
  - Success: success-bg.
  - Warning: warning-bg.
  - Error: danger-bg.

### ProgressBar

- Track height: 8px.
- Track and bar use pill radius.
- Bar uses brand-600 and animates width with `--motion-base`.
- Meta line is caption size, medium weight, muted.
- Always show a percent, plus a contextual label when available.

### StepHeader

- Section header uses eyebrow, title, optional description, and progress.
- Eyebrow is caption, bold, brand-700.
- Title uses title token, not display token.
- Keep it sticky only in section pages.

### Select

- Always render a visible label.
- Control height: 48px minimum.
- Shape: `--radius-md`.
- Focus uses brand border plus focus ring.
- Placeholder option is "선택해주세요".
- Helper and error use caption size.

## 7. Question Surface

### QuestionShell

Most individual questions render inside `QuestionShell`.

- Surface: white, border, `--radius-lg`, `--space-5`.
- Header gap: `--space-2`.
- Question title: heading size, bold.
- Question number is brand colored and separated from title text.
- Required questions append a visual `*` with accessible label "필수".
- Description is small muted text.
- Error is small danger text after children.

### Numbering

Numbering is applied by render blocks, not by each component. Grouped questions count as one visible block.

### Required Validation

- Missing required questions show "필수 문항입니다." near the affected shell/group.
- Section-level blocking message says "필수 문항을 먼저 답해주세요."
- Do not advance until current screen required answers are complete.

### Render Blocks

The participant does not see database questions directly. They see render blocks.

Render block types:

- `question`: one `PublicQuestion` rendered inside `QuestionShell`.
- `scale_group`: two or more consecutive scale questions with the same `config.displayGroup`.
- `multi_select_group`: two or more consecutive multi-select questions with the same `config.displayGroup`.

Design rules:

- Number visible render blocks, not raw questions.
- A group block receives one number even when it contains many database questions.
- Render block numbers use brand color and sit inside the title row, never in a separate badge.
- Render blocks must preserve source order.
- A group only exists when at least two consecutive questions share the same display group.
- Do not group visually unrelated questions just because they share a section.

### Grouped Question Style

Grouped questions are fatigue-reduction surfaces, not dashboards.

- The outer group surface uses the same white/border/radius contract as `QuestionShell`.
- The group header contains number, group title, required star, and a compact completion hint.
- Group titles should be concrete task labels, for example "세탁기 및 건조기 관리에 대해 알려주세요."
- Internal rows are lower-emphasis controls with `--radius-md`.
- Row summaries must fit on mobile without horizontal scroll.
- Use small pills for state summaries such as "미응답", "3점", or selected count.
- Expanded panels use subtle background to show hierarchy without nesting cards.
- Missing required state should open or highlight the affected row when possible.

### Conditional Visibility

Branching is functional, but the visual behavior should feel simple.

- Hidden questions are removed from render block numbering.
- Hidden required questions do not show validation errors.
- When a previous answer reveals a question, it appears in the normal stack position for that section.
- Do not animate newly revealed questions with decorative motion.
- If a hidden question has a draft value and becomes visible again, show the restored value normally.

## 8. Question Type Patterns

### Profile

Current implementation uses `Select` fields.

- Prefer structured stable values for gender, semester, department, RC, dormitory, room type, and dorm experience.
- Use configured options when a profile field question supplies them.
- Avoid free text for profile unless a survey configuration explicitly requires it.

### Experience

Experience questions use simple choice buttons.

- Default options:
  - `used`: 이용해봤다
  - `heard_not_used`: 들어봤지만 이용하지 않았다
  - `never_heard`: 처음 들어봤다
  - `not_applicable`: 해당 없음
- If status is not `used`, show a short reason input.
- Use experience answers to avoid asking irrelevant follow-up questions.

### Scale

Scale questions are fixed 1 to 5.

- Keep five equal square buttons.
- Labels: "1 매우 낮음" and "5 매우 높음".
- Selected button uses brand-600 background and white text.
- Low score follow-up appears when score is at or below `config.lowScoreThreshold`, default `2`.
- For scores above threshold, clear low-score reason/text.

### Scale Group

Consecutive scale questions with the same `config.displayGroup` render as one grouped accordion.

- Group surface mirrors question shell: white, border, `--radius-lg`.
- Header shows group title, number, required star, and answered count.
- Each item summary shows label, "미응답" or score pill, and a +/- toggle.
- Only the selected item panel expands.
- Missing required question expands automatically.
- Mobile under 420px hides the toggle glyph and tightens padding.

### Single Choice

Single choice is a radio UI, not a generic button list.

- Use `role="radiogroup"`.
- Each option is a label with a native `input type="radio"`.
- Minimum row height is 48px.
- Radio size is 20px and uses brand accent color.
- Selected state uses brand-100 background, brand border, brand-700 text, bold weight.

### Multi Select

Multi select is a checkbox UI.

- Each option is a label with a native `input type="checkbox"`.
- Show selected count guidance:
  - `n개 선택됨`
  - Include min/max constraints when configured.
- Enforce max selection by disabling additional options.
- Disabled options use subtle surface and subtle text.
- Selecting `other` reveals a short text input labeled "기타 내용".
- Store selected option values, not labels.

### Multi Select Group

Consecutive `multi_select` questions with the same `config.displayGroup` render as one group.

- Flatten options visually while preserving each question's answer shape.
- Show group title, number, required star, and selected count guidance.
- Enforce min/max across the group.
- Use the same checkbox row styling as single multi select.
- Show one "기타 내용" input when an `other` option is selected.

### Text

Text questions support three current modes.

- Plain text: no category selector, no visible "의견 내용" label, no placeholder-only guidance.
- Short text: `questionType: "text"` with `config.textMode: "short"` or `config.multiline: false` renders a 48px text input.
- Long text: default renders textarea with 120px minimum height.
- Selection-after-category text: when configured with opinion options or `textMode: "select_text"`, show opinion radio choices first, then text input/textarea.
- Default opinion categories are `discomfort`, `improvement`, `praise`, `question`, `other` with Korean labels 불편/개선/칭찬/문의/기타.
- Respect `validation.maxLength` or `config.maxLength`.

### Ranking

Ranking is tap-to-rank.

- Do not require drag as the only interaction.
- Each option is a 52px row.
- Left column shows `-` or `n순위`.
- Selecting an unranked option appends the next rank up to max.
- Selecting a ranked option removes it and reflows ranks.

### Attention Check

Attention checks are simple selected button lists.

- Match Experience/legacy chip visual style.
- Keep copy direct and avoid playful language.

### Low Score Follow-up

Low score follow-up is a subtle nested panel.

- Background: `--color-bg-subtle`.
- Shape: `--radius-lg`.
- Show when scale score is at or below threshold.
- Use reason chips plus optional/required textarea depending on validation behavior.
- Default reasons:
  - 수가 부족함
  - 상태가 좋지 않음
  - 사용이 불편함
  - 안내가 부족함
  - 기타

### Image/Floorplan Tagging

Participant-facing copy must never say "image tagging". Use location selection language.

Current behavior:

- The visual sticker is `src/assets/handong.png`.
- Sticker visible size is 25px by 25px.
- Pin touch target remains 44px by 44px.
- Drag source target is 52px by 52px and centered below the image.
- The drag source has no red outline, red background, or visible count copy.
- Before the first tag is placed, an aria-hidden hint sticker animates from the original sticker button position toward the image center.
- When the user is dragging, editing, or already has at least one tag, the hint disappears.
- Drag preview follows the pointer with the same 25px sticker.
- Dropping outside the image should not open the editor.
- Dropping inside the image opens the editor and stores clamped `xRatio` and `yRatio`.
- Existing pins render from ratios so they survive responsive image resizing.
- The canvas drag-ready state uses neutral strong border, not red.

Image tag editor:

- Opens as a bottom sheet on mobile and centered dialog on desktop >= 720px.
- Backdrop dismisses on outside pointer down.
- Escape closes.
- Category select receives autofocus.
- Reason textarea uses explicit label and placeholder.
- Actions are grid buttons: optional Delete, Cancel, Save.
- Required reason error says "이유를 짧게 적어주세요."

Participant uploaded image tagging:

- Upload button is a styled label with invisible file input.
- Only images are accepted.
- Invalid mime/size errors explain the next step.
- Re-upload resets existing points.

## 9. Draft, Recovery, And Submission UX

Drafts are client-side only.

- Autosave delay: 6500ms.
- Save again on visibility hidden and before unload.
- Restore prompt appears on intro and section pages when a compatible draft exists.
- Draft restore banner uses brand-50/brand-100 tint and `--radius-xl`.
- Banner actions are "처음부터" and "이어서 작성".
- Submit success removes draft.
- Submit failure preserves current answers and shows a corrective error message.

## 10. Copy And Tone

Taglow uses plain, polite language. It should sound like a helpful product, not an institution.

Voice:

- Short sentences.
- Concrete next actions.
- Calm reassurance for auth, draft, validation, and submit errors.
- No hype.
- No jokes in blocking states.
- No technical terms in participant-facing copy.
- Korean copy may use polite `-해주세요` and `-됩니다`.
- English copy should be concise and direct.

Preferred Korean patterns:

- "이전에 작성하던 응답이 있습니다."
- "필수 문항을 먼저 답해주세요."
- "학교 Google 계정으로 다시 로그인해주세요." only if school-domain auth is reintroduced. Current product allows any Google account.
- "응답이 제출되었습니다."
- "네트워크 상태를 확인한 뒤 다시 시도해주세요."
- "작성 중인 응답은 유지됩니다."

Avoid:

- "오류가 발생했습니다" without cause or next action.
- "이미지 태깅을 수행하세요."
- "payload", "cache", "schema", "validation".
- Labels that describe implementation instead of participant action.
- Long explanatory paragraphs inside question surfaces.

## 11. Bilingual And Data Rules

- Render localized display text from survey title, description, section title, question title, and option labels.
- Fall back to the survey default locale when translation is missing.
- Store analytics-friendly values only: option values, score values, topic keys, space keys, image ratios, tag types.
- Do not store translated labels as answer values.
- Keep Korean and English copy aligned in function, not necessarily word-for-word.

## 12. Accessibility Rules

- Minimum interactive target is 44px.
- Native radio and checkbox controls are preferred for single and multi select.
- Interactive labels must include real inputs when the control represents a form state.
- Use `aria-labelledby` for question inputs tied to question titles.
- Use `aria-invalid` for invalid selects.
- Error messages should identify what to fix.
- Do not rely on color alone.
- Focus-visible styles are required and must be visible on keyboard navigation.
- Dialogs use `role="dialog"` and `aria-modal="true"`.
- Image pins must be keyboard reachable and editable.
- Motion must respect `prefers-reduced-motion`.

## 13. Responsive Rules

- Design mobile first.
- Keep main survey content inside `--layout-content-max`.
- Keep system/login/complete pages inside `--layout-mobile-max`.
- Keep review inside `--layout-review-max`.
- Use `100dvh` where viewport-height section behavior matters.
- Sticky or bottom-anchored bars must account for `env(safe-area-inset-bottom)` when they overlay or touch the viewport edge.
- Avoid layout shifts from dynamic labels, counters, selected states, and validation messages.
- For fixed-format controls, define stable dimensions: square scale buttons, 48px choice rows, 52px ranking rows, 44px pins, 52px drag source.

## 14. Motion Rules

Motion should clarify state, not entertain.

Allowed:

- Button active press: `translateY(1px)`.
- Progress width transition.
- Choice selected state transition.
- Image tag hint from original sticker position to image target before the first tag.
- Drag preview following pointer.

Avoid:

- Page-level decorative animation.
- Bounce, spring overshoot, or playful motion.
- Infinite motion outside the pre-first-tag hint.
- Motion that competes with form completion.

## 15. Visual QA Checklist

Before shipping UI changes:

- Text does not overlap at mobile widths.
- Sticky bottom actions do not cover the active question.
- Required errors are visible without color-only communication.
- Question groups preserve per-question answer data.
- Image tag stickers are 25px visible but keep accessible touch targets.
- First-tag hint disappears once a tag is being dragged, edited, or saved.
- Locale changes do not break labels or control widths.
- Build and targeted component tests pass.

## 16. Implementation Rules

- Component CSS owns only component internals.
- Page CSS owns page shell, sticky actions, and high-level layout.
- Use component-prefixed class names.
- Prefer existing primitives: `Button`, `Message`, `ProgressBar`, `Select`, `StepHeader`, `QuestionShell`.
- Use design tokens instead of literal colors, spacing, radius, typography, or motion.
- If a new visual primitive needs a value not covered by tokens, add the token first.
- Do not import Supabase SDK or raw gateway types into views.
- Keep answer values compatible with the participant API boundary.
- Add or update tests when changing question behavior, validation, or grouping.

## 17. Change Workflow

When changing design:

1. Update this `DESIGN.md` if the rule, token, or component contract changes.
2. Update `src/styles/design-tokens.css` if tokens change.
3. Update component/page CSS using token references.
4. Update relevant component tests or renderer tests.
5. Run:

```bash
pnpm check:types
pnpm test
pnpm build
```

6. If this document changes materially, sync related agent/shim docs when requested.
