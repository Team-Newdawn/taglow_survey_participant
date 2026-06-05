import { useId } from 'react';

import type { Locale, PublicQuestion } from '../../../../../api/participant';
import { readLocalizedText } from '../../../../../utils/i18nText';
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

type MatrixColumn = {
  value: string;
  label: string;
};

type MatrixRow = {
  question: PublicQuestion;
  label: string;
  options: MatrixColumn[];
};

export function MultiSelectQuestionGroup(props: MultiSelectQuestionGroupProps) {
  const titleId = useId();
  const rows = props.questions.map((question) => ({
    question,
    label: readMultiSelectRowLabel(question, props.locale, props.fallbackLocale),
    options: getDisplayOptions(question, props.locale, props.fallbackLocale),
  }));
  const columns = buildMatrixColumns(rows);
  const selectedCount = rows.reduce((count, row) => count + row.options.filter((option) => isOptionSelected(props.values, row.question, option.value)).length, 0);
  const isRequired = props.questions.some((question) => question.isRequired);
  const minSelections = readSelectionCount(props.questions, ['minSelections', 'minSelect']) ?? (isRequired ? 1 : 0);
  const maxSelections = readSelectionCount(props.questions, ['maxSelections', 'maxSelect']);
  const hasError = props.questions.some((question) => props.missingQuestionIds.includes(question.id));
  const otherOption = rows.flatMap((row) => row.options.map((option) => ({ question: row.question, value: option.value, label: option.label }))).find(
    (option) => option.value === 'other' && isOptionSelected(props.values, option.question, option.value),
  );
  const copy = getSurveyLocaleCopy(props.locale);
  const headingLabel = `${typeof props.number === 'number' ? `${props.number}. ` : ''}${props.groupTitle}${isRequired ? ` ${copy.required}` : ''}`;

  const toggle = (question: PublicQuestion, optionValue: string) => {
    const value = readMultiSelectValue(props.values[question.id]);
    const selectedOptions = value.selectedOptions ?? [];
    const isSelected = selectedOptions.includes(optionValue);

    if (!isSelected && typeof maxSelections === 'number' && selectedCount >= maxSelections) {
      return;
    }

    const nextSelectedOptions = isSelected
      ? selectedOptions.filter((item) => item !== optionValue)
      : [...selectedOptions, optionValue];

    props.onChange(question.id, {
      ...value,
      selectedOptions: nextSelectedOptions,
      ...(optionValue === 'other' && isSelected ? { otherText: undefined } : {}),
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

      <div className="multi-select-question-group__matrix-scroll">
        <table className="multi-select-question-group__matrix">
          <thead>
            <tr>
              <th scope="col" className="multi-select-question-group__row-heading">
                <span className="multi-select-question-group__visually-hidden">{props.groupTitle}</span>
              </th>
              {columns.map((column) => (
                <th key={column.value} scope="col">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.question.id} className={props.missingQuestionIds.includes(row.question.id) ? 'has-error' : undefined}>
                <th scope="row">
                  {row.label}
                  {row.question.isRequired ? <span aria-label={copy.required}> *</span> : null}
                </th>
                {columns.map((column) => {
                  const option = row.options.find((item) => item.value === column.value);

                  if (!option) {
                    return (
                      <td key={column.value} className="multi-select-question-group__empty-cell">
                        <span aria-hidden="true">-</span>
                      </td>
                    );
                  }

                  const isSelected = isOptionSelected(props.values, row.question, option.value);
                  const isDisabled = !isSelected && typeof maxSelections === 'number' && selectedCount >= maxSelections;

                  return (
                    <td key={option.value}>
                      <label
                        className={`multi-select-question-group__matrix-option${isSelected ? ' is-selected' : ''}${isDisabled ? ' is-disabled' : ''}`}
                      >
                        <input
                          type="checkbox"
                          value={option.value}
                          checked={isSelected}
                          disabled={isDisabled}
                          aria-label={`${row.label}, ${option.label}`}
                          onChange={() => toggle(row.question, option.value)}
                        />
                      </label>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
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

function isOptionSelected(values: Record<string, unknown>, question: PublicQuestion, optionValue: string): boolean {
  return (readMultiSelectValue(values[question.id]).selectedOptions ?? []).includes(optionValue);
}

function buildMatrixColumns(rows: MatrixRow[]): MatrixColumn[] {
  const columns = new Map<string, MatrixColumn>();

  for (const row of rows) {
    for (const option of row.options) {
      if (!columns.has(option.value)) {
        columns.set(option.value, option);
      }
    }
  }

  return [...columns.values()];
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

function readMultiSelectRowLabel(question: PublicQuestion, locale: Locale, fallbackLocale: Locale): string {
  const localeLabel = readConfigString(question.config, locale === 'en' ? 'rowLabelEn' : 'rowLabelKo');
  const fallbackLabel = readConfigString(question.config, fallbackLocale === 'en' ? 'rowLabelEn' : 'rowLabelKo');
  const displayLocaleLabel = readConfigString(question.config, locale === 'en' ? 'displayLabelEn' : 'displayLabelKo');
  const displayFallbackLabel = readConfigString(question.config, fallbackLocale === 'en' ? 'displayLabelEn' : 'displayLabelKo');
  const sharedLabel = readConfigString(question.config, 'rowLabel') ?? readConfigString(question.config, 'displayLabel');
  const title = readLocalizedText(question.title, locale, fallbackLocale);

  return localeLabel ?? fallbackLabel ?? displayLocaleLabel ?? displayFallbackLabel ?? sharedLabel ?? extractBracketItemLabel(title) ?? title;
}

function readConfigString(config: PublicQuestion['config'], key: string): string | undefined {
  const value = config[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function extractBracketItemLabel(title: string): string | undefined {
  const match = title.match(/\[\s*(?:\(\d+\)\s*)?(.+?)\s*\]\s*$/);
  return match?.[1]?.trim();
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
