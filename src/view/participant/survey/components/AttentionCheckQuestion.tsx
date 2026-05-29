import { QuestionShell } from './QuestionShell';
import type { QuestionComponentProps } from './questionComponentTypes';
import { getDisplayOptions } from './questionOptions';
import './css/AttentionCheckQuestion.css';

export function AttentionCheckQuestion(props: QuestionComponentProps<unknown>) {
  const value = typeof props.value === 'string' ? props.value : '';
  const options = getDisplayOptions(props.question, props.locale, props.fallbackLocale);

  return (
    <QuestionShell question={props.question} locale={props.locale} fallbackLocale={props.fallbackLocale} error={props.error} number={props.number}>
      <div className="attention-check-question">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={value === option.value ? 'is-selected' : ''}
            onClick={() => props.onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </QuestionShell>
  );
}
