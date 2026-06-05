import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { AppRoutes } from '../../../../app/router';
import { useParticipantDraftStore } from '../../../../store/participantDraftStore';
import { useParticipantLocaleStore } from '../../../../store/participantLocaleStore';
import { useParticipantProgressStore } from '../../../../store/participantProgressStore';
import { createFakeParticipantApiController } from '../../../../test/fakeParticipantApiController';
import { publishedSurveyFixture } from '../../../../test/fixtures/publicSurveyFixture';
import { renderWithProviders } from '../../../../test/renderWithProviders';

describe('SurveySectionPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useParticipantDraftStore.getState().clearDraftValues();
    useParticipantLocaleStore.getState().setLocale('ko');
    useParticipantProgressStore.getState().resetProgress();
  });

  it('renders the section form and mirrors answer changes into the draft snapshot', async () => {
    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/sections/facility',
    });

    expect(await screen.findByText('세탁실 만족도는 어떤가요?')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^1\. 세탁실 만족도는 어떤가요/ })).toBeInTheDocument();
    expect(screen.getByText('2/2섹션')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(document.querySelector('.survey-section-page__body')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '5' }));

    await waitFor(() => {
      expect(useParticipantDraftStore.getState().values['question-scale']).toEqual({ scoreValue: 5 });
    });
    expect(screen.getByRole('button', { name: '5' })).toHaveClass('is-selected');
  });

  it('does not count the intro section in answer section progress', async () => {
    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/sections/facility',
      controller: createFakeParticipantApiController({ survey: buildSurveyWithIntroSection() }),
    });

    expect(await screen.findByText('세탁실 만족도는 어떤가요?')).toBeInTheDocument();
    expect(screen.getByText('2/2섹션')).toBeInTheDocument();
    expect(screen.queryByText('3/3섹션')).not.toBeInTheDocument();
  });

  it('renders bundled profile fields as separate numbered questions', async () => {
    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/sections/profile',
    });

    expect(await screen.findByRole('heading', { name: /^1\. 성별/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^2\. 학기/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^3\. 학부/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^4\. 소속 RC/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^5\. 거주 생활관/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^6\. 인실/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^7\. 생활관 거주 경험/ })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /기본 정보를 선택해주세요/ })).not.toBeInTheDocument();
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
      route: '/survey/fixture-survey/sections/facility',
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

  it('renders grouped scale questions as expandable rows and stores answers per original question', async () => {
    const survey = buildScaleGroupSurvey();

    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/sections/facility',
      controller: createFakeParticipantApiController({ survey }),
    });

    expect(await screen.findByRole('heading', { name: /^1\. .*소등제도/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /소등시간/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /소등 여부/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '1' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '검토하기' }));

    expect(await screen.findByText('필수 문항입니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '4' }));

    await waitFor(() => {
      expect(useParticipantDraftStore.getState().values['question-light-off-time']).toEqual({ scoreValue: 4 });
    });

    await userEvent.click(screen.getByRole('button', { name: '5' }));

    await waitFor(() => {
      expect(useParticipantDraftStore.getState().values['question-light-off-enabled']).toEqual({ scoreValue: 5 });
    });

    await userEvent.click(screen.getByRole('button', { name: '검토하기' }));

    expect(await screen.findByText('제출 전 검토')).toBeInTheDocument();
  });

  it('renders grouped scale question titles in English when English is selected', async () => {
    const survey = buildScaleGroupSurvey();
    useParticipantLocaleStore.getState().setLocale('en');

    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/sections/facility',
      controller: createFakeParticipantApiController({ survey }),
    });

    expect(await screen.findByRole('heading', { name: /^1\. What is your level of satisfaction with Silent Hours/ })).toBeInTheDocument();
    expect(screen.getByText('0/2 answered')).toBeInTheDocument();
    expect(screen.getByText('2/2 sections')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Review' })).toBeInTheDocument();
    expect(screen.queryByText('0/2개 응답')).not.toBeInTheDocument();
    expect(screen.queryByText('2/2섹션')).not.toBeInTheDocument();
    expect(screen.queryByText(/소등제도/)).not.toBeInTheDocument();
  });

  it('scrolls the section body to the top when moving to the next section', async () => {
    const survey = buildTwoScaleSectionSurvey();

    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/sections/facility',
      controller: createFakeParticipantApiController({ survey }),
    });

    expect(await screen.findByText('세탁실 만족도는 어떤가요?')).toBeInTheDocument();

    const body = document.querySelector<HTMLDivElement>('.survey-section-page__body');
    expect(body).toBeTruthy();
    if (!body) {
      return;
    }

    body.scrollTop = 240;

    await userEvent.click(screen.getByRole('button', { name: '5' }));
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(await screen.findByText('두 번째 섹션 만족도는 어떤가요?')).toBeInTheDocument();

    await waitFor(() => {
      expect(body.scrollTop).toBe(0);
    });
  });
});

function buildScaleGroupSurvey() {
  const facilitySection = publishedSurveyFixture.sections[1];
  const baseScaleQuestion = facilitySection.questions[0];
  const displayGroup = "'소등제도'와 관련된 다음 항목에 대한 만족도에 대해 어떻게 생각하십니까?";
  const displayGroupEn = 'What is your level of satisfaction with Silent Hours?';

  return {
    ...publishedSurveyFixture,
    sections: [
      publishedSurveyFixture.sections[0],
      {
        ...facilitySection,
        questions: [
          {
            ...baseScaleQuestion,
            id: 'question-light-off-time',
            questionKey: 'light_off_time',
            title: { ko: `${displayGroup} [(1) 소등시간]`, en: `${displayGroupEn} [(1) Silent Hours Operating Hours]` },
            orderIndex: 0,
            config: { ...baseScaleQuestion.config, displayGroup, displayGroupEn },
          },
          {
            ...baseScaleQuestion,
            id: 'question-light-off-enabled',
            questionKey: 'light_off_enabled',
            title: { ko: `${displayGroup} [(2) 소등 여부]`, en: `${displayGroupEn} [(2) Compliance with Silent Hours Rules]` },
            orderIndex: 1,
            config: { ...baseScaleQuestion.config, displayGroup, displayGroupEn },
          },
        ],
      },
    ],
  };
}

function buildSurveyWithIntroSection() {
  return {
    ...publishedSurveyFixture,
    sections: [
      {
        id: 'section-intro',
        surveyId: 'survey-1',
        sectionKey: 'intro',
        title: { ko: '설문 안내' },
        description: { ko: '응답 전 안내입니다.' },
        orderIndex: -1,
        sectionType: 'intro' as const,
        settings: {},
        questions: [],
      },
      ...publishedSurveyFixture.sections,
    ],
  };
}

function buildTwoScaleSectionSurvey() {
  const facilitySection = publishedSurveyFixture.sections[1];
  const baseScaleQuestion = facilitySection.questions[0];

  return {
    ...publishedSurveyFixture,
    sections: [
      {
        ...facilitySection,
        id: 'section-first-scale',
        sectionKey: 'facility',
        title: { ko: '첫 번째 섹션' },
        orderIndex: 0,
        questions: [
          {
            ...baseScaleQuestion,
            id: 'question-first-scale',
            sectionId: 'section-first-scale',
            questionKey: 'first_scale',
            title: { ko: '세탁실 만족도는 어떤가요?' },
          },
        ],
      },
      {
        ...facilitySection,
        id: 'section-second-scale',
        sectionKey: 'facility-next',
        title: { ko: '두 번째 섹션' },
        orderIndex: 1,
        questions: [
          {
            ...baseScaleQuestion,
            id: 'question-second-scale',
            sectionId: 'section-second-scale',
            questionKey: 'second_scale',
            title: { ko: '두 번째 섹션 만족도는 어떤가요?' },
          },
        ],
      },
    ],
  };
}
