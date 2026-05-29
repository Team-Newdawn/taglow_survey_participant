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
});
