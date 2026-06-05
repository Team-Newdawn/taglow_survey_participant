---
name: taglow-participant-ux-copy
description: Review and refine Taglow Survey participant mobile UX and copy. Use when working on survey intro, section progress, draft restore messaging, validation errors, image/floorplan wording, completion screen, accessibility, Korean/English participant microcopy, or reducing survey fatigue.
---

# Taglow Participant UX Copy

Use this skill when the work changes what participants see, understand, or feel while completing the survey.

## Read first

- PRD sections: `2.2 Participant UX Principles`, `6. Multilingual Rendering`, `7. Start Screen`, `8. Section Structure`, `12. Low Satisfaction Follow-up`, `14. Image/Floorplan Tagging`, `19. Draft`, `20. Review`, `21. Complete`, `25. Mobile/Accessibility`.
- TDD sections: `13. Question Rendering`, `18. Error Handling`.

## UX principles

- Reduce burden on the first screen: purpose, time, privacy/use of answers.
- Use section-by-section progress instead of showing everything at once.
- Keep one clear answer task per screen or compact group.
- Prefer choices over free text.
- Ask free text only as useful clarification.
- Skip irrelevant questions when the participant lacks experience.
- Ask low-score reasons only when needed.
- Keep image/floorplan interaction plain and physical: "tap the place".
- Always show progress and remaining effort.
- End with confidence that the answer will be used.

## Copy rules

- Avoid technical terms like "image tagging", "payload", "cache", "schema", "validation".
- Explain draft restore as same-device/browser only.
- Validation errors should say what to fix and where to go.
- Button labels should be action-first: start, continue, save tag, review, submit.
- For Korean, use polite but light survey language.
- For English, use concise student-facing phrasing, not administrative prose.
- Do not translate option values into stored data; copy is display-only.

## Core message patterns

Start screen:

```text
약 7-10분 정도 소요됩니다.
응답은 생활관 시설 개선과 자치회 사업 기획에 활용됩니다.
내가 경험한 항목만 답하면 됩니다.
```

Access denied:

```text
이 설문은 한동대학교 계정(@handong.ac.kr)으로만 참여할 수 있습니다.
학교 Google 계정으로 다시 로그인해주세요.
```

Draft restore:

```text
이전에 작성하던 응답이 있습니다.
같은 기기와 브라우저에서만 이어서 작성할 수 있습니다.
```

Image/floorplan prompt:

```text
사진에서 불편한 위치를 눌러주세요.
도면에서 개선이 필요한 곳을 선택해주세요.
```

Complete:

```text
응답이 제출되었습니다.
남겨주신 의견은 생활관 개선 우선순위를 정하고 보고 자료를 만드는 데 활용됩니다.
```

## Accessibility checks

- Controls have visible focus states.
- Touch targets are large enough for mobile.
- Errors are not conveyed by color alone.
- Progress and completion states have text alternatives.
- Image pin controls can be reviewed, edited, and deleted without relying only on precision tapping.
- Text does not overlap controls at mobile widths.

## Sub-agent routing

When available, use `taglow-participant-ux-auditor` for a read-only review of a completed screen or flow. Ask it for `BLOCK`, `WARN`, and `FYI` findings with file/line references.

