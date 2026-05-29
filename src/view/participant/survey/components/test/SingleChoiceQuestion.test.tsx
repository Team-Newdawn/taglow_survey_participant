import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { publishedSurveyFixture } from '../../../../../test/fixtures/publicSurveyFixture';
import { SingleChoiceQuestion } from '../SingleChoiceQuestion';

describe('SingleChoiceQuestion', () => {
  const question = {
    ...publishedSurveyFixture.sections[1].questions[1],
    questionType: 'single_choice' as const,
  };

  it('renders configured options as radio choices and emits the selected value', async () => {
    const onChange = vi.fn();

    render(
      <SingleChoiceQuestion
        question={question}
        assets={[]}
        locale="ko"
        fallbackLocale="ko"
        value=""
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByRole('radio', { name: '청결' }));

    expect(onChange).toHaveBeenCalledWith('cleanliness');
  });

  it('checks the selected radio value', () => {
    render(
      <SingleChoiceQuestion
        question={question}
        assets={[]}
        locale="ko"
        fallbackLocale="ko"
        value="quantity"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('radio', { name: '수량' })).toBeChecked();
  });
});
