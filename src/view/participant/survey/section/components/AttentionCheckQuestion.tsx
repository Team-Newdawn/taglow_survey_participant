import type { CSSProperties } from 'react';

import { getSurveyLocaleCopy } from '../../surveyLocaleCopy';
import { QuestionShell } from './QuestionShell';
import type { QuestionComponentProps } from './questionComponentTypes';
import { getDisplayOptions } from './questionOptions';
import { readScaleLabels } from './ScaleQuestion';
import './css/AttentionCheckQuestion.css';

export function AttentionCheckQuestion(props: QuestionComponentProps<unknown>) {
  const scoreValue = readScoreValue(props.value);
  const choiceValue = typeof props.value === 'string' ? props.value : '';
  const options = getDisplayOptions(props.question, props.locale, props.fallbackLocale);
  const shouldRenderScale = readScoreValue(props.question.config.expectedValue) !== undefined;
  const copy = getSurveyLocaleCopy(props.locale);
  const labels = readScaleLabels(props.question, props.locale, props.fallbackLocale);
  const scores = Array.from({ length: labels?.length ?? 5 }, (_, index) => index + 1);

  return (
    <QuestionShell question={props.question} locale={props.locale} fallbackLocale={props.fallbackLocale} error={props.error} number={props.number}>
      {shouldRenderScale ? (
        <div className="scale-question">
          <div className="scale-question__labels">
            <span>{labels?.[0] ? `1 ${labels[0]}` : copy.scaleLowLabel}</span>
            <span>
              {labels?.[labels.length - 1]
                ? `${labels.length} ${labels[labels.length - 1]}`
                : copy.scaleHighLabel}
            </span>
          </div>
          <div
            className={`scale-question__buttons${labels ? ' has-configured-labels' : ''}`}
            style={{ '--scale-option-count': scores.length } as CSSProperties}
          >
            {scores.map((score) => (
              <button
                key={score}
                type="button"
                className={scoreValue === score ? 'is-selected' : ''}
                aria-label={labels?.[score - 1] ? `${score} ${labels[score - 1]}` : String(score)}
                onClick={() => props.onChange(score)}
              >
                <span className="scale-question__score">{score}</span>
                {labels?.[score - 1] ? <span className="scale-question__score-label">{labels[score - 1]}</span> : null}
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
