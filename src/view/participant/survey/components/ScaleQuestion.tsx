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
  onChange: (value: ScaleValue) => void;
  onScoreSelect?: (score: number, value: ScaleValue) => void;
};

export function ScaleQuestion(props: QuestionComponentProps<unknown>) {
  const value = readScaleValue(props.value);
  const threshold = readLowScoreThreshold(props.question);

  return (
    <QuestionShell question={props.question} locale={props.locale} fallbackLocale={props.fallbackLocale} error={props.error} number={props.number}>
      <ScaleQuestionBody value={value} threshold={threshold} onChange={props.onChange} />
    </QuestionShell>
  );
}

export function ScaleQuestionBody({ value, threshold, onChange, onScoreSelect }: ScaleQuestionBodyProps) {
  const selectScore = (score: number) => {
    const nextValue = createScaleValueForScore(value, score, threshold);
    onChange(nextValue);
    onScoreSelect?.(score, nextValue);
  };

  return (
    <div className="scale-question">
      <div className="scale-question__labels">
        <span>1 매우 낮음</span>
        <span>5 매우 높음</span>
      </div>
      <div className="scale-question__buttons">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            className={value.scoreValue === score ? 'is-selected' : ''}
            onClick={() => selectScore(score)}
          >
            {score}
          </button>
        ))}
      </div>
      <LowScoreFollowUp
        scoreValue={value.scoreValue}
        threshold={threshold}
        reason={value.lowScoreReason}
        text={value.lowScoreText}
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

export function readScaleValue(value: unknown): ScaleValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as ScaleValue) : {};
}
