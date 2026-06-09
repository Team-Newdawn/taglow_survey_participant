import { useRef, useState } from 'react';
import type { PointerEvent } from 'react';

import type { ParticipantImageTagPoint, ParticipantImageTagValue, SurveyAsset } from '../../../../../../api/participant';
import { useAssetUrlQuery, useParticipantQuestionImageUploadMutation } from '../../../../../../api/participant';
import { calculateImageRatio } from '../../../../../../utils/imageRatio';
import {
  isAllowedParticipantImageMimeType,
  mimeTypeMatches,
  PARTICIPANT_IMAGE_UPLOAD_MIME_TYPES,
  prepareParticipantImageUploadFile,
} from '../../../../../../utils/participantImageUpload';
import { getSurveyLocaleCopy } from '../../../surveyLocaleCopy';
import { ImageTagPointDialog } from './ImageTagPointDialog';
import { QuestionShell } from '../layout/QuestionShell';
import { getImageTagOptions } from './imageTagOptions';
import type { QuestionComponentProps } from '../utils/questionComponentTypes';
import { useStickerHintMotion } from './useStickerHintMotion';
import '../css/ImageTagQuestion.css';

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [editor, setEditor] = useState<ParticipantImageTagEditor | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [isPreparingUpload, setIsPreparingUpload] = useState(false);
  const uploadMutation = useParticipantQuestionImageUploadMutation();
  const value = readParticipantImageTagValue(props.value);
  const points = value.points ?? [];
  const copy = getSurveyLocaleCopy(props.locale);
  const maxTags = readNumber(props.question.config.maxTags) ?? readNumber(props.question.validation.maxSelections) ?? 3;
  const tagTypes = getImageTagOptions(props.question, props.locale, props.fallbackLocale);
  const acceptedMimeTypes = getAcceptedMimeTypes(props.question.config.acceptedMimeTypes);
  const accept = acceptedMimeTypes.join(',');
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

  const openFilePicker = () => {
    if (uploadMutation.isPending || isPreparingUpload) {
      return;
    }

    fileInputRef.current?.click();
  };

  const deletePoint = (index: number) => {
    props.onChange({
      ...value,
      points: points.filter((_, pointIndex) => pointIndex !== index),
    });
    setEditor(null);
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file, acceptedMimeTypes, props.locale);
    setFileError(validationError);

    if (validationError) {
      return;
    }

    setIsPreparingUpload(true);
    const preparedFile = await prepareParticipantImageUploadFile(file, { acceptedMimeTypes }).finally(() => {
      setIsPreparingUpload(false);
    });

    uploadMutation.mutate(
      { surveyId: props.question.surveyId, questionId: props.question.id, file: preparedFile },
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
      setEditor({ ...editor, error: copy.imageTagTextRequiredError });
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
        <input
          ref={fileInputRef}
          className="participant-image-tag-question__file-input"
          aria-label={copy.uploadImageLabel}
          tabIndex={-1}
          type="file"
          accept={accept}
          disabled={uploadMutation.isPending || isPreparingUpload}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';

            if (file) {
              void uploadFile(file);
            }
          }}
        />

        {isPreparingUpload ? <p>{copy.participantImagePreparing}</p> : null}
        {fileError ? <p className="image-tag-question__error">{fileError}</p> : null}
        {uploadMutation.isError ? <p className="image-tag-question__error">{copy.uploadError}</p> : null}
        {uploadedUrlQuery.isError ? <p className="image-tag-question__error">{copy.uploadedImageLoadError}</p> : null}

        <div
          className={canvasClassName}
          role="button"
          tabIndex={0}
          onClick={openFilePicker}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openFilePicker();
            }
          }}
        >
          {imageUrl ? (
            <div className="image-tag-question__image-stage">
              <img ref={imageRef} src={imageUrl} alt={copy.participantImageAlt} draggable={false} />
              {points.map((point, index) => (
                <button
                  key={point.id ?? `${point.xRatio}-${point.yRatio}-${index}`}
                  type="button"
                  className="image-tag-question__pin"
                  style={{ left: `${point.xRatio * 100}%`, top: `${point.yRatio * 100}%` }}
                  aria-label={copy.editLocationLabel(index + 1)}
                  onClick={(event) => {
                    event.stopPropagation();
                    setEditor({ index, point });
                  }}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          ) : (
            <div className="image-tag-question__placeholder">
              {value.image ? copy.participantImagePreparing : copy.participantImageEmpty}
            </div>
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
          <span className="image-tag-question__drag-hint">{copy.dragNewPinHint}</span>
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
            point={{ tagType: editor.point.tagType || tagTypes[0].value, textValue: editor.point.textValue }}
            tagTypes={tagTypes}
            reasonRequired={isTagTextRequired}
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

function validateFile(file: File, acceptedMimeTypes: string[], locale: 'ko' | 'en'): string | null {
  const copy = getSurveyLocaleCopy(locale);

  if (!file.type.startsWith('image/')) {
    return copy.imageOnlyError;
  }

  if (!isAllowedParticipantImageMimeType(file.type) || !acceptedMimeTypes.some((mimeType) => mimeTypeMatches(mimeType.trim(), file.type))) {
    return copy.unsupportedImageType;
  }

  return null;
}

function getAcceptedMimeTypes(value: unknown): string[] {
  const acceptedMimeTypes = readStringArray(value);
  if (acceptedMimeTypes.length === 0) {
    return [...PARTICIPANT_IMAGE_UPLOAD_MIME_TYPES];
  }

  const supportedMimeTypes = acceptedMimeTypes.filter((mimeType) =>
    PARTICIPANT_IMAGE_UPLOAD_MIME_TYPES.some((allowed) => mimeTypeMatches(mimeType, allowed)),
  );

  return supportedMimeTypes.length > 0 ? supportedMimeTypes : [...PARTICIPANT_IMAGE_UPLOAD_MIME_TYPES];
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
