import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { AppRoutes } from '../../../app/router';
import { useParticipantDraftStore } from '../../../store/participantDraftStore';
import { useParticipantProgressStore } from '../../../store/participantProgressStore';
import { createFakeParticipantApiController } from '../../../test/fakeParticipantApiController';
import { publishedSurveyFixture } from '../../../test/fixtures/publicSurveyFixture';
import { renderWithProviders } from '../../../test/renderWithProviders';

describe('SurveySectionPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useParticipantDraftStore.getState().clearDraftValues();
    useParticipantProgressStore.getState().resetProgress();
  });

  it('renders the section form and mirrors answer changes into the draft snapshot', async () => {
    renderWithProviders(<AppRoutes />, {
      route: '/survey/demo/sections/facility',
    });

    expect(await screen.findByText('세탁실 만족도는 어떤가요?')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '5' }));

    await waitFor(() => {
      expect(useParticipantDraftStore.getState().values['question-scale']).toEqual({ scoreValue: 5 });
    });
    expect(screen.getByRole('button', { name: '5' })).toHaveClass('is-selected');
  });

  it('shows image tag questions one by one on their own section screens', async () => {
    const facilitySection = publishedSurveyFixture.sections[1];
    const survey = {
      ...publishedSurveyFixture,
      sections: [
        publishedSurveyFixture.sections[0],
        {
          ...facilitySection,
          questions: [
            facilitySection.questions[0],
            {
              ...facilitySection.questions[0],
              id: 'question-upload-tag',
              questionKey: 'upload_tag_suggestion',
              questionType: 'participant_image_tag' as const,
              title: { ko: '건의할 사진을 올려주세요.' },
              orderIndex: 1,
              isRequired: false,
              metricType: 'none' as const,
              config: { tagTypes: ['수리 요청', '개선 제안'] },
              validation: {},
            },
            {
              ...facilitySection.questions[0],
              id: 'question-existing-image-tag',
              questionKey: 'existing_image_tag',
              questionType: 'image_tag' as const,
              title: { ko: '지도에서 건의 위치를 표시해주세요.' },
              orderIndex: 2,
              isRequired: false,
              metricType: 'none' as const,
              config: { assetId: 'asset-1', maxTags: 2 },
              validation: {},
            },
            {
              ...facilitySection.questions[1],
              id: 'question-after-upload',
              title: { ko: '추가로 개선할 항목을 선택해주세요.' },
              orderIndex: 3,
            },
          ],
        },
      ],
    };

    renderWithProviders(<AppRoutes />, {
      route: '/survey/demo/sections/facility',
      controller: createFakeParticipantApiController({ survey }),
    });

    expect(await screen.findByText('세탁실 만족도는 어떤가요?')).toBeInTheDocument();
    expect(screen.queryByText('건의할 사진을 올려주세요.')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '5' }));
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(await screen.findByText('건의할 사진을 올려주세요.')).toBeInTheDocument();
    expect(screen.queryByText('세탁실 만족도는 어떤가요?')).not.toBeInTheDocument();
    expect(screen.queryByText('지도에서 건의 위치를 표시해주세요.')).not.toBeInTheDocument();
    expect(screen.queryByText('추가로 개선할 항목을 선택해주세요.')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(await screen.findByText('지도에서 건의 위치를 표시해주세요.')).toBeInTheDocument();
    expect(screen.queryByText('건의할 사진을 올려주세요.')).not.toBeInTheDocument();
    expect(screen.queryByText('추가로 개선할 항목을 선택해주세요.')).not.toBeInTheDocument();
  });
});
