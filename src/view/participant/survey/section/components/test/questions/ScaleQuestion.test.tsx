import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { publishedSurveyFixture } from '../../../../../../../test/fixtures/publicSurveyFixture';
import { ScaleQuestion } from '../../questions/ScaleQuestion';

describe('ScaleQuestion', () => {
  const question = publishedSurveyFixture.sections[1].questions[0];

  it('emits a score value when a score is selected', async () => {
    const onChange = vi.fn();
    render(
      <ScaleQuestion
        question={question}
        assets={[]}
        locale="ko"
        fallbackLocale="ko"
        value={{}}
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '5' }));

    expect(onChange).toHaveBeenCalledWith({ scoreValue: 5 });
  });

  it('renders configured Korean scale labels from question config without changing the answer value', async () => {
    const onChange = vi.fn();
    render(
      <ScaleQuestion
        question={{
          ...question,
          config: {
            ...question.config,
            labelsKo: ['전혀 아님', '아님', '보통', '그럼', '매우 그럼'],
          },
        }}
        assets={[]}
        locale="ko"
        fallbackLocale="ko"
        value={{}}
        onChange={onChange}
      />,
    );

    expect(screen.getByText('전혀 아님')).toBeInTheDocument();
    expect(screen.getByText('매우 그럼')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '5 매우 그럼' }));

    expect(onChange).toHaveBeenCalledWith({ scoreValue: 5 });
  });

  it('renders as many score buttons as configured labels', async () => {
    const onChange = vi.fn();
    const labelsKo = ['참여경험없음', '매우 불만족', '불만족', '보통', '만족', '매우 만족', '들어본 적 없음'];

    render(
      <ScaleQuestion
        question={{
          ...question,
          config: {
            ...question.config,
            labelsKo,
          },
        }}
        assets={[]}
        locale="ko"
        fallbackLocale="ko"
        value={{}}
        onChange={onChange}
      />,
    );

    for (const [index, label] of labelsKo.entries()) {
      expect(screen.getByRole('button', { name: `${index + 1} ${label}` })).toBeInTheDocument();
    }

    await userEvent.click(screen.getByRole('button', { name: '7 들어본 적 없음' }));

    expect(onChange).toHaveBeenCalledWith({ scoreValue: 7 });
  });

  it('shows follow-up only below half of the configured scale label count', async () => {
    const labelsKo = ['참여경험없음', '매우 불만족', '불만족', '보통', '만족', '매우 만족', '들어본 적 없음'];
    const scaleQuestion = {
      ...question,
      config: {
        ...question.config,
        labelsKo,
      },
    };
    const { rerender } = render(
      <ScaleQuestion
        question={scaleQuestion}
        assets={[]}
        locale="ko"
        fallbackLocale="ko"
        value={{ scoreValue: 3 }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText('낮은 점수를 준 이유를 선택해주세요.')).toBeInTheDocument();

    rerender(
      <ScaleQuestion
        question={scaleQuestion}
        assets={[]}
        locale="ko"
        fallbackLocale="ko"
        value={{ scoreValue: 4 }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByText('낮은 점수를 준 이유를 선택해주세요.')).not.toBeInTheDocument();
  });

  it('shows follow-up through score 3 on a six-label scale', async () => {
    const sixLabelQuestion = {
      ...question,
      config: {
        ...question.config,
        labelsKo: ['매우 불만족', '불만족', '보통', '만족', '매우 만족', '해당 없음'],
      },
    };
    const { rerender } = render(
      <ScaleQuestion
        question={sixLabelQuestion}
        assets={[]}
        locale="ko"
        fallbackLocale="ko"
        value={{ scoreValue: 3 }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText('낮은 점수를 준 이유를 선택해주세요.')).toBeInTheDocument();

    rerender(
      <ScaleQuestion
        question={sixLabelQuestion}
        assets={[]}
        locale="ko"
        fallbackLocale="ko"
        value={{ scoreValue: 4 }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByText('낮은 점수를 준 이유를 선택해주세요.')).not.toBeInTheDocument();
  });

  it('shows low-score follow-up for score 1 or 2', () => {
    render(
      <ScaleQuestion
        question={question}
        assets={[]}
        locale="ko"
        fallbackLocale="ko"
        value={{ scoreValue: 2 }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText('낮은 점수를 준 이유를 선택해주세요.')).toBeInTheDocument();
  });

  it('does not show low-score follow-up for score 3', () => {
    render(
      <ScaleQuestion
        question={question}
        assets={[]}
        locale="ko"
        fallbackLocale="ko"
        value={{ scoreValue: 3 }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByText('낮은 점수를 준 이유를 선택해주세요.')).not.toBeInTheDocument();
    expect(screen.queryByText('필요하면 이유를 남겨주세요.')).not.toBeInTheDocument();
  });

  it('clears a stale low-score follow-up when score 3 is selected', async () => {
    const onChange = vi.fn();
    render(
      <ScaleQuestion
        question={question}
        assets={[]}
        locale="ko"
        fallbackLocale="ko"
        value={{ scoreValue: 2, lowScoreReason: 'low_quality', lowScoreText: '자주 고장납니다.' }}
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '3' }));

    expect(onChange).toHaveBeenCalledWith({ scoreValue: 3 });
  });
});
