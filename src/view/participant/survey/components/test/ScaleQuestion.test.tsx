import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { publishedSurveyFixture } from '../../../../../test/fixtures/publicSurveyFixture';
import { ScaleQuestion } from '../ScaleQuestion';

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
