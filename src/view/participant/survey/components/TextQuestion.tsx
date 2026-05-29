import type { Locale, PublicQuestion } from '../../../../api/participant';
import { readOptionLabel } from '../../../../utils/i18nText';
import { QuestionShell } from './QuestionShell';
import type { QuestionComponentProps } from './questionComponentTypes';
import { getDisplayOptions } from './questionOptions';
import './css/TextQuestion.css';

type TextValue = {
  topicValue?: string;
  spaceValue?: string;
  opinionType?: string;
  textValue?: string;
};

const defaultOpinionTypes = [
  { value: 'discomfort', label: '불편' },
  { value: 'improvement', label: '개선' },
  { value: 'praise', label: '칭찬' },
  { value: 'question', label: '문의' },
  { value: 'other', label: '기타' },
];

export function TextQuestion(props: QuestionComponentProps<unknown>) {
  const value = readTextValue(props.value);
  const opinionTypes = getTextOpinionOptions(props.question, props.locale, props.fallbackLocale);
  const isSelectionText = opinionTypes.length > 0;
  const isShortText = isShortTextQuestion(props.question);
  const maxLength = readTextMaxLength(props.question);

  return (
    <QuestionShell question={props.question} locale={props.locale} fallbackLocale={props.fallbackLocale} error={props.error} number={props.number}>
      <div className="text-question">
        {isSelectionText ? (
          <div className="text-question__opinion-group" role="radiogroup" aria-label="의견 유형">
            {opinionTypes.map((item) => (
              <label key={item.value} className={`text-question__opinion${value.opinionType === item.value ? ' is-selected' : ''}`}>
                <input
                  type="radio"
                  name={`${props.question.id}-opinion-type`}
                  value={item.value}
                  checked={value.opinionType === item.value}
                  onChange={() => props.onChange({ ...value, opinionType: item.value })}
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        ) : null}
        <label className="text-question__field">
          {isShortText ? (
            <input
              type="text"
              aria-labelledby={`${props.question.id}-title`}
              value={value.textValue ?? ''}
              maxLength={maxLength}
              onChange={(event) => props.onChange({ ...value, textValue: event.target.value })}
            />
          ) : (
            <textarea
              aria-labelledby={`${props.question.id}-title`}
              value={value.textValue ?? ''}
              maxLength={maxLength}
              onChange={(event) => props.onChange({ ...value, textValue: event.target.value })}
            />
          )}
        </label>
      </div>
    </QuestionShell>
  );
}

function readTextValue(value: unknown): TextValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as TextValue) : {};
}

function getTextOpinionOptions(question: PublicQuestion, locale: Locale, fallbackLocale: Locale) {
  const configuredOptions = getConfiguredOpinionOptions(question, locale, fallbackLocale);

  if (configuredOptions.length > 0) {
    return configuredOptions;
  }

  return question.config.requiresOpinionType === true || question.config.textMode === 'select_text' ? defaultOpinionTypes : [];
}

function isShortTextQuestion(question: PublicQuestion): boolean {
  return question.config.textMode === 'short' || question.config.multiline === false;
}

function readTextMaxLength(question: PublicQuestion): number | undefined {
  const maxLength = question.validation.maxLength ?? question.config.maxLength;

  return typeof maxLength === 'number' && Number.isFinite(maxLength) && maxLength > 0 ? maxLength : undefined;
}

function getConfiguredOpinionOptions(question: PublicQuestion, locale: Locale, fallbackLocale: Locale) {
  const optionArrays = [
    question.config.opinionTypes,
    question.config.textCategories,
    question.config.categoryOptions,
    question.config.opinionOptions,
  ];

  for (const options of optionArrays) {
    const normalized = normalizeOpinionOptions(options, locale, fallbackLocale);
    if (normalized.length > 0) {
      return normalized;
    }
  }

  return getDisplayOptions(question, locale, fallbackLocale);
}

function normalizeOpinionOptions(value: unknown, locale: Locale, fallbackLocale: Locale): Array<{ value: string; label: string }> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeOpinionOption(item, locale, fallbackLocale))
    .filter((item): item is { value: string; label: string } => Boolean(item));
}

function normalizeOpinionOption(value: unknown, locale: Locale, fallbackLocale: Locale): { value: string; label: string } | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return { value, label: value };
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as { value?: unknown; id?: unknown; key?: unknown; label?: unknown; labelKo?: unknown; labelEn?: unknown };
  const optionValue = readString(record.value) ?? readString(record.id) ?? readString(record.key);

  if (!optionValue) {
    return null;
  }

  return {
    value: optionValue,
    label: readOptionLabel(
      {
        value: optionValue,
        label:
          typeof record.label === 'object' && record.label !== null
            ? (record.label as { ko?: string; en?: string })
            : {
                ko: readString(record.labelKo) ?? readString(record.label) ?? optionValue,
                ...(readString(record.labelEn) ? { en: readString(record.labelEn) } : {}),
              },
      },
      locale,
      fallbackLocale,
    ),
  };
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}
