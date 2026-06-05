import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { PublicQuestion } from '../../../../../../../api/participant';
import { publishedSurveyFixture } from '../../../../../../../test/fixtures/publicSurveyFixture';
import { MultiSelectQuestionGroup } from '../../groups/MultiSelectQuestionGroup';

const baseQuestion = publishedSurveyFixture.sections[1].questions[1];

describe('MultiSelectQuestionGroup', () => {
  it('renders grouped multi-select questions as a row and column matrix', async () => {
    const onChange = vi.fn();
    const questions = [
      buildGroupedQuestion('time-1', 0, '세탁실', [
        { value: 'morning', label: '아침' },
        { value: 'evening', label: '저녁' },
      ]),
      buildGroupedQuestion('time-2', 1, '휴게실', [
        { value: 'morning', label: '아침' },
        { value: 'evening', label: '저녁' },
      ]),
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

    expect(screen.getByRole('columnheader', { name: '아침' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '저녁' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: /세탁실/ })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: /휴게실/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('checkbox', { name: '세탁실, 아침' }));

    expect(onChange).toHaveBeenCalledWith('time-1', { selectedOptions: ['morning'] });
  });

  it('uses configured row labels before bracket labels', () => {
    const question = {
      ...buildGroupedQuestion('time-1', 0, '브라켓 항목', [{ value: 'morning', label: '아침' }]),
      config: {
        displayGroup: '주로 사용하는 시간대를 선택해주세요.',
        displayLabelKo: '설정된 행 이름',
        options: [{ value: 'morning', label: { ko: '아침' } }],
      },
    };

    render(
      <MultiSelectQuestionGroup
        groupTitle="주로 사용하는 시간대를 선택해주세요."
        questions={[question]}
        locale="ko"
        fallbackLocale="ko"
        values={{}}
        missingQuestionIds={[]}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('rowheader', { name: /설정된 행 이름/ })).toBeInTheDocument();
    expect(screen.queryByRole('rowheader', { name: /브라켓 항목/ })).not.toBeInTheDocument();
  });

  it('localizes selected counts and validation copy in English', () => {
    const questions = [
      buildGroupedQuestion('time-1', 0, '05:00~07:00', [{ value: 'weekday', label: 'Weekdays' }]),
      buildGroupedQuestion('time-2', 1, '07:00~09:00', [{ value: 'weekday', label: 'Weekdays' }]),
    ];

    render(
      <MultiSelectQuestionGroup
        groupTitle="Select your usual time slots."
        questions={questions}
        locale="en"
        fallbackLocale="ko"
        values={{}}
        missingQuestionIds={['time-1']}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/0 selected/)).toBeInTheDocument();
    expect(screen.getByText('This question is required.')).toBeInTheDocument();
    expect(screen.queryByText('0개 선택됨')).not.toBeInTheDocument();
  });
});

function buildGroupedQuestion(id: string, orderIndex: number, rowLabel: string, options: Array<{ value: string; label: string }>): PublicQuestion {
  return {
    ...baseQuestion,
    id,
    questionKey: id,
    orderIndex,
    isRequired: true,
    title: { ko: `주로 사용하는 시간대를 선택해주세요. [(${orderIndex + 1}) ${rowLabel}]` },
    config: {
      displayGroup: '주로 사용하는 시간대를 선택해주세요.',
      minSelect: 0,
      options: options.map((option) => ({ value: option.value, label: { ko: option.label, en: option.label } })),
    },
    validation: {},
  };
}
