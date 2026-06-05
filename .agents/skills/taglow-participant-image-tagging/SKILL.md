---
name: taglow-participant-image-tagging
description: Build Taglow Survey image and floorplan tagging. Use when implementing image_tag questions, touch/click coordinate conversion, `xRatio`/`yRatio`, pins, tag type/severity/text forms, edit/delete, zoom, max tag limits, image loading errors, or image-tag answer persistence.
---

# Taglow Participant Image Tagging

Use this skill for the participant UI that lets users tap an image or floorplan and submit location-specific feedback.

## Read first

- PRD section: `14. Image/Floorplan Tagging`, plus `24. Validation` and `25. Mobile/Accessibility`.
- TDD v2 sections: `13.2 ImageTagQuestion`, `18. Storage Image Loading`, plus `15. Submission Payload` and `20. Test Strategy`.

## Participant wording

Do not show the technical phrase "image tagging" to participants. Use plain action copy:

```text
사진에서 불편한 위치를 눌러주세요.
도면에서 개선이 필요한 곳을 선택해주세요.
```

## Coordinate utility

Keep coordinate conversion pure and tested:

```ts
export function toImageRatio(args: {
  clientX: number;
  clientY: number;
  imageRect: DOMRect;
}): { xRatio: number; yRatio: number } {
  return {
    xRatio: clamp((args.clientX - args.imageRect.left) / args.imageRect.width, 0, 1),
    yRatio: clamp((args.clientY - args.imageRect.top) / args.imageRect.height, 0, 1),
  };
}
```

Render pins from ratios so they remain correct after responsive image resizing.

## UI flow

1. Resolve `questions.config.assetId` to a `survey_assets` row.
2. Load a signed URL through `ParticipantApiGateway.createSignedAssetUrl(bucket, path)` via controller/query behavior.
3. Render the image responsively.
4. Participant taps/clicks a location.
5. Show a pin at the ratio position.
6. Ask tag type: discomfort, improvement, risk, satisfaction, missing guidance, etc.
7. Ask severity when configured.
8. Ask for a short text explanation when required.
9. Save the point into the answer draft.
10. Allow edit/delete before final submission.
11. Prevent adding more than `max_tags`.

## Answer shape

Use one answer with points during form/draft:

```ts
export type ImageTagAnswerValue = {
  points: Array<{
    assetId: string;
    xRatio: number;
    yRatio: number;
    tagType: string;
    severity?: number;
    textValue: string;
  }>;
};
```

During submit mapping, expand each point into a separate `answers` row:

```text
answer_type = image_tag
asset_id = point.assetId
x_ratio = point.xRatio
y_ratio = point.yRatio
tag_type = point.tagType
severity = point.severity
text_value = point.textValue
```

## Mobile and accessibility

- Ensure tappable controls meet the app's minimum target size, normally 44px.
- Do not communicate pin state by color alone.
- Keep text inputs visible when mobile keyboard opens.
- Support keyboard reachable edit/delete controls for existing pins.
- If zoom/pan is added, keep pin placement deterministic after transforms.
- If image or signed URL loading fails, show a retry button and block submission for required image questions.
- Do not construct Supabase Storage URLs directly in view components.

## Tests to add

- center, edge, and out-of-bounds coordinates convert to clamped ratios.
- pins render in the correct ratio position after image resize.
- max tag limit blocks additional pins.
- edit/delete updates the draft.
- required text and ratio bounds are validated.
- two image points submit as two `answers` rows.
- signed asset URL failure shows retry and prevents required image submit.
