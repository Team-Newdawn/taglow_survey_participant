import { useId } from 'react';

import type { Locale } from '../../../../api/participant';
import { Button } from '../../../../components/Button';
import { getSurveyLocaleCopy } from '../surveyLocaleCopy';
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
  locale: Locale;
  error?: string;
  onChange: (patch: Partial<ImageTagDialogPoint>) => void;
  onCancel: () => void;
  onDelete?: () => void;
  onSave: () => void;
};

export function ImageTagPointDialog(props: ImageTagPointDialogProps) {
  const titleId = useId();
  const copy = getSurveyLocaleCopy(props.locale);

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
          <p>{copy.imageTagDialogDescription}</p>
        </div>

        <label className="image-tag-question__dialog-field">
          <span>{copy.imageTagCategory}</span>
          <select
            autoFocus
            aria-label={copy.imageTagCategory}
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
          <span>{props.reasonRequired ? copy.imageTagReason : copy.imageTagReasonOptional}</span>
          <textarea
            aria-label={copy.imageTagReason}
            value={props.point.textValue ?? ''}
            placeholder={props.reasonRequired ? copy.imageTagReasonPlaceholder : copy.imageTagReasonOptionalPlaceholder}
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
              {copy.delete}
            </Button>
          ) : null}
          <Button type="button" variant="secondary" onClick={props.onCancel}>
            {copy.cancel}
          </Button>
          <Button type="button" onClick={props.onSave}>
            {copy.save}
          </Button>
        </div>
      </div>
    </div>
  );
}
