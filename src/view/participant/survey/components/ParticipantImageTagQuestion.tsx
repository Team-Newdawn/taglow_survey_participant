import { useRef, useState } from 'react';
import type { PointerEvent } from 'react';

import type { ParticipantImageTagPoint, ParticipantImageTagValue, SurveyAsset } from '../../../../api/participant';
import { useAssetUrlQuery, useParticipantQuestionImageUploadMutation } from '../../../../api/participant';
import { calculateImageRatio } from '../../../../utils/imageRatio';
import { ImageTagPointDialog } from './ImageTagPointDialog';
import { QuestionShell } from './QuestionShell';
import { getImageTagOptions } from './imageTagOptions';
import type { QuestionComponentProps } from './questionComponentTypes';
import { useStickerHintMotion } from './useStickerHintMotion';
import './css/ImageTagQuestion.css';

type ParticipantImageTagEditor = {
  index: number | null;
  point: ParticipantImageTagPoint;
  error?: string;
};

type DragPreview = {
  clientX: number;
  clientY: number;
};

export function ParticipantImageTagQuestion(props: QuestionComponentProps<unknown>) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragDotRef = useRef<HTMLButtonElement | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [editor, setEditor] = useState<ParticipantImageTagEditor | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const uploadMutation = useParticipantQuestionImageUploadMutation();
  const value = readParticipantImageTagValue(props.value);
  const points = value.points ?? [];
  const maxTags = readNumber(props.question.config.maxTags) ?? readNumber(props.question.validation.maxSelections) ?? 3;
  const tagTypes = getImageTagOptions(props.question, props.locale, props.fallbackLocale);
  const accept = getAcceptAttribute(props.question.config.acceptedMimeTypes);
  const maxFileSizeMb = readNumber(props.question.config.maxFileSizeMb) ?? 10;
  const isTagTextRequired = props.question.validation.requiredTagText === true || props.question.config.requireText === true;
  const uploadedAsset = toUploadedAsset(value, props.question.surveyId);
  const uploadedUrlQuery = useAssetUrlQuery(uploadedAsset);
  const imageUrl = uploadedUrlQuery.data ?? value.image?.signedUrl;
  const canAddPoint = Boolean(imageUrl) && points.length < maxTags;
  const isDraggingNewPoint = Boolean(dragPreview);
  const shouldShowStickerHint = canAddPoint && points.length === 0 && !isDraggingNewPoint && !editor;
  const { rootRef, hintStyle } = useStickerHintMotion(shouldShowStickerHint, imageRef, dragDotRef);
  const rootClassName = isDraggingNewPoint
    ? 'image-tag-question participant-image-tag-question is-dragging'
    : 'image-tag-question participant-image-tag-question';
  const canvasClassName = isDraggingNewPoint ? 'image-tag-question__canvas is-drop-ready' : 'image-tag-question__canvas';
  const editorIndex = editor?.index;
  const deleteEditorPoint = typeof editorIndex === 'number' ? () => deletePoint(editorIndex) : undefined;

  const deletePoint = (index: number) => {
    props.onChange({
      ...value,
      points: points.filter((_, pointIndex) => pointIndex !== index),
    });
    setEditor(null);
  };

  const uploadFile = (file: File) => {
    const validationError = validateFile(file, accept, maxFileSizeMb);
    setFileError(validationError);

    if (validationError) {
      return;
    }

    uploadMutation.mutate(
      { surveyId: props.question.surveyId, questionId: props.question.id, file },
      {
        onSuccess: (uploaded) => {
          props.onChange({
            image: {
              storageBucket: uploaded.storageBucket,
              storagePath: uploaded.storagePath,
              metadata: uploaded.metadata,
            },
            points: [],
          });
          setEditor(null);
        },
      },
    );
  };

  const openNewPointEditor = (clientX: number, clientY: number) => {
    if (!canAddPoint || !imageRef.current) {
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
        id: createClientId(),
        xRatio: ratio.xRatio,
        yRatio: ratio.yRatio,
        tagType: tagTypes[0].value,
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

  const updateEditorPoint = (patch: Partial<ParticipantImageTagPoint>) => {
    setEditor((current) => (current ? { ...current, point: { ...current.point, ...patch }, error: undefined } : current));
  };

  const saveEditorPoint = () => {
    if (!editor) {
      return;
    }

    const textValue = editor.point.textValue?.trim() ?? '';
    if (isTagTextRequired && !textValue) {
      setEditor({ ...editor, error: '이유를 짧게 적어주세요.' });
      return;
    }

    const savedPoint = { ...editor.point, textValue };
    props.onChange({
      ...value,
      points: editor.index === null ? [...points, savedPoint] : points.map((point, index) => (index === editor.index ? savedPoint : point)),
    });
    setEditor(null);
  };

  return (
    <QuestionShell question={props.question} locale={props.locale} fallbackLocale={props.fallbackLocale} error={props.error} number={props.number}>
      <div ref={rootRef} className={rootClassName}>
        <div className="participant-image-tag-question__upload">
          <label className="participant-image-tag-question__upload-button">
            <span>{value.image ? '사진 다시 업로드' : '사진 업로드'}</span>
            <input
              aria-label="사진 업로드"
              type="file"
              accept={accept}
              disabled={uploadMutation.isPending}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';

                if (file) {
                  uploadFile(file);
                }
              }}
            />
          </label>
        </div>

        <p>사진을 올린 뒤, 건의할 위치를 선택해주세요.</p>
        {fileError ? <p className="image-tag-question__error">{fileError}</p> : null}
        {uploadMutation.isError ? <p className="image-tag-question__error">사진을 업로드하지 못했습니다. 다시 시도해주세요.</p> : null}
        {uploadedUrlQuery.isError ? <p className="image-tag-question__error">업로드한 사진을 불러오지 못했습니다.</p> : null}

        <div className={canvasClassName}>
          {imageUrl ? (
            <div className="image-tag-question__image-stage">
              <img ref={imageRef} src={imageUrl} alt="참여자가 올린 위치 선택 사진" draggable={false} />
              {points.map((point, index) => (
                <button
                  key={point.id ?? `${point.xRatio}-${point.yRatio}-${index}`}
                  type="button"
                  className="image-tag-question__pin"
                  style={{ left: `${point.xRatio * 100}%`, top: `${point.yRatio * 100}%` }}
                  aria-label={`${index + 1}번 위치 수정`}
                  onClick={() => setEditor({ index, point })}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          ) : (
            <div className="image-tag-question__placeholder">
              {value.image ? '사진을 준비하고 있습니다.' : '사진을 올리면 위치를 선택할 수 있습니다.'}
            </div>
          )}
        </div>

        <div className="image-tag-question__toolbelt">
          <button
            ref={dragDotRef}
            type="button"
            className="image-tag-question__drag-dot"
            disabled={!canAddPoint}
            aria-label="새 위치 스티커를 이미지로 드래그"
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
            title={editor.index === null ? '위치 내용 입력' : `${editor.index + 1}번 위치 수정`}
            point={{ tagType: editor.point.tagType || tagTypes[0].value, textValue: editor.point.textValue }}
            tagTypes={tagTypes}
            reasonRequired={isTagTextRequired}
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

function readParticipantImageTagValue(value: unknown): ParticipantImageTagValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as ParticipantImageTagValue) : {};
}

function toUploadedAsset(value: ParticipantImageTagValue, surveyId: string): SurveyAsset | undefined {
  if (!value.image) {
    return undefined;
  }

  return {
    id: value.image.storagePath,
    surveyId,
    assetType: 'participant_upload',
    storageBucket: value.image.storageBucket,
    storagePath: value.image.storagePath,
    metadata: value.image.metadata ?? {},
  };
}

function validateFile(file: File, accept: string, maxFileSizeMb: number): string | null {
  if (!file.type.startsWith('image/')) {
    return '이미지 파일만 업로드할 수 있습니다.';
  }

  if (!accept.split(',').some((mimeType) => mimeTypeMatches(mimeType.trim(), file.type))) {
    return '허용된 이미지 형식이 아닙니다.';
  }

  if (file.size > maxFileSizeMb * 1024 * 1024) {
    return `${maxFileSizeMb}MB 이하의 이미지만 업로드할 수 있습니다.`;
  }

  return null;
}

function mimeTypeMatches(accepted: string, actual: string): boolean {
  if (!accepted || accepted === '*/*') {
    return true;
  }

  if (accepted.endsWith('/*')) {
    return actual.startsWith(accepted.slice(0, -1));
  }

  return accepted === actual;
}

function getAcceptAttribute(value: unknown): string {
  const acceptedMimeTypes = readStringArray(value);
  return acceptedMimeTypes.length > 0 ? acceptedMimeTypes.join(',') : 'image/*';
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function createClientId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `pin-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
