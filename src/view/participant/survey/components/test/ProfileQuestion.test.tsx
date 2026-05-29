import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { PublicQuestion } from '../../../../../api/participant';
import { publishedSurveyFixture } from '../../../../../test/fixtures/publicSurveyFixture';
import { ProfileQuestion } from '../ProfileQuestion';

describe('ProfileQuestion', () => {
  const baseQuestion = publishedSurveyFixture.sections[0].questions[0];

  it('renders only the profile field matching an individual profile question key', () => {
    renderProfileQuestion({
      question: {
        ...baseQuestion,
        questionKey: 'gender',
        title: { ko: '성별' },
      },
    });

    expect(screen.getByLabelText('성별')).toBeInTheDocument();
    expect(screen.queryByLabelText('학기')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('학부')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('소속 RC')).not.toBeInTheDocument();
  });

  it('emits the selected value under the matching profile field key', async () => {
    const onChange = vi.fn();
    renderProfileQuestion({
      question: {
        ...baseQuestion,
        questionKey: 'semester_group',
        title: { ko: '학기' },
      },
      onChange,
    });

    await userEvent.selectOptions(screen.getByLabelText('학기'), '3_4');

    expect(onChange).toHaveBeenCalledWith({ semesterGroup: '3_4' });
  });

  it('keeps the composite profile question fallback for bundled profile forms', () => {
    renderProfileQuestion();

    expect(screen.getByLabelText('성별')).toBeInTheDocument();
    expect(screen.getByLabelText('학기')).toBeInTheDocument();
    expect(screen.getByLabelText('생활관 거주 경험')).toBeInTheDocument();
  });
});

function renderProfileQuestion(options: { question?: PublicQuestion; value?: unknown; onChange?: (value: unknown) => void } = {}) {
  return render(
    <ProfileQuestion
      question={options.question ?? baseProfileQuestion}
      assets={[]}
      locale="ko"
      fallbackLocale="ko"
      value={options.value ?? {}}
      onChange={options.onChange ?? vi.fn()}
    />,
  );
}

const baseProfileQuestion = publishedSurveyFixture.sections[0].questions[0];
