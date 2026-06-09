import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { ParticipantImageTagValue, PublicQuestion } from '../../../../../../../api/participant';
import { createFakeParticipantApiController } from '../../../../../../../test/fakeParticipantApiController';
import { publishedSurveyFixture } from '../../../../../../../test/fixtures/publicSurveyFixture';
import { renderWithProviders } from '../../../../../../../test/renderWithProviders';
import { prepareParticipantImageUploadFile } from '../../../../../../../utils/participantImageUpload';
import { ParticipantImageTagQuestion } from '../../imageTag/ParticipantImageTagQuestion';

vi.mock('../../../../../../../utils/participantImageUpload', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../../../../utils/participantImageUpload')>();

  return {
    ...actual,
    prepareParticipantImageUploadFile: vi.fn(async (file: File) => file),
  };
});

describe('ParticipantImageTagQuestion', () => {
  const question: PublicQuestion = {
    ...publishedSurveyFixture.sections[1].questions[0],
    id: 'question-upload-tag',
    questionKey: 'upload_tag_suggestion',
    questionType: 'participant_image_tag',
    metricType: 'none',
    config: {
      maxTags: 2,
      tagTypes: ['수리 요청', '개선 제안'],
      acceptedMimeTypes: ['image/png'],
      maxFileSizeMb: 10,
    },
    validation: {},
  };

  it('uploads an image and lets the participant place a categorized tag', async () => {
    const user = userEvent.setup();
    const uploadQuestionImage = vi.fn(async () => ({
      storageBucket: 'survey-assets',
      storagePath: 'participant-uploads/upload-1.png',
      signedUrl: 'https://example.com/uploaded.png',
      metadata: { originalName: 'upload.png' },
    }));

    const { container } = renderWithProviders(<Harness question={question} />, {
      controller: createFakeParticipantApiController({ uploadQuestionImage }),
    });

    const file = new File(['image'], 'upload.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('사진 업로드'), file);

    await waitFor(() => {
      expect(uploadQuestionImage).toHaveBeenCalledWith({ surveyId: 'survey-1', questionId: 'question-upload-tag', file });
    });

    const image = await screen.findByRole('img', { name: '참여자가 올린 위치 선택 사진' });
    mockImageRect(image);
    expect(container.querySelector('.image-tag-question__sticker-hint')).toBeInTheDocument();

    dragNewPointToImage(50, 25);

    expect(await screen.findByRole('dialog', { name: '위치 내용 입력' })).toBeInTheDocument();
    expect(container.querySelector('.image-tag-question__sticker-hint')).not.toBeInTheDocument();
    expect(screen.getByLabelText('카테고리')).toHaveValue('수리 요청');

    await user.type(screen.getByLabelText('이유'), '문이 잘 닫히지 않습니다.');
    await user.click(screen.getByRole('button', { name: '저장' }));

    const pin = await screen.findByRole('button', { name: '1번 위치 수정' });
    expect(pin).toHaveStyle({ left: '50%', top: '25%' });
    expect(container.querySelector('.image-tag-question__sticker-hint')).not.toBeInTheDocument();
  });

  it('accepts large images and relies on client-side compression instead of a size limit', async () => {
    const user = userEvent.setup();
    const uploadQuestionImage = vi.fn(async () => ({
      storageBucket: 'survey-assets',
      storagePath: 'participant-uploads/upload-1.png',
      signedUrl: 'https://example.com/uploaded.png',
      metadata: { originalName: 'large.png' },
    }));

    renderWithProviders(<Harness question={question} />, {
      controller: createFakeParticipantApiController({ uploadQuestionImage }),
    });

    const largeFile = new File([new Uint8Array(20 * 1024 * 1024)], 'large.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('사진 업로드'), largeFile);

    await waitFor(() => {
      expect(uploadQuestionImage).toHaveBeenCalledWith({ surveyId: 'survey-1', questionId: 'question-upload-tag', file: largeFile });
    });
  });

  it('uploads the prepared image file after client-side compression', async () => {
    const user = userEvent.setup();
    const uploadQuestionImage = vi.fn(async () => ({
      storageBucket: 'survey-assets',
      storagePath: 'participant-uploads/upload-1.png',
      signedUrl: 'https://example.com/uploaded.png',
      metadata: { originalName: 'compressed.png' },
    }));
    const originalFile = new File(['large image'], 'large.png', { type: 'image/png' });
    const compressedFile = new File(['compressed'], 'compressed.png', { type: 'image/png' });
    vi.mocked(prepareParticipantImageUploadFile).mockResolvedValueOnce(compressedFile);

    renderWithProviders(<Harness question={question} />, {
      controller: createFakeParticipantApiController({ uploadQuestionImage }),
    });

    await user.upload(screen.getByLabelText('사진 업로드'), originalFile);

    await waitFor(() => {
      expect(prepareParticipantImageUploadFile).toHaveBeenCalledWith(originalFile, { acceptedMimeTypes: ['image/png'] });
      expect(uploadQuestionImage).toHaveBeenCalledWith({
        surveyId: 'survey-1',
        questionId: 'question-upload-tag',
        file: compressedFile,
      });
    });
  });

  it('defaults participant image uploads to the storage bucket mime types', () => {
    renderWithProviders(<Harness question={{ ...question, config: { ...question.config, acceptedMimeTypes: undefined } }} />);

    expect(screen.getByLabelText('사진 업로드')).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');
  });
});

function Harness(props: { question: PublicQuestion }) {
  const [value, setValue] = useState<ParticipantImageTagValue>({});

  return (
    <ParticipantImageTagQuestion
      question={props.question}
      assets={[]}
      locale="ko"
      fallbackLocale="ko"
      value={value}
      onChange={(nextValue) => setValue(nextValue as ParticipantImageTagValue)}
    />
  );
}

function dragNewPointToImage(clientX: number, clientY: number) {
  const dot = screen.getByRole('button', { name: '새 위치 스티커를 이미지로 드래그' });
  fireEvent.pointerDown(dot, { pointerId: 1, clientX: 0, clientY: 120 });
  fireEvent.pointerUp(dot, { pointerId: 1, clientX, clientY });
}

function mockImageRect(image: HTMLElement) {
  vi.spyOn(image, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width: 100,
    height: 100,
  } as DOMRect);
}
