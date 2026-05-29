import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { PublicQuestion } from '../../../../../api/participant';
import { publishedSurveyFixture } from '../../../../../test/fixtures/publicSurveyFixture';
import { renderWithProviders } from '../../../../../test/renderWithProviders';
import { ImageTagQuestion } from '../ImageTagQuestion';

describe('ImageTagQuestion', () => {
  const question: PublicQuestion = {
    id: 'question-image',
    surveyId: 'survey-1',
    sectionId: 'section-facility',
    questionKey: 'facility_image_tag',
    questionType: 'image_tag',
    title: { ko: '사진에서 위치를 선택해주세요.' },
    orderIndex: 0,
    isRequired: false,
    metricType: 'none',
    config: {
      assetId: 'asset-1',
      maxTags: 2,
      tagTypes: ['냉난방', '소음'],
    },
    validation: {},
  };

  it('opens a point dialog after dragging the red dot onto the image', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <ImageTagQuestion
        question={question}
        assets={publishedSurveyFixture.assets}
        locale="ko"
        fallbackLocale="ko"
        value={{}}
        onChange={onChange}
      />,
    );

    mockImageRect(await screen.findByRole('img', { name: '위치를 선택할 시설 이미지' }));
    dragNewPointToImage(50, 25);

    expect(await screen.findByRole('dialog', { name: '위치 내용 입력' })).toBeInTheDocument();
    expect(screen.getByLabelText('카테고리')).toHaveValue('냉난방');

    await user.type(screen.getByLabelText('이유'), '창틀이 흔들립니다.');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(onChange).toHaveBeenCalledWith({
      points: [
        expect.objectContaining({
          xRatio: 0.5,
          yRatio: 0.5,
          tagType: '냉난방',
          textValue: '창틀이 흔들립니다.',
        }),
      ],
    });
  });

  it('renders only admin-configured tag categories in the editor', async () => {
    renderWithProviders(
      <ImageTagQuestion
        question={question}
        assets={publishedSurveyFixture.assets}
        locale="ko"
        fallbackLocale="ko"
        value={{
          points: [
            {
              assetId: 'asset-1',
              xRatio: 0.5,
              yRatio: 0.5,
              tagType: '냉난방',
              textValue: '',
            },
          ],
        }}
        onChange={vi.fn()}
      />,
    );

    await userEvent.click(await screen.findByRole('button', { name: '1번 위치 수정' }));

    const categorySelect = screen.getByLabelText('카테고리');
    expect(within(categorySelect).getByRole('option', { name: '냉난방' })).toBeInTheDocument();
    expect(within(categorySelect).getByRole('option', { name: '소음' })).toBeInTheDocument();
    expect(within(categorySelect).queryByRole('option', { name: '위험' })).not.toBeInTheDocument();
  });
});

function dragNewPointToImage(clientX: number, clientY: number) {
  const dot = screen.getByRole('button', { name: '새 위치 점을 이미지로 드래그' });
  fireEvent.pointerDown(dot, { pointerId: 1, clientX: 0, clientY: 120 });
  fireEvent.pointerUp(dot, { pointerId: 1, clientX, clientY });
}

function mockImageRect(image: HTMLElement) {
  vi.spyOn(image, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width: 100,
    height: 50,
  } as DOMRect);
}
