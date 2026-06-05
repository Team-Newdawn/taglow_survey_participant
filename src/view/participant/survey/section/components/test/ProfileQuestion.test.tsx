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

  it('renders the database question title and configured options for a known field', async () => {
    const onChange = vi.fn();
    renderProfileQuestion({
      question: {
        ...baseQuestion,
        questionKey: 'dorm_25_2_q003',
        title: { ko: '학부 (1전공 기준)', en: 'Department (1st Major)' },
        config: {
          profileField: 'department',
          options: [
            { value: '경영경제학부', label: { ko: '경영경제학부', en: 'School of Management and Economics' } },
            { value: '법학부', label: { ko: '법학부', en: 'School of Law' } },
          ],
        },
      },
      onChange,
    });

    expect(screen.getByRole('heading', { name: /학부 \(1전공 기준\)/ })).toBeInTheDocument();
    expect(screen.getByLabelText('학부 (1전공 기준)')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '경영경제학부' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '전산전자공학부' })).not.toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('학부 (1전공 기준)'), '법학부');
    expect(onChange).toHaveBeenCalledWith({ department: '법학부' });
  });

  it('renders a text input for a database profile field without options and stores its raw key', async () => {
    const onChange = vi.fn();
    renderProfileQuestion({
      question: {
        ...baseQuestion,
        questionKey: 'dorm_25_2_q185',
        title: { ko: '학번 (예. 22400001)', en: 'Student ID (e.g., 22400001)' },
        config: { profileField: 'student_number', inputType: 'text', options: [] },
      },
      onChange,
    });

    const input = screen.getByLabelText('학번 (예. 22400001)');
    expect(input).toHaveProperty('tagName', 'INPUT');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();

    await userEvent.type(input, '2');
    expect(onChange).toHaveBeenLastCalledWith({ student_number: '2' });
  });

  it('localizes the database title and options in English', () => {
    renderProfileQuestion({
      question: {
        ...baseQuestion,
        questionKey: 'dorm_25_2_q003',
        title: { ko: '학부 (1전공 기준)', en: 'Department (1st Major)' },
        config: {
          profileField: 'department',
          options: [{ value: '법학부', label: { ko: '법학부', en: 'School of Law' } }],
        },
      },
      locale: 'en',
    });

    expect(screen.getByLabelText('Department (1st Major)')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'School of Law' })).toBeInTheDocument();
  });
});

function renderProfileQuestion(
  options: {
    question?: PublicQuestion;
    value?: unknown;
    onChange?: (value: unknown) => void;
    profileFieldKey?: Parameters<typeof ProfileQuestion>[0]['profileFieldKey'];
    locale?: Parameters<typeof ProfileQuestion>[0]['locale'];
  } = {},
) {
  return render(
    <ProfileQuestion
      question={options.question ?? baseProfileQuestion}
      assets={[]}
      locale={options.locale ?? 'ko'}
      fallbackLocale="ko"
      value={options.value ?? {}}
      onChange={options.onChange ?? vi.fn()}
      profileFieldKey={options.profileFieldKey}
    />,
  );
}

const baseProfileQuestion = publishedSurveyFixture.sections[0].questions[0];
