import { useId } from 'react';

import { Button } from '../../../../components/Button';
import type { ImageTagOption } from './imageTagOptions';

export type ImageTagDialogPoint = {
  tagType: string;
  textValue?: string;
};

type ImageTagPointDialogProps = {
  title: string;
  point: ImageTagDialogPoint;
  tagTypes: ImageTagOption[];
  reasonRequired: boolean;
  error?: string;
  onChange: (patch: Partial<ImageTagDialogPoint>) => void;
  onCancel: () => void;
  onDelete?: () => void;
  onSave: () => void;
};

export function ImageTagPointDialog(props: ImageTagPointDialogProps) {
  const titleId = useId();

  return (
    <div
      className="image-tag-question__dialog-backdrop"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          props.onCancel();
        }
      }}
    >
      <div
        className="image-tag-question__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            props.onCancel();
          }
        }}
      >
        <div className="image-tag-question__dialog-header">
          <h3 id={titleId}>{props.title}</h3>
          <p>선택한 위치에 남길 내용을 입력해주세요.</p>
        </div>

        <label className="image-tag-question__dialog-field">
          <span>카테고리</span>
          <select
            autoFocus
            aria-label="카테고리"
            value={props.point.tagType}
            onChange={(event) => props.onChange({ tagType: event.target.value })}
          >
            {props.tagTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="image-tag-question__dialog-field">
          <span>{props.reasonRequired ? '이유' : '이유 (선택)'}</span>
          <textarea
            aria-label="이유"
            value={props.point.textValue ?? ''}
            placeholder={props.reasonRequired ? '어떤 부분인지 짧게 적어주세요.' : '필요하면 추가 설명을 적어주세요.'}
            onChange={(event) => props.onChange({ textValue: event.target.value })}
          />
        </label>

        {props.error ? (
          <p className="image-tag-question__dialog-error" role="alert">
            {props.error}
          </p>
        ) : null}

        <div className="image-tag-question__dialog-actions">
          {props.onDelete ? (
            <Button type="button" variant="danger" onClick={props.onDelete}>
              삭제
            </Button>
          ) : null}
          <Button type="button" variant="secondary" onClick={props.onCancel}>
            취소
          </Button>
          <Button type="button" onClick={props.onSave}>
            저장
          </Button>
        </div>
      </div>
    </div>
  );
}
