import { QuestionShell } from './QuestionShell';
import type { QuestionComponentProps } from './questionComponentTypes';
import { getDisplayOptions } from './questionOptions';
import './css/MultiSelectQuestion.css';

type MultiSelectValue = {
  selectedOptions?: string[];
  otherText?: string;
};

export function MultiSelectQuestion(props: QuestionComponentProps<unknown>) {
  const value = readMultiSelectValue(props.value);
  const selectedOptions = value.selectedOptions ?? [];
  const options = getDisplayOptions(props.question, props.locale, props.fallbackLocale);
  const minSelections = readSelectionLimit(
    props.question.validation.minSelections ?? props.question.validation.minSelect ?? props.question.config.minSelections ?? props.question.config.minSelect,
  );
  const maxSelections = readSelectionLimit(
    props.question.validation.maxSelections ?? props.question.validation.maxSelect ?? props.question.config.maxSelections ?? props.question.config.maxSelect,
  );

  const toggle = (optionValue: string) => {
    const isSelected = selectedOptions.includes(optionValue);
    if (!isSelected && maxSelections !== undefined && selectedOptions.length >= maxSelections) {
      return;
    }

    props.onChange({
      ...value,
      selectedOptions: isSelected ? selectedOptions.filter((item) => item !== optionValue) : [...selectedOptions, optionValue],
    });
  };

  return (
    <QuestionShell question={props.question} locale={props.locale} fallbackLocale={props.fallbackLocale} error={props.error} number={props.number}>
      <div className="multi-select-question">
        <p>{buildSelectionGuide({ selectedCount: selectedOptions.length, minSelections, maxSelections })}</p>
        <div className="multi-select-question__options">
          {options.map((option) => {
            const isSelected = selectedOptions.includes(option.value);
            const isDisabled = !isSelected && maxSelections !== undefined && selectedOptions.length >= maxSelections;

            return (
              <label
                key={option.value}
                className={`multi-select-question__option${isSelected ? ' is-selected' : ''}${isDisabled ? ' is-disabled' : ''}`}
              >
                <input
                  type="checkbox"
                  value={option.value}
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => toggle(option.value)}
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
        {selectedOptions.includes('other') ? (
          <label className="multi-select-question__other">
            기타 내용
            <input
              value={value.otherText ?? ''}
              placeholder="기타 내용을 적어주세요."
              onChange={(event) => props.onChange({ ...value, otherText: event.target.value })}
            />
          </label>
        ) : null}
      </div>
    </QuestionShell>
  );
}

function readMultiSelectValue(value: unknown): MultiSelectValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as MultiSelectValue) : {};
}

function readSelectionLimit(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

function buildSelectionGuide(args: { selectedCount: number; minSelections?: number; maxSelections?: number }): string {
  const selectedText = `${args.selectedCount}개 선택됨`;

  if (args.minSelections && args.maxSelections) {
    return `${selectedText} · ${args.minSelections}개 이상, 최대 ${args.maxSelections}개 선택`;
  }

  if (args.maxSelections) {
    return `${selectedText} · 최대 ${args.maxSelections}개 선택`;
  }

  if (args.minSelections) {
    return `${selectedText} · ${args.minSelections}개 이상 선택`;
  }

  return `${selectedText} · 해당하는 항목을 모두 선택해주세요.`;
}
