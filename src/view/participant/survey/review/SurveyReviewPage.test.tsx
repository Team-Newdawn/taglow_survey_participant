import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { AppRoutes } from '../../../../app/router';
import { useParticipantDraftStore } from '../../../../store/participantDraftStore';
import { useParticipantLocaleStore } from '../../../../store/participantLocaleStore';
import { useParticipantProgressStore } from '../../../../store/participantProgressStore';
import { createFakeParticipantApiController } from '../../../../test/fakeParticipantApiController';
import { publishedSurveyFixture } from '../../../../test/fixtures/publicSurveyFixture';
import { renderWithProviders } from '../../../../test/renderWithProviders';

describe('SurveyReviewPage', () => {
  beforeEach(() => {
    useParticipantDraftStore.getState().clearDraftValues();
    useParticipantLocaleStore.getState().setLocale('ko');
    useParticipantProgressStore.getState().resetProgress();
  });

  it('summarizes only answer sections and excludes the intro section', async () => {
    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/review',
      controller: createFakeParticipantApiController({ survey: buildSurveyWithIntroSection() }),
    });

    expect(await screen.findByRole('heading', { name: '응답 내용을 확인해주세요.' })).toBeInTheDocument();

    const summary = document.querySelector<HTMLElement>('.survey-review-page__summary');
    expect(summary).toBeInTheDocument();
    expect(within(summary as HTMLElement).getByText('2')).toBeInTheDocument();
    expect(summary).not.toHaveTextContent('3');
    expect(screen.queryByRole('heading', { name: '설문 안내' })).not.toBeInTheDocument();
  });
});

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
