import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { PublicQuestion } from '../../../../../api/participant';
import { publishedSurveyFixture } from '../../../../../test/fixtures/publicSurveyFixture';
import { MultiSelectQuestionGroup } from '../MultiSelectQuestionGroup';

const baseQuestion = publishedSurveyFixture.sections[1].questions[1];

describe('MultiSelectQuestionGroup', () => {
  it('renders grouped multi-select options as checkboxes', async () => {
    const onChange = vi.fn();
    const questions = [
      buildGroupedQuestion('time-1', 0, '05_00_07_00', '05:00~07:00'),
      buildGroupedQuestion('time-2', 1, '07_00_09_00', '07:00~09:00'),
    ];

    render(
      <MultiSelectQuestionGroup
        groupTitle="주로 사용하는 시간대를 선택해주세요."
        questions={questions}
        locale="ko"
        fallbackLocale="ko"
        values={{}}
        missingQuestionIds={[]}
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByRole('checkbox', { name: '05:00~07:00' }));

    expect(onChange).toHaveBeenCalledWith('time-1', { selectedOptions: ['05_00_07_00'] });
  });
});

function buildGroupedQuestion(id: string, orderIndex: number, value: string, label: string): PublicQuestion {
  return {
    ...baseQuestion,
    id,
    questionKey: id,
    orderIndex,
    isRequired: true,
    config: {
      displayGroup: '주로 사용하는 시간대를 선택해주세요.',
      minSelect: 0,
      options: [{ value, label: { ko: label } }],
    },
    validation: {},
  };
}
