import type { Locale, PublicQuestion } from '../../../../../api/participant';
import { getSurveyLocaleCopy } from '../../surveyLocaleCopy';
import { QuestionShell } from './QuestionShell';
import type { QuestionComponentProps } from './questionComponentTypes';
import { LowScoreFollowUp } from './LowScoreFollowUp';
import './css/ScaleQuestion.css';

type ScaleValue = {
  scoreValue?: number;
  lowScoreReason?: string;
  lowScoreText?: string;
};

type ScaleQuestionBodyProps = {
  value: ScaleValue;
  threshold: number;
  locale: Locale;
  labels?: string[];
  onChange: (value: ScaleValue) => void;
  onScoreSelect?: (score: number, value: ScaleValue) => void;
};

export function ScaleQuestion(props: QuestionComponentProps<unknown>) {
  const value = readScaleValue(props.value);
  const threshold = readLowScoreThreshold(props.question);
  const labels = readScaleLabels(props.question, props.locale, props.fallbackLocale);

  return (
    <QuestionShell question={props.question} locale={props.locale} fallbackLocale={props.fallbackLocale} error={props.error} number={props.number}>
      <ScaleQuestionBody value={value} threshold={threshold} locale={props.locale} labels={labels} onChange={props.onChange} />
    </QuestionShell>
  );
}

export function ScaleQuestionBody({ value, threshold, locale, labels, onChange, onScoreSelect }: ScaleQuestionBodyProps) {
  const copy = getSurveyLocaleCopy(locale);
  const hasConfiguredLabels = Boolean(labels);
  const selectScore = (score: number) => {
    const nextValue = createScaleValueForScore(value, score, threshold);
    onChange(nextValue);
    onScoreSelect?.(score, nextValue);
  };

  return (
    <div className="scale-question">
      <div className="scale-question__labels">
        <span>{labels?.[0] ? `1 ${labels[0]}` : copy.scaleLowLabel}</span>
        <span>{labels?.[4] ? `5 ${labels[4]}` : copy.scaleHighLabel}</span>
      </div>
      <div className={`scale-question__buttons${hasConfiguredLabels ? ' has-configured-labels' : ''}`}>
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            className={value.scoreValue === score ? 'is-selected' : ''}
            aria-label={labels?.[score - 1] ? `${score} ${labels[score - 1]}` : String(score)}
            onClick={() => selectScore(score)}
          >
            <span className="scale-question__score">{score}</span>
            {labels?.[score - 1] ? <span className="scale-question__score-label">{labels[score - 1]}</span> : null}
          </button>
        ))}
      </div>
      <LowScoreFollowUp
        scoreValue={value.scoreValue}
        threshold={threshold}
        reason={value.lowScoreReason}
        text={value.lowScoreText}
        locale={locale}
        onChange={(next) => onChange({ ...value, ...next })}
      />
    </div>
  );
}

export function createScaleValueForScore(value: ScaleValue, score: number, threshold: number): ScaleValue {
  return score <= threshold ? { ...value, scoreValue: score } : { scoreValue: score };
}

export function readLowScoreThreshold(question: QuestionComponentProps['question']): number {
  return typeof question.config.lowScoreThreshold === 'number' ? question.config.lowScoreThreshold : 2;
}

export function readScaleLabels(question: PublicQuestion, locale: Locale, fallbackLocale: Locale): string[] | undefined {
  const localeLabels = readConfigLabelArray(question.config[locale === 'en' ? 'labelsEn' : 'labelsKo']);
  const fallbackLabels = readConfigLabelArray(question.config[fallbackLocale === 'en' ? 'labelsEn' : 'labelsKo']);
  const koreanLabels = readConfigLabelArray(question.config.labelsKo);

  return localeLabels ?? fallbackLabels ?? koreanLabels;
}

export function readScaleValue(value: unknown): ScaleValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as ScaleValue) : {};
}

function readConfigLabelArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const labels = value.map((label) => (typeof label === 'string' ? label.trim() : '')).slice(0, 5);

    return labels.length === 5 && labels.some(Boolean) ? labels : undefined;
  }

  if (typeof value !== 'object' || value === null) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const labels = [1, 2, 3, 4, 5].map((score) => {
    const label = record[String(score)] ?? record[`score${score}`];
    return typeof label === 'string' ? label.trim() : '';
  });

  return labels.some(Boolean) ? labels : undefined;
}
