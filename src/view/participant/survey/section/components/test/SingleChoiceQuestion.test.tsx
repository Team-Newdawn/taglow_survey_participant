import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { publishedSurveyFixture } from '../../../../../../test/fixtures/publicSurveyFixture';
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

  it('renders matrix rows and columns when single choice is configured as a matrix', async () => {
    const onChange = vi.fn();

    render(
      <SingleChoiceQuestion
        question={{
          ...question,
          config: {
            matrixRows: [
              { value: '05_00_07_00', labelKo: '05:00~07:00' },
              { value: '07_00_09_00', labelKo: '07:00~09:00' },
            ],
            matrixColumns: [
              { value: 'mon', labelKo: '월요일' },
              { value: 'tue', labelKo: '화요일' },
            ],
            matrixValueSeparator: '_',
            options: [
              { value: 'mon_05_00_07_00', label: { ko: '월요일 - 05:00~07:00' } },
              { value: 'tue_05_00_07_00', label: { ko: '화요일 - 05:00~07:00' } },
              { value: 'mon_07_00_09_00', label: { ko: '월요일 - 07:00~09:00' } },
              { value: 'tue_07_00_09_00', label: { ko: '화요일 - 07:00~09:00' } },
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

    expect(screen.getByRole('columnheader', { name: '월요일' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '화요일' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: '05:00~07:00' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: '07:00~09:00' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: '05:00~07:00, 월요일' }));

    expect(onChange).toHaveBeenCalledWith('mon_05_00_07_00');
  });
});
