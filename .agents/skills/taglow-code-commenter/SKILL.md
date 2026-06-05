---
name: taglow-code-commenter
description: Add concise, architecture-aware comments to Taglow Survey participant code. Use when the user asks to annotate, document, explain in comments, or insert 1-2 line comments for classes, methods, functions, hooks, constants, state variables, derived variables, or types. If invoked without a target path, analyze and comment the whole project source (`src/`) using PRD/TDD/AGENTS context.
---

# Taglow Code Commenter

## Goal

Add short comments that explain what each meaningful declaration does and how it connects to nearby architecture. Write the explanation simply enough that a beginner can follow it, while keeping a professional engineering tone. Preserve behavior exactly.

If the user provides a target directory or file, work only there. If the user invokes this skill without a target path, treat `src/` as the target and analyze the whole project source.

## Required Context

Before editing:

1. Read root `AGENTS.md`.
2. Read the nearest `AGENTS.md` files for the target path.
3. Read `dev/Taglow_Survey_Participant_PRD.md` and `dev/Taglow_survey_Participant_TDD_v2.md`; use the older TDD only if v2 is silent.
4. If the target touches existing question interpretation/rendering, skim `dev/question_interpretation_algorithm.md` when present.
5. Use other Taglow skills only when the target clearly matches them, for example:
   - survey UI/rendering: `taglow-participant-survey-renderer`
   - answer normalization/validation: `taglow-participant-answer-validation`
   - API/controller/query/gateway/Supabase: `taglow-participant-api-boundary` and `taglow-performance-first`
   - draft storage: `taglow-participant-draft-cache`

## Workflow

1. Resolve the target:
   - explicit file/directory from the user: use that path
   - no explicit target: use `src/`
   - never include `dist`, `node_modules`, `.git`, coverage output, `.codex`, `.claude`, or `.agents` skill files unless explicitly requested
2. Inventory target files with `rg --files <target>` and filter to source files that can hold comments: `.ts`, `.tsx`, `.js`, `.jsx`, `.css` only if requested.
3. Read each target file and its imports before editing. Understand the file's layer: `app`, `view`, `api/participant`, `store`, `utils`, `components`, or `test`.
4. Identify declarations to comment:
   - exported classes, interfaces, types, constants, functions, hooks, React components
   - non-exported helper functions and module constants
   - meaningful component-scope state, refs, query results, memoized values, derived variables, callbacks, and handlers
   - test fixtures/helpers when they explain behavior or architecture
5. Skip comments for trivial noise unless the user explicitly asks for every local variable:
   - imports
   - simple destructured props with self-evident names
   - loop counters, temporary `index`, `item`, `event`, or `error` variables
   - JSX-only text nodes
6. Add comments with `apply_patch`. Keep comments 1-2 lines and close to the declaration.
7. Run `pnpm check:types`. Run targeted tests if comments touched executable syntax in complex files; otherwise run `pnpm test` when the target is broad.

## Comment Style

Prefer JSDoc for exported declarations and top-level helpers:

```ts
/**
 * Builds the participant-facing survey model from raw gateway rows.
 * This is the mapper boundary between Supabase payloads and view/query code.
 */
export class ParticipantPayloadMapper {}
```

Prefer `//` comments for component-scope variables or handlers:

```ts
// The canonical answer-section list excludes intro sections so progress and review stay aligned.
const answerSections = getAnswerSections(survey);
```

When the user asks in Korean, or when no comment language is specified in this Taglow repo, write source comments in Korean. Keep sentences plain and professional:

```ts
// 답변 섹션 목록은 안내 섹션을 제외해 진행률과 검토 화면이 같은 기준을 쓰게 한다.
const answerSections = getAnswerSections(survey);
```

Use English comments only when the surrounding file already clearly uses English-only comments or the user asks for English.

For React hooks/components, comment the data-flow connection:

```ts
// React Hook Form owns section answer values; the Zustand draft store mirrors them for autosave.
const form = useSectionSurveyForm({ values, onValuesChange: setValues, onDirty });
```

For tests, comment the behavior contract rather than implementation mechanics:

```ts
// This fixture keeps an intro section in the bundle to prove progress ignores non-answer sections.
function buildSurveyWithIntroSection() {}
```

## Content Rules

- Explain role first, connection second.
- Use beginner-friendly wording: prefer concrete nouns and direct verbs over abstract architecture jargon.
- Still keep a professional tone: avoid jokes, cute metaphors, casual filler, or classroom-style over-explaining.
- Mention the architectural boundary when useful: View → Query Hook → Controller → Mapper/Gateway, or React Hook Form/Zustand/TanStack Query ownership.
- Use PRD/TDD language for product concepts: participant, public survey, section, draft, response, answer, image tag, locale.
- Keep comments factual. Do not speculate about future work inside code comments.
- Do not restate the identifier in prose. For example, avoid `// Sets currentSectionKey`.
- Do not add large file headers unless a file contains only a few declarations and a header is the clearest option.
- Do not change runtime behavior, formatting style, exports, import order, or test expectations except where required to keep comments syntactically valid.
- Use Korean comments when the user asks in Korean or requests easy Korean explanations. Keep TypeScript syntax, identifiers, and code unchanged.

## Directory Strategy

For a small directory, comment every eligible file in one pass.

For `src/` or another large directory, work in batches and keep the user updated:

1. Start with public entry files and boundary files.
2. Then annotate helpers and leaf components.
3. Then annotate tests and fixtures.
4. Report any files skipped and why.

When invoked for the whole project, prioritize files that define architecture and behavior:

1. `src/main.tsx`, `src/app/`
2. `src/api/participant/model`, `controller`, `query`, `runtime`
3. `src/api/participant/service/mapper`, `validation`, `draft`, `gateway`
4. `src/store`, `src/utils`
5. `src/view/participant`
6. `src/components`
7. `src/test` and colocated tests

If a file already has useful comments, preserve them and only add missing architectural context. If a file has stale comments, update or remove the stale part while keeping behavior unchanged.

## Verification

Always report:

- target path
- number of files changed
- validation commands run
- any skipped files or unresolved ambiguity
