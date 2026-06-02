import { useRef, useState } from 'react';
import type { PointerEvent } from 'react';

import type { ImageTagPoint } from '../../../../../api/participant';
import { useAssetUrlQuery } from '../../../../../api/participant';
import { calculateImageRatio } from '../../../../../utils/imageRatio';
import { getSurveyLocaleCopy } from '../../surveyLocaleCopy';
import { ImageTagPointDialog } from './ImageTagPointDialog';
import { QuestionShell } from './QuestionShell';
import { getImageTagOptions } from './imageTagOptions';
import type { QuestionComponentProps } from './questionComponentTypes';
import { useStickerHintMotion } from './useStickerHintMotion';
import './css/ImageTagQuestion.css';

type ImageTagValue = {
  points?: ImageTagPoint[];
};

type ImageTagEditor = {
  index: number | null;
  point: ImageTagPoint;
  error?: string;
};

type DragPreview = {
  clientX: number;
  clientY: number;
};

export function ImageTagQuestion(props: QuestionComponentProps<unknown>) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragDotRef = useRef<HTMLButtonElement | null>(null);
  const [editor, setEditor] = useState<ImageTagEditor | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const value = readImageTagValue(props.value);
  const points = value.points ?? [];
  const tagTypes = getImageTagOptions(props.question, props.locale, props.fallbackLocale);
  const copy = getSurveyLocaleCopy(props.locale);
  const asset =
    props.assets.find((item) => item.id === props.question.config.assetId) ??
    props.assets.find((item) => item.questionId === props.question.id || item.sectionId === props.question.sectionId);
  const preloadedAssetUrl = asset ? props.assetUrls?.[asset.id] : undefined;
  const assetUrlQuery = useAssetUrlQuery(asset, { enabled: !preloadedAssetUrl });
  const assetUrl = preloadedAssetUrl ?? assetUrlQuery.data;
  const maxTags = props.question.config.maxTags ?? props.question.validation.maxSelections ?? 5;
  const canAddPoint = Boolean(asset && assetUrl && points.length < maxTags);
  const isDraggingNewPoint = Boolean(dragPreview);
  const shouldShowStickerHint = canAddPoint && points.length === 0 && !isDraggingNewPoint && !editor;
  const { rootRef, hintStyle } = useStickerHintMotion(shouldShowStickerHint, imageRef, dragDotRef);
  const rootClassName = isDraggingNewPoint ? 'image-tag-question is-dragging' : 'image-tag-question';
  const canvasClassName = isDraggingNewPoint ? 'image-tag-question__canvas is-drop-ready' : 'image-tag-question__canvas';
  const editorIndex = editor?.index;
  const deleteEditorPoint = typeof editorIndex === 'number' ? () => deletePoint(editorIndex) : undefined;

  const deletePoint = (index: number) => {
    props.onChange({ points: points.filter((_, pointIndex) => pointIndex !== index) });
    setEditor(null);
  };

  const openNewPointEditor = (clientX: number, clientY: number) => {
    if (!asset || !imageRef.current || !canAddPoint) {
      return;
    }

    const imageRect = imageRef.current.getBoundingClientRect();
    if (!isPointInsideRect(clientX, clientY, imageRect)) {
      return;
    }

    const ratio = calculateImageRatio({ clientX, clientY }, imageRect);
    setEditor({
      index: null,
      point: {
        assetId: asset.id,
        xRatio: ratio.xRatio,
        yRatio: ratio.yRatio,
        tagType: tagTypes[0].value,
        severity: 2,
        textValue: '',
      },
    });
  };

  const startDraggingNewPoint = (event: PointerEvent<HTMLButtonElement>) => {
    if (!canAddPoint) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragPreview({ clientX: event.clientX, clientY: event.clientY });
  };

  const moveDraggingNewPoint = (event: PointerEvent<HTMLButtonElement>) => {
    if (!dragPreview) {
      return;
    }

    setDragPreview({ clientX: event.clientX, clientY: event.clientY });
  };

  const finishDraggingNewPoint = (event: PointerEvent<HTMLButtonElement>) => {
    if (!dragPreview) {
      return;
    }

    event.preventDefault();
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setDragPreview(null);
    openNewPointEditor(event.clientX, event.clientY);
  };

  const updateEditorPoint = (patch: Partial<ImageTagPoint>) => {
    setEditor((current) => (current ? { ...current, point: { ...current.point, ...patch }, error: undefined } : current));
  };

  const saveEditorPoint = () => {
    if (!editor) {
      return;
    }

    const textValue = editor.point.textValue.trim();
    if (!textValue) {
      setEditor({ ...editor, error: copy.imageTagTextRequiredError });
      return;
    }

    const savedPoint = { ...editor.point, textValue };
    props.onChange({
      points: editor.index === null ? [...points, savedPoint] : points.map((point, index) => (index === editor.index ? savedPoint : point)),
    });
    setEditor(null);
  };

  return (
    <QuestionShell question={props.question} locale={props.locale} fallbackLocale={props.fallbackLocale} error={props.error} number={props.number}>
      <div ref={rootRef} className={rootClassName}>
        <p>{copy.imageTagInstruction}</p>
        {!asset ? <p className="image-tag-question__error">{copy.imageMissing}</p> : null}
        {assetUrlQuery.isError ? <p className="image-tag-question__error">{copy.imageLoadError}</p> : null}
        <div className={canvasClassName}>
          {assetUrl ? (
            <div className="image-tag-question__image-stage">
              <img ref={imageRef} src={assetUrl} alt={copy.imageAlt} draggable={false} />
              {points.map((point, index) => (
                <button
                  key={`${point.xRatio}-${point.yRatio}-${index}`}
                  type="button"
                  className="image-tag-question__pin"
                  style={{ left: `${point.xRatio * 100}%`, top: `${point.yRatio * 100}%` }}
                  aria-label={copy.editLocationLabel(index + 1)}
                  onClick={() => setEditor({ index, point })}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          ) : (
            <div className="image-tag-question__placeholder">{copy.imagePreparing}</div>
          )}
        </div>

        <div className="image-tag-question__toolbelt">
          <button
            ref={dragDotRef}
            type="button"
            className="image-tag-question__drag-dot"
            disabled={!canAddPoint}
            aria-label={copy.dragNewPinLabel}
            onPointerDown={startDraggingNewPoint}
            onPointerMove={moveDraggingNewPoint}
            onPointerUp={finishDraggingNewPoint}
            onPointerCancel={() => setDragPreview(null)}
          >
            <span aria-hidden="true" />
          </button>
        </div>

        {shouldShowStickerHint ? <span className="image-tag-question__sticker-hint" style={hintStyle} aria-hidden="true" /> : null}

        {dragPreview ? (
          <span
            className="image-tag-question__drag-preview"
            style={{ left: `${dragPreview.clientX}px`, top: `${dragPreview.clientY}px` }}
            aria-hidden="true"
          />
        ) : null}

        {editor ? (
          <ImageTagPointDialog
            title={editor.index === null ? copy.imageTagDialogNewTitle : copy.imageTagDialogEditTitle(editor.index + 1)}
            point={editor.point}
            tagTypes={tagTypes}
            reasonRequired
            locale={props.locale}
            error={editor.error}
            onChange={updateEditorPoint}
            onCancel={() => setEditor(null)}
            onDelete={deleteEditorPoint}
            onSave={saveEditorPoint}
          />
        ) : null}
      </div>
    </QuestionShell>
  );
}

function readImageTagValue(value: unknown): ImageTagValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as ImageTagValue) : {};
}

function isPointInsideRect(clientX: number, clientY: number, rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>): boolean {
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    clientX >= rect.left &&
    clientX <= rect.left + rect.width &&
    clientY >= rect.top &&
    clientY <= rect.top + rect.height
  );
}
