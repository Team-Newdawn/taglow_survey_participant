import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { PublicQuestion } from '../../../../../../api/participant';
import { publishedSurveyFixture } from '../../../../../../test/fixtures/publicSurveyFixture';
import { AttentionCheckQuestion } from '../AttentionCheckQuestion';

describe('AttentionCheckQuestion', () => {
  const baseQuestion: PublicQuestion = {
    ...publishedSurveyFixture.sections[1].questions[0],
    id: 'question-attention',
    questionKey: 'attention_check',
    questionType: 'attention_check',
    title: { ko: '주의력 확인을 위해 3번을 선택해주세요.' },
    metricType: 'none',
    config: { expectedValue: 3 },
  };

  it('renders numeric attention checks with the scale answer UI', async () => {
    const onChange = vi.fn();

    render(
      <AttentionCheckQuestion
        question={baseQuestion}
        assets={[]}
        locale="ko"
        fallbackLocale="ko"
        value={undefined}
        onChange={onChange}
      />,
    );

    expect(screen.getByText('1 매우 낮음')).toBeInTheDocument();
    expect(screen.getByText('5 매우 높음')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '3' }));

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('keeps option-based attention checks as configured choices', async () => {
    const onChange = vi.fn();

    render(
      <AttentionCheckQuestion
        question={{
          ...baseQuestion,
          config: {
            expectedValue: 'agree',
            options: [
              { value: 'agree', label: { ko: '동의' } },
              { value: 'disagree', label: { ko: '비동의' } },
            ],
          },
        }}
        assets={[]}
        locale="ko"
        fallbackLocale="ko"
        value=""
        onChange={onChange}
      />,
    );

    expect(screen.queryByText('1 매우 낮음')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '동의' }));

    expect(onChange).toHaveBeenCalledWith('agree');
  });
});
