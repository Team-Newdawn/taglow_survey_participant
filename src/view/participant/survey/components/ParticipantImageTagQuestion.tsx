import { useRef, useState } from 'react';

import type { ParticipantImageTagPoint, ParticipantImageTagValue, SurveyAsset } from '../../../../api/participant';
import { useAssetUrlQuery, useParticipantQuestionImageUploadMutation } from '../../../../api/participant';
import { Button } from '../../../../components/Button';
import { calculateImageRatio } from '../../../../utils/imageRatio';
import { QuestionShell } from './QuestionShell';
import type { QuestionComponentProps } from './questionComponentTypes';
import { getDisplayOptions } from './questionOptions';
import './css/ImageTagQuestion.css';

type TagTypeOption = Readonly<{
  value: string;
  label: string;
}>;

const fallbackTagTypes: TagTypeOption[] = [{ value: 'suggestion', label: '건의' }];

export function ParticipantImageTagQuestion(props: QuestionComponentProps<unknown>) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const uploadMutation = useParticipantQuestionImageUploadMutation();
  const value = readParticipantImageTagValue(props.value);
  const points = value.points ?? [];
  const maxTags = readNumber(props.question.config.maxTags) ?? readNumber(props.question.validation.maxSelections) ?? 3;
  const tagTypes = getParticipantTagTypes(props);
  const accept = getAcceptAttribute(props.question.config.acceptedMimeTypes);
  const maxFileSizeMb = readNumber(props.question.config.maxFileSizeMb) ?? 10;
  const isTagTextRequired = props.question.validation.requiredTagText === true || props.question.config.requireText === true;
  const uploadedAsset = toUploadedAsset(value, props.question.surveyId);
  const uploadedUrlQuery = useAssetUrlQuery(uploadedAsset);
  const imageUrl = uploadedUrlQuery.data ?? value.image?.signedUrl;
  const canAddPoint = Boolean(imageUrl) && points.length < maxTags;

  const updatePoint = (index: number, patch: Partial<ParticipantImageTagPoint>) => {
    props.onChange({
      ...value,
      points: points.map((point, pointIndex) => (pointIndex === index ? { ...point, ...patch } : point)),
    });
  };

  const deletePoint = (index: number) => {
    props.onChange({
      ...value,
      points: points.filter((_, pointIndex) => pointIndex !== index),
    });
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
        },
      },
    );
  };

  const addPoint = (event: React.PointerEvent<HTMLImageElement>) => {
    if (!canAddPoint || !imageRef.current) {
      return;
    }

    const ratio = calculateImageRatio({ clientX: event.clientX, clientY: event.clientY }, imageRef.current.getBoundingClientRect());
    props.onChange({
      ...value,
      points: [
        ...points,
        {
          id: createClientId(),
          xRatio: ratio.xRatio,
          yRatio: ratio.yRatio,
          tagType: tagTypes[0]?.value ?? fallbackTagTypes[0].value,
          textValue: '',
        },
      ],
    });
  };

  return (
    <QuestionShell question={props.question} locale={props.locale} fallbackLocale={props.fallbackLocale} error={props.error}>
      <div className="image-tag-question participant-image-tag-question">
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
          {value.image?.storagePath ? <p className="participant-image-tag-question__file-meta">{value.image.storagePath}</p> : null}
        </div>

        <p>사진을 올린 뒤, 건의할 위치를 눌러 카테고리를 선택해주세요.</p>
        {fileError ? <p className="image-tag-question__error">{fileError}</p> : null}
        {uploadMutation.isError ? <p className="image-tag-question__error">사진을 업로드하지 못했습니다. 다시 시도해주세요.</p> : null}
        {uploadedUrlQuery.isError ? <p className="image-tag-question__error">업로드한 사진을 불러오지 못했습니다.</p> : null}

        <div className="image-tag-question__canvas">
          {imageUrl ? (
            <>
              <img ref={imageRef} src={imageUrl} alt="참여자가 올린 태깅 사진" onPointerDown={addPoint} />
              {points.map((point, index) => (
                <button
                  key={point.id ?? `${point.xRatio}-${point.yRatio}-${index}`}
                  type="button"
                  className="image-tag-question__pin"
                  style={{ left: `${point.xRatio * 100}%`, top: `${point.yRatio * 100}%` }}
                  aria-label={`${index + 1}번 위치`}
                >
                  {index + 1}
                </button>
              ))}
            </>
          ) : (
            <div className="image-tag-question__placeholder">
              {value.image ? '사진을 준비하고 있습니다.' : '사진을 올리면 태깅 영역이 표시됩니다.'}
            </div>
          )}
        </div>

        <p className="image-tag-question__count">
          {points.length}/{maxTags}개 위치
        </p>

        <div className="image-tag-question__points">
          {points.map((point, index) => (
            <article key={point.id ?? `${point.xRatio}-${point.yRatio}-${index}`}>
              <h3>{index + 1}번 위치</h3>
              <label>
                <span>카테고리</span>
                <select
                  aria-label={`${index + 1}번 위치 카테고리`}
                  value={point.tagType || tagTypes[0]?.value || fallbackTagTypes[0].value}
                  onChange={(event) => updatePoint(index, { tagType: event.target.value })}
                >
                  {tagTypes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <textarea
                aria-label={`${index + 1}번 위치 설명`}
                value={point.textValue ?? ''}
                placeholder={isTagTextRequired ? '설명을 적어주세요.' : '추가 설명을 적어주세요.'}
                onChange={(event) => updatePoint(index, { textValue: event.target.value })}
              />
              <Button type="button" variant="danger" onClick={() => deletePoint(index)}>
                삭제
              </Button>
            </article>
          ))}
        </div>
      </div>
    </QuestionShell>
  );
}

function readParticipantImageTagValue(value: unknown): ParticipantImageTagValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as ParticipantImageTagValue) : {};
}

function getParticipantTagTypes(props: QuestionComponentProps<unknown>): TagTypeOption[] {
  const configTagTypes = readStringArray(props.question.config.tagTypes);
  const configCategories = configTagTypes.length > 0 ? configTagTypes : readStringArray(props.question.config.categories);

  if (configCategories.length > 0) {
    return configCategories.map((item) => ({ value: item, label: item }));
  }

  const options = getDisplayOptions(props.question, props.locale, props.fallbackLocale);
  return options.length > 0 ? options : fallbackTagTypes;
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
