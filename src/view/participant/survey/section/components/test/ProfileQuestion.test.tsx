import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { PublicQuestion } from '../../../../../../api/participant';
import { publishedSurveyFixture } from '../../../../../../test/fixtures/publicSurveyFixture';
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

  it('renders only the first profile field when no field key is available', () => {
    renderProfileQuestion();

    expect(screen.getByLabelText('성별')).toBeInTheDocument();
    expect(screen.queryByLabelText('학기')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('생활관 거주 경험')).not.toBeInTheDocument();
  });

  it('renders the overridden profile field as its own question shell', () => {
    renderProfileQuestion({ profileFieldKey: 'roomType' });

    expect(screen.getByRole('heading', { name: /인실/ })).toBeInTheDocument();
    expect(screen.getByLabelText('인실')).toBeInTheDocument();
    expect(screen.queryByLabelText('성별')).not.toBeInTheDocument();
  });

  it('uses configured database options when the profile field is inferred from the title', () => {
    renderProfileQuestion({
      question: {
        ...baseQuestion,
        questionKey: 'profile',
        title: { ko: '학기', en: 'Semester' },
        config: {
          options: [
            { value: 'freshman', label: { ko: '1학년' } },
            { value: 'sophomore', label: { ko: '2학년' } },
          ],
        },
      },
    });

    expect(screen.getByLabelText('학기')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '1학년' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '남성' })).not.toBeInTheDocument();
  });

  it('does not reuse composite profile options for an overridden split field', () => {
    renderProfileQuestion({
      question: {
        ...baseQuestion,
        questionKey: 'profile',
        title: { ko: '기본 정보를 선택해주세요.' },
        config: {
          options: [
            { value: 'male', label: { ko: '남성' } },
            { value: 'female', label: { ko: '여성' } },
          ],
        },
      },
      profileFieldKey: 'semesterGroup',
    });

    expect(screen.getByLabelText('학기')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '1~2학기' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '남성' })).not.toBeInTheDocument();
  });
});

function renderProfileQuestion(
  options: { question?: PublicQuestion; value?: unknown; onChange?: (value: unknown) => void; profileFieldKey?: Parameters<typeof ProfileQuestion>[0]['profileFieldKey'] } = {},
) {
  return render(
    <ProfileQuestion
      question={options.question ?? baseProfileQuestion}
      assets={[]}
      locale="ko"
      fallbackLocale="ko"
      value={options.value ?? {}}
      onChange={options.onChange ?? vi.fn()}
      profileFieldKey={options.profileFieldKey}
    />,
  );
}

const baseProfileQuestion = publishedSurveyFixture.sections[0].questions[0];
