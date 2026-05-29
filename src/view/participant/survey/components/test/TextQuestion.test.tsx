import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { publishedSurveyFixture } from '../../../../../test/fixtures/publicSurveyFixture';
import { TextQuestion } from '../TextQuestion';

describe('TextQuestion', () => {
  const baseQuestion = {
    ...publishedSurveyFixture.sections[1].questions[1],
    id: 'question-text',
    questionType: 'text' as const,
    title: { ko: '자유롭게 의견을 적어주세요.' },
    config: { maxLength: 1000, multiline: true },
    validation: {},
  };

  it('renders plain text questions without opinion type choices', async () => {
    const onChange = vi.fn();

    render(
      <TextQuestion
        question={baseQuestion}
        assets={[]}
        locale="ko"
        fallbackLocale="ko"
        value={{}}
        onChange={onChange}
      />,
    );

    expect(screen.queryByRole('radio', { name: '불편' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '창문이 잘 닫히지 않습니다.' } });

    expect(onChange).toHaveBeenCalledWith({ textValue: '창문이 잘 닫히지 않습니다.' });
  });

  it('renders selection-before-text questions when opinion options are configured', async () => {
    const onChange = vi.fn();
    const question = {
      ...baseQuestion,
      config: {
        options: [
          { value: 'discomfort', label: { ko: '불편' } },
          { value: 'improvement', label: { ko: '개선' } },
          { value: 'praise', label: { ko: '칭찬' } },
        ],
      },
    };

    render(
      <TextQuestion
        question={question}
        assets={[]}
        locale="ko"
        fallbackLocale="ko"
        value={{ textValue: '좋았습니다.' }}
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByRole('radio', { name: '칭찬' }));

    expect(onChange).toHaveBeenCalledWith({ textValue: '좋았습니다.', opinionType: 'praise' });
  });

  it('renders short text questions as a single-line input with maxLength', () => {
    const onChange = vi.fn();
    const question = {
      ...baseQuestion,
      config: {
        textMode: 'short',
        multiline: false,
        maxLength: 200,
      },
    };

    const { container } = render(
      <TextQuestion
        question={question}
        assets={[]}
        locale="ko"
        fallbackLocale="ko"
        value={{}}
        onChange={onChange}
      />,
    );

    const input = container.querySelector('input[type="text"]');

    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('maxlength', '200');
    expect(container.querySelector('textarea')).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '단답형 응답' } });

    expect(onChange).toHaveBeenCalledWith({ textValue: '단답형 응답' });
  });
});
