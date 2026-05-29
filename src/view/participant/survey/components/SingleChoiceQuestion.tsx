import { QuestionShell } from './QuestionShell';
import type { QuestionComponentProps } from './questionComponentTypes';
import { getDisplayOptions } from './questionOptions';
import './css/SingleChoiceQuestion.css';

export function SingleChoiceQuestion(props: QuestionComponentProps<unknown>) {
  const value = typeof props.value === 'string' ? props.value : '';
  const options = getDisplayOptions(props.question, props.locale, props.fallbackLocale);

  return (
    <QuestionShell question={props.question} locale={props.locale} fallbackLocale={props.fallbackLocale} error={props.error} number={props.number}>
      <div className="single-choice-question" role="radiogroup" aria-labelledby={`${props.question.id}-title`}>
        {options.map((option) => (
          <label
            key={option.value}
            className={`single-choice-question__option${value === option.value ? ' is-selected' : ''}`}
          >
            <input
              type="radio"
              name={props.question.id}
              value={option.value}
              checked={value === option.value}
              onChange={() => props.onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </QuestionShell>
  );
}
