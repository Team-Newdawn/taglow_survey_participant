import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { PublicQuestion } from '../../../../../../../api/participant';
import { publishedSurveyFixture } from '../../../../../../../test/fixtures/publicSurveyFixture';
import { MultiSelectQuestion } from '../../questions/MultiSelectQuestion';

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

  it('renders configured rows and columns as a matrix', async () => {
    const onChange = vi.fn();

    render(
      <MultiSelectQuestion
        question={{
          ...question,
          config: {
            rows: [
              { value: 'laundry', label: { ko: '세탁실' } },
              { value: 'lounge', label: { ko: '휴게실' } },
            ],
            columns: [
              { value: 'morning', label: { ko: '아침' } },
              { value: 'evening', label: { ko: '저녁' } },
            ],
          },
          validation: {},
        }}
        assets={[]}
        locale="ko"
        fallbackLocale="ko"
        value={{ selectedOptions: [] }}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('columnheader', { name: '아침' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '저녁' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: '세탁실' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: '휴게실' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('checkbox', { name: '세탁실, 아침' }));

    expect(onChange).toHaveBeenCalledWith({ selectedOptions: ['laundry:morning'] });
  });

  it('matches matrixRows and matrixColumns to stored option values with a configured separator', async () => {
    const onChange = vi.fn();

    render(
      <MultiSelectQuestion
        question={{
          ...question,
          config: {
            matrixRows: [
              { value: '05_00_07_00', labelKo: '05:00~07:00' },
              { value: '07_00_09_00', labelKo: '07:00~09:00' },
            ],
            matrixColumns: [
              { value: 'mon', labelKo: '월' },
              { value: 'tue', labelKo: '화' },
            ],
            matrixValueSeparator: '_',
            options: [{ value: 'mon_05_00_07_00', label: { ko: '월 - 05:00~07:00' } }],
          },
          validation: {},
        }}
        assets={[]}
        locale="ko"
        fallbackLocale="ko"
        value={{ selectedOptions: [] }}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('rowheader', { name: '05:00~07:00' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: '07:00~09:00' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '월' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '화' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('checkbox', { name: '05:00~07:00, 월' }));

    expect(onChange).toHaveBeenCalledWith({ selectedOptions: ['mon_05_00_07_00'] });
    expect(screen.queryByRole('checkbox', { name: '05:00~07:00, 화' })).not.toBeInTheDocument();
  });

  it('uses option metadata row and column values when configured as cell options', async () => {
    const onChange = vi.fn();

    render(
      <MultiSelectQuestion
        question={buildMetadataMatrixQuestion(question)}
        assets={[]}
        locale="ko"
        fallbackLocale="ko"
        value={{ selectedOptions: [] }}
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByRole('checkbox', { name: '세탁실, 아침' }));

    expect(onChange).toHaveBeenCalledWith({ selectedOptions: ['laundry_morning'] });
  });

  it('infers a matrix from option labels written as row dash column', async () => {
    const onChange = vi.fn();

    render(
      <MultiSelectQuestion
        question={{
          ...question,
          config: {
            options: [
              { value: '09_mon', label: { ko: '09:00~11:00 - 월' } },
              { value: '09_tue', label: { ko: '09:00~11:00 - 화' } },
              { value: '11_mon', label: { ko: '11:00~13:00 - 월' } },
              { value: '11_tue', label: { ko: '11:00~13:00 - 화' } },
            ],
          },
          validation: {},
        }}
        assets={[]}
        locale="ko"
        fallbackLocale="ko"
        value={{ selectedOptions: [] }}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('rowheader', { name: '09:00~11:00' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: '11:00~13:00' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '월' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '화' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('checkbox', { name: '09:00~11:00, 월' }));

    expect(onChange).toHaveBeenCalledWith({ selectedOptions: ['09_mon'] });
  });

  it('uses database row and column counts to render ordered options as a matrix', async () => {
    const onChange = vi.fn();

    render(
      <MultiSelectQuestion
        question={{
          ...question,
          config: {
            row_count: 2,
            column_count: 3,
            options: [
              { value: '09_mon', label: { ko: '09:00~11:00 - 월' } },
              { value: '09_tue', label: { ko: '09:00~11:00 - 화' } },
              { value: '09_wed', label: { ko: '09:00~11:00 - 수' } },
              { value: '11_mon', label: { ko: '11:00~13:00 - 월' } },
              { value: '11_tue', label: { ko: '11:00~13:00 - 화' } },
              { value: '11_wed', label: { ko: '11:00~13:00 - 수' } },
            ],
          },
          validation: {},
        }}
        assets={[]}
        locale="ko"
        fallbackLocale="ko"
        value={{ selectedOptions: [] }}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('rowheader', { name: '09:00~11:00' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: '11:00~13:00' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '월' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '화' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '수' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('checkbox', { name: '11:00~13:00, 화' }));

    expect(onChange).toHaveBeenCalledWith({ selectedOptions: ['11_tue'] });
  });

  it('uses database row and column indexes from option metadata', async () => {
    const onChange = vi.fn();

    render(
      <MultiSelectQuestion
        question={{
          ...question,
          config: {
            options: [
              {
                value: '09_mon',
                label: { ko: '09:00~11:00 - 월' },
                metadata: { row_index: 0, column_index: 0, row_label_ko: '09:00~11:00', column_label_ko: '월' },
              },
              {
                value: '09_tue',
                label: { ko: '09:00~11:00 - 화' },
                metadata: { row_index: 0, column_index: 1, row_label_ko: '09:00~11:00', column_label_ko: '화' },
              },
            ],
          },
          validation: {},
        }}
        assets={[]}
        locale="ko"
        fallbackLocale="ko"
        value={{ selectedOptions: [] }}
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByRole('checkbox', { name: '09:00~11:00, 화' }));

    expect(onChange).toHaveBeenCalledWith({ selectedOptions: ['09_tue'] });
  });

  it('renders matrix_multi_select questions with the matrix checkbox layout', async () => {
    const onChange = vi.fn();

    render(
      <MultiSelectQuestion
        question={{
          ...question,
          questionType: 'matrix_multi_select',
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
              { value: 'tue_07_00_09_00', label: { ko: '화요일 - 07:00~09:00' } },
            ],
          },
          validation: {},
        }}
        assets={[]}
        locale="ko"
        fallbackLocale="ko"
        value={{ selectedOptions: [] }}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('table')).toHaveClass('multi-select-question__matrix');
    expect(screen.queryByRole('checkbox', { name: '월요일' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('checkbox', { name: '05:00~07:00, 월요일' }));

    expect(onChange).toHaveBeenCalledWith({ selectedOptions: ['mon_05_00_07_00'] });
  });

  it('gives dense matrix headers enough width so long labels do not overlap', () => {
    render(
      <MultiSelectQuestion
        question={{
          ...question,
          questionType: 'matrix_multi_select',
          config: {
            matrixRows: [{ value: 'mon', labelKo: '월요일' }],
            matrixColumns: [
              { value: '05_00_07_00', labelKo: '05:00~07:00' },
              { value: '07_00_09_00', labelKo: '07:00~09:00' },
              { value: '09_00_11_00', labelKo: '09:00~11:00' },
              { value: '11_00_13_00', labelKo: '11:00~13:00' },
              { value: '13_00_15_00', labelKo: '13:00~15:00' },
              { value: '15_00_17_00', labelKo: '15:00~17:00' },
              { value: '17_00_19_00', labelKo: '17:00~19:00' },
              { value: '19_00_21_00', labelKo: '19:00~21:00' },
              { value: '21_00_23_00', labelKo: '21:00~23:00' },
            ],
          },
          validation: {},
        }}
        assets={[]}
        locale="ko"
        fallbackLocale="ko"
        value={{ selectedOptions: [] }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('table')).toHaveStyle({ minWidth: '1130px' });
  });
});

function buildMetadataMatrixQuestion(question: PublicQuestion): PublicQuestion {
  return {
    ...question,
    config: {
      options: [
        {
          value: 'laundry_morning',
          label: { ko: '세탁실 아침' },
          metadata: {
            row: 'laundry',
            rowLabel: { ko: '세탁실' },
            column: 'morning',
            columnLabel: { ko: '아침' },
          },
        },
        {
          value: 'lounge_morning',
          label: { ko: '휴게실 아침' },
          metadata: {
            row: 'lounge',
            rowLabel: { ko: '휴게실' },
            column: 'morning',
            columnLabel: { ko: '아침' },
          },
        },
      ],
    },
    validation: {},
  };
}
