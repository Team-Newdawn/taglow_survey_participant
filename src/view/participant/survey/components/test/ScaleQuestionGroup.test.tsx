import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { PublicQuestion } from '../../../../../api/participant';
import { publishedSurveyFixture } from '../../../../../test/fixtures/publicSurveyFixture';
import { ScaleQuestionGroup } from '../ScaleQuestionGroup';

describe('ScaleQuestionGroup', () => {
  it('renders one group title and collapsed item rows', () => {
    render(<ControlledScaleQuestionGroup />);

    expect(screen.getByRole('heading', { name: /소등제도 만족도/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /소등시간/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /소등 여부/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '1' })).not.toBeInTheDocument();
  });

  it('prefers configured display labels over bracket labels', () => {
    render(
      <ScaleQuestionGroup
        groupTitle="소등제도 만족도"
        questions={[
          {
            ...buildGroupQuestion('scale-1', 0, '소등시간'),
            config: {
              displayGroup: '소등제도 만족도',
              displayLabelKo: '관리자가 지정한 항목명',
            },
          },
        ]}
        locale="ko"
        fallbackLocale="ko"
        values={{}}
        missingQuestionIds={[]}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /관리자가 지정한 항목명/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /소등시간/ })).not.toBeInTheDocument();
  });

  it('renders numbering only on the large group question', () => {
    render(
      <ScaleQuestionGroup
        groupTitle="소등제도 만족도"
        questions={[buildGroupQuestion('scale-1', 0, '소등시간'), buildGroupQuestion('scale-2', 1, '소등 여부')]}
        locale="ko"
        fallbackLocale="ko"
        values={{}}
        missingQuestionIds={[]}
        number={3}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: /^3\. 소등제도 만족도/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /소등시간/ })).not.toHaveTextContent(/^3\./);
    expect(screen.getByRole('button', { name: /소등 여부/ })).not.toHaveTextContent(/^4\./);
  });

  it('extracts item labels from bracket text without a source number', () => {
    render(
      <ScaleQuestionGroup
        groupTitle="세탁기 및 건조기 관리가 잘 이루어지고 있습니까?"
        questions={[
          {
            ...buildGroupQuestion('scale-1', 0, '세탁기'),
            title: { ko: '세탁기 및 건조기 관리가 잘 이루어지고 있습니까? [세탁기]' },
          },
          {
            ...buildGroupQuestion('scale-2', 1, '건조기'),
            title: { ko: '세탁기 및 건조기 관리가 잘 이루어지고 있습니까? [건조기]' },
          },
        ]}
        locale="ko"
        fallbackLocale="ko"
        values={{}}
        missingQuestionIds={[]}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /세탁기/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /건조기/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /관리가 잘 이루어지고 있습니까/ })).not.toBeInTheDocument();
  });

  it('expands an item and updates only that question value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ScaleQuestionGroup
        groupTitle="소등제도 만족도"
        questions={[buildGroupQuestion('scale-1', 0, '소등시간'), buildGroupQuestion('scale-2', 1, '소등 여부')]}
        locale="ko"
        fallbackLocale="ko"
        values={{}}
        missingQuestionIds={[]}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: /소등 여부/ }));
    await user.click(screen.getByRole('button', { name: '5' }));

    expect(onChange).toHaveBeenCalledWith('scale-2', { scoreValue: 5 });
  });

  it('opens the next scale row after selecting a score that does not need follow-up', async () => {
    const user = userEvent.setup();

    render(<ControlledScaleQuestionGroup />);

    await user.click(screen.getByRole('button', { name: /소등시간/ }));
    await user.click(screen.getByRole('button', { name: '3' }));

    expect(screen.getByRole('button', { name: /소등시간/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: /소등 여부/ })).toHaveAttribute('aria-expanded', 'true');
  });

  it('keeps the current scale row open after selecting a low score that needs follow-up', async () => {
    const user = userEvent.setup();

    render(<ControlledScaleQuestionGroup />);

    await user.click(screen.getByRole('button', { name: /소등시간/ }));
    await user.click(screen.getByRole('button', { name: '2' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /소등시간/ })).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('button', { name: /소등 여부/ })).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByText('낮은 점수를 준 이유를 선택해주세요.')).toBeInTheDocument();
    });
  });

  it('does not show low-score follow-up for score 3', async () => {
    const user = userEvent.setup();

    render(
      <ScaleQuestionGroup
        groupTitle="소등제도 만족도"
        questions={[buildGroupQuestion('scale-1', 0, '소등시간')]}
        locale="ko"
        fallbackLocale="ko"
        values={{ 'scale-1': { scoreValue: 3 } }}
        missingQuestionIds={[]}
        onChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /소등시간/ }));

    expect(screen.queryByText('낮은 점수를 준 이유를 선택해주세요.')).not.toBeInTheDocument();
    expect(screen.queryByText('필요하면 이유를 남겨주세요.')).not.toBeInTheDocument();
  });

  it('shows low-score follow-up for scores 1 or 2 inside the row', async () => {
    const user = userEvent.setup();

    render(
      <ScaleQuestionGroup
        groupTitle="소등제도 만족도"
        questions={[buildGroupQuestion('scale-1', 0, '소등시간')]}
        locale="ko"
        fallbackLocale="ko"
        values={{ 'scale-1': { scoreValue: 2 } }}
        missingQuestionIds={[]}
        onChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /소등시간/ }));

    expect(screen.getByText('낮은 점수를 준 이유를 선택해주세요.')).toBeInTheDocument();
  });

  it('expands the first missing required item and shows its row error', () => {
    render(
      <ScaleQuestionGroup
        groupTitle="소등제도 만족도"
        questions={[buildGroupQuestion('scale-1', 0, '소등시간'), buildGroupQuestion('scale-2', 1, '소등 여부')]}
        locale="ko"
        fallbackLocale="ko"
        values={{}}
        missingQuestionIds={['scale-2']}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByText('필수 문항입니다.')).toBeInTheDocument();
  });
});

function ControlledScaleQuestionGroup() {
  const [values, setValues] = useState<Record<string, unknown>>({});

  return (
    <ScaleQuestionGroup
      groupTitle="소등제도 만족도"
      questions={[buildGroupQuestion('scale-1', 0, '소등시간'), buildGroupQuestion('scale-2', 1, '소등 여부')]}
      locale="ko"
      fallbackLocale="ko"
      values={values}
      missingQuestionIds={[]}
      onChange={(questionId, value) => setValues((current) => ({ ...current, [questionId]: value }))}
    />
  );
}

function buildGroupQuestion(id: string, orderIndex: number, itemLabel: string): PublicQuestion {
  const question = publishedSurveyFixture.sections[1].questions[0];

  return {
    ...question,
    id,
    questionKey: id,
    orderIndex,
    title: { ko: `'소등제도'와 관련된 다음 항목에 대한 만족도에 대해 어떻게 생각하십니까? [(${orderIndex + 1}) ${itemLabel}]` },
    config: {
      ...question.config,
      displayGroup: "'소등제도'와 관련된 다음 항목에 대한 만족도에 대해 어떻게 생각하십니까?",
    },
  };
}
