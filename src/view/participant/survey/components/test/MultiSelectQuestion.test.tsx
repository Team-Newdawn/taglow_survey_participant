import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { publishedSurveyFixture } from '../../../../../test/fixtures/publicSurveyFixture';
import { MultiSelectQuestion } from '../MultiSelectQuestion';

describe('MultiSelectQuestion', () => {
  const question = publishedSurveyFixture.sections[1].questions[1];

  it('adds selected option values and respects max selection count', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <MultiSelectQuestion
        question={question}
        assets={[]}
        locale="ko"
        fallbackLocale="ko"
        value={{ selectedOptions: ['cleanliness', 'quantity'] }}
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByRole('checkbox', { name: '기타' }));
    expect(onChange).not.toHaveBeenCalled();

    rerender(
      <MultiSelectQuestion question={question} assets={[]} locale="ko" fallbackLocale="ko" value={{ selectedOptions: [] }} onChange={onChange} />,
    );
    await userEvent.click(screen.getByRole('checkbox', { name: '청결' }));

    expect(onChange).toHaveBeenCalledWith({ selectedOptions: ['cleanliness'] });
  });
});
