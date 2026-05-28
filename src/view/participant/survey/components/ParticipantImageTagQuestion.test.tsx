import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { ParticipantImageTagValue, PublicQuestion } from '../../../../api/participant';
import { createFakeParticipantApiController } from '../../../../test/fakeParticipantApiController';
import { publishedSurveyFixture } from '../../../../test/fixtures/publicSurveyFixture';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { ParticipantImageTagQuestion } from './ParticipantImageTagQuestion';

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
      storagePath: 'participant-uploads/survey-1/user-1/question-upload-tag/image.png',
      signedUrl: 'https://example.com/uploaded.png',
      metadata: { originalName: 'upload.png' },
    }));

    renderWithProviders(<Harness question={question} />, {
      controller: createFakeParticipantApiController({ uploadQuestionImage }),
    });

    const file = new File(['image'], 'upload.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('사진 업로드'), file);

    await waitFor(() => {
      expect(uploadQuestionImage).toHaveBeenCalledWith({ surveyId: 'survey-1', questionId: 'question-upload-tag', file });
    });

    const image = await screen.findByRole('img', { name: '참여자가 올린 태깅 사진' });
    fireEvent.pointerDown(image, { clientX: 12, clientY: 12 });

    expect(screen.getByRole('heading', { name: '1번 위치' })).toBeInTheDocument();
    expect(screen.getByLabelText('1번 위치 카테고리')).toHaveValue('수리 요청');
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
