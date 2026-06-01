import { getSurveyLocaleCopy } from '../surveyLocaleCopy';
import { QuestionShell } from './QuestionShell';
import type { QuestionComponentProps } from './questionComponentTypes';
import { getDisplayOptions } from './questionOptions';
import './css/AttentionCheckQuestion.css';

export function AttentionCheckQuestion(props: QuestionComponentProps<unknown>) {
  const scoreValue = readScoreValue(props.value);
  const choiceValue = typeof props.value === 'string' ? props.value : '';
  const options = getDisplayOptions(props.question, props.locale, props.fallbackLocale);
  const shouldRenderScale = readScoreValue(props.question.config.expectedValue) !== undefined;
  const copy = getSurveyLocaleCopy(props.locale);

  return (
    <QuestionShell question={props.question} locale={props.locale} fallbackLocale={props.fallbackLocale} error={props.error} number={props.number}>
      {shouldRenderScale ? (
        <div className="scale-question">
          <div className="scale-question__labels">
            <span>{copy.scaleLowLabel}</span>
            <span>{copy.scaleHighLabel}</span>
          </div>
          <div className="scale-question__buttons">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                type="button"
                className={scoreValue === score ? 'is-selected' : ''}
                onClick={() => props.onChange(score)}
              >
                {score}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="attention-check-question">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={choiceValue === option.value ? 'is-selected' : ''}
              onClick={() => props.onChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </QuestionShell>
  );
}

function readScoreValue(value: unknown): number | undefined {
  const numberValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.trim()) : undefined;
  return typeof numberValue === 'number' && Number.isInteger(numberValue) && numberValue >= 1 && numberValue <= 5 ? numberValue : undefined;
}
