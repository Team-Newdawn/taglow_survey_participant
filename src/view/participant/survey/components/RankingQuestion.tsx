import { QuestionShell } from './QuestionShell';
import type { QuestionComponentProps } from './questionComponentTypes';
import { getDisplayOptions } from './questionOptions';
import './css/RankingQuestion.css';

type RankingItem = {
  rank: number;
  optionValue: string;
};

type RankingValue = {
  rankedOptions?: RankingItem[];
};

export function RankingQuestion(props: QuestionComponentProps<unknown>) {
  const value = readRankingValue(props.value);
  const rankedOptions = value.rankedOptions ?? [];
  const options = getDisplayOptions(props.question, props.locale, props.fallbackLocale);
  const maxRank = props.question.validation.maxSelections ?? props.question.config.maxSelections ?? 3;

  const toggle = (optionValue: string) => {
    const existing = rankedOptions.find((item) => item.optionValue === optionValue);
    const next = existing
      ? rankedOptions.filter((item) => item.optionValue !== optionValue)
      : rankedOptions.length < maxRank
        ? [...rankedOptions, { rank: rankedOptions.length + 1, optionValue }]
        : rankedOptions;

    props.onChange({
      rankedOptions: next.map((item, index) => ({ ...item, rank: index + 1 })),
    });
  };

  return (
    <QuestionShell question={props.question} locale={props.locale} fallbackLocale={props.fallbackLocale} error={props.error} number={props.number}>
      <div className="ranking-question">
        <p>가장 중요한 것부터 선택해주세요.</p>
        {options.map((option) => {
          const rank = rankedOptions.find((item) => item.optionValue === option.value)?.rank;
          return (
            <button key={option.value} type="button" className={rank ? 'is-selected' : ''} onClick={() => toggle(option.value)}>
              <span>{rank ? `${rank}순위` : '-'}</span>
              {option.label}
            </button>
          );
        })}
      </div>
    </QuestionShell>
  );
}

function readRankingValue(value: unknown): RankingValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as RankingValue) : {};
}
