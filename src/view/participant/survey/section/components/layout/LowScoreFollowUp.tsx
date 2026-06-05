import type { Locale } from '../../../../../../api/participant';
import { getSurveyLocaleCopy } from '../../../surveyLocaleCopy';
import '../css/LowScoreFollowUp.css';

type LowScoreFollowUpProps = {
  scoreValue: number | undefined;
  reason?: string;
  text?: string;
  threshold?: number;
  locale: Locale;
  onChange: (value: { lowScoreReason?: string; lowScoreText?: string }) => void;
};

const reasons = [
  { value: 'insufficient_quantity', label: { ko: '수가 부족함', en: 'Not enough quantity' } },
  { value: 'low_quality', label: { ko: '상태가 좋지 않음', en: 'Poor condition' } },
  { value: 'hard_to_use', label: { ko: '사용이 불편함', en: 'Difficult to use' } },
  { value: 'missing_guidance', label: { ko: '안내가 부족함', en: 'Not enough guidance' } },
  { value: 'other', label: { ko: '기타', en: 'Other' } },
];

export function LowScoreFollowUp({ scoreValue, reason, text, threshold = 2, locale, onChange }: LowScoreFollowUpProps) {
  if (!scoreValue || scoreValue > threshold) {
    return null;
  }

  const required = scoreValue <= threshold;
  const copy = getSurveyLocaleCopy(locale);

  return (
    <div className="low-score-follow-up">
      <p>{required ? copy.lowScoreRequired : copy.lowScoreOptional}</p>
      <div className="low-score-follow-up__chips">
        {reasons.map((item) => (
          <button
            key={item.value}
            type="button"
            className={reason === item.value ? 'is-selected' : ''}
            onClick={() => onChange({ lowScoreReason: item.value, lowScoreText: text })}
          >
            {item.label[locale]}
          </button>
        ))}
      </div>
      <textarea
        value={text ?? ''}
        placeholder={copy.lowScoreTextPlaceholder}
        onChange={(event) => onChange({ lowScoreReason: reason, lowScoreText: event.target.value })}
      />
    </div>
  );
}
