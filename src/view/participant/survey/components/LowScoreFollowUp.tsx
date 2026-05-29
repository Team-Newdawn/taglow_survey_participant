import './css/LowScoreFollowUp.css';

type LowScoreFollowUpProps = {
  scoreValue: number | undefined;
  reason?: string;
  text?: string;
  threshold?: number;
  onChange: (value: { lowScoreReason?: string; lowScoreText?: string }) => void;
};

const reasons = [
  { value: 'insufficient_quantity', label: '수가 부족함' },
  { value: 'low_quality', label: '상태가 좋지 않음' },
  { value: 'hard_to_use', label: '사용이 불편함' },
  { value: 'missing_guidance', label: '안내가 부족함' },
  { value: 'other', label: '기타' },
];

export function LowScoreFollowUp({ scoreValue, reason, text, threshold = 2, onChange }: LowScoreFollowUpProps) {
  if (!scoreValue || scoreValue > threshold) {
    return null;
  }

  const required = scoreValue <= threshold;

  return (
    <div className="low-score-follow-up">
      <p>{required ? '낮은 점수를 준 이유를 선택해주세요.' : '필요하면 이유를 남겨주세요.'}</p>
      <div className="low-score-follow-up__chips">
        {reasons.map((item) => (
          <button
            key={item.value}
            type="button"
            className={reason === item.value ? 'is-selected' : ''}
            onClick={() => onChange({ lowScoreReason: item.value, lowScoreText: text })}
          >
            {item.label}
          </button>
        ))}
      </div>
      <textarea
        value={text ?? ''}
        placeholder="한 문장으로 더 적어주세요."
        onChange={(event) => onChange({ lowScoreReason: reason, lowScoreText: event.target.value })}
      />
    </div>
  );
}
