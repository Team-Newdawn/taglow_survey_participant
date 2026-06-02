import { useId } from 'react';

import type { Locale, PublicQuestion } from '../../../../../api/participant';
import { getSurveyLocaleCopy, type SurveyLocaleCopy } from '../../surveyLocaleCopy';
import { getDisplayOptions } from './questionOptions';
import './css/MultiSelectQuestionGroup.css';

type MultiSelectQuestionGroupProps = {
  groupTitle: string;
  questions: PublicQuestion[];
  locale: Locale;
  fallbackLocale: Locale;
  values: Record<string, unknown>;
  missingQuestionIds: string[];
  number?: number;
  onChange: (questionId: string, value: unknown) => void;
};

type MultiSelectValue = {
  selectedOptions?: string[];
  otherText?: string;
};

type GroupOption = {
  question: PublicQuestion;
  value: string;
  label: string;
};

export function MultiSelectQuestionGroup(props: MultiSelectQuestionGroupProps) {
  const titleId = useId();
  const options = props.questions.flatMap((question) =>
    getDisplayOptions(question, props.locale, props.fallbackLocale).map((option) => ({
      question,
      value: option.value,
      label: option.label,
    })),
  );
  const selectedCount = options.filter((option) => isOptionSelected(props.values, option)).length;
  const isRequired = props.questions.some((question) => question.isRequired);
  const minSelections = readSelectionCount(props.questions, ['minSelections', 'minSelect']) ?? (isRequired ? 1 : 0);
  const maxSelections = readSelectionCount(props.questions, ['maxSelections', 'maxSelect']);
  const hasError = props.questions.some((question) => props.missingQuestionIds.includes(question.id));
  const otherOption = options.find((option) => option.value === 'other' && isOptionSelected(props.values, option));
  const copy = getSurveyLocaleCopy(props.locale);
  const headingLabel = `${typeof props.number === 'number' ? `${props.number}. ` : ''}${props.groupTitle}${isRequired ? ` ${copy.required}` : ''}`;

  const toggle = (option: GroupOption) => {
    const value = readMultiSelectValue(props.values[option.question.id]);
    const selectedOptions = value.selectedOptions ?? [];
    const isSelected = selectedOptions.includes(option.value);

    if (!isSelected && typeof maxSelections === 'number' && selectedCount >= maxSelections) {
      return;
    }

    const nextSelectedOptions = isSelected
      ? selectedOptions.filter((item) => item !== option.value)
      : [...selectedOptions, option.value];

    props.onChange(option.question.id, {
      ...value,
      selectedOptions: nextSelectedOptions,
      ...(option.value === 'other' && isSelected ? { otherText: undefined } : {}),
    });
  };

  return (
    <section className={`multi-select-question-group${hasError ? ' has-error' : ''}`} aria-labelledby={titleId}>
      <div className="multi-select-question-group__header">
        <h2 id={titleId} aria-label={headingLabel}>
          {typeof props.number === 'number' ? <span className="multi-select-question-group__number">{props.number}.</span> : null}
          <span className="multi-select-question-group__title-text">
            {props.groupTitle}
            {isRequired ? <span aria-label={copy.required}> *</span> : null}
          </span>
        </h2>
        <p>{buildSelectionGuide({ selectedCount, minSelections, maxSelections, copy })}</p>
      </div>

      <div className="multi-select-question-group__chips">
        {options.map((option) => {
          const isSelected = isOptionSelected(props.values, option);
          const isDisabled = !isSelected && typeof maxSelections === 'number' && selectedCount >= maxSelections;

          return (
            <label
              key={`${option.question.id}-${option.value}`}
              className={`multi-select-question-group__option${isSelected ? ' is-selected' : ''}${isDisabled ? ' is-disabled' : ''}`}
            >
              <input
                type="checkbox"
                value={option.value}
                checked={isSelected}
                disabled={isDisabled}
                onChange={() => toggle(option)}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>

      {otherOption ? (
        <label className="multi-select-question-group__other">
          {copy.otherTextLabel}
          <input
            value={readMultiSelectValue(props.values[otherOption.question.id]).otherText ?? ''}
            placeholder={copy.otherTextPlaceholder}
            onChange={(event) =>
              props.onChange(otherOption.question.id, {
                ...readMultiSelectValue(props.values[otherOption.question.id]),
                otherText: event.target.value,
              })
            }
          />
        </label>
      ) : null}

      {hasError ? <p className="multi-select-question-group__error">{copy.requiredQuestion}</p> : null}
    </section>
  );
}

function readMultiSelectValue(value: unknown): MultiSelectValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as MultiSelectValue) : {};
}

function isOptionSelected(values: Record<string, unknown>, option: GroupOption): boolean {
  return (readMultiSelectValue(values[option.question.id]).selectedOptions ?? []).includes(option.value);
}

function readSelectionCount(questions: PublicQuestion[], keys: string[]): number | undefined {
  for (const question of questions) {
    for (const source of [question.validation, question.config]) {
      for (const key of keys) {
        const value = source[key];
        if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
          return value;
        }
      }
    }
  }

  return undefined;
}

function buildSelectionGuide(args: { selectedCount: number; minSelections: number; maxSelections?: number; copy: SurveyLocaleCopy }): string {
  const selectedText = args.copy.selectedCount(args.selectedCount);

  if (args.maxSelections && args.minSelections > 0) {
    return `${selectedText} · ${args.copy.minMaxSelections(args.minSelections, args.maxSelections)}`;
  }

  if (args.maxSelections) {
    return `${selectedText} · ${args.copy.maxSelections(args.maxSelections)}`;
  }

  if (args.minSelections > 0) {
    return `${selectedText} · ${args.copy.minSelections(args.minSelections)}`;
  }

  return selectedText;
}
