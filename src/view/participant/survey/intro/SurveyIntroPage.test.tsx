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

describe('SurveyIntroPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useParticipantDraftStore.getState().clearDraftValues();
    useParticipantLocaleStore.getState().setLocale('ko');
    useParticipantProgressStore.getState().resetProgress();
  });

  it('renders the admin-configured survey description inside the intro card', async () => {
    const survey = {
      ...publishedSurveyFixture,
      description: { ko: '관리자가 작성한 설문 안내입니다.\n참여 전 확인해주세요.' },
    };

    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/intro',
      controller: createFakeParticipantApiController({ survey }),
    });

    await waitFor(() => expect(screen.getByRole('heading', { name: '생활관 정기 설문조사' })).toBeInTheDocument());

    const introDescription = screen.getByText(/관리자가 작성한 설문 안내입니다/);
    const introCard = introDescription.closest('.survey-intro-page__card');
    const languageHeading = screen.getByRole('heading', { name: '언어' });
    expect(introCard).toBeInTheDocument();
    expect(languageHeading.compareDocumentPosition(introDescription) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(introCard).toHaveTextContent('관리자가 작성한 설문 안내입니다. 참여 전 확인해주세요.');
    expect(screen.queryByText('응답 전 확인해주세요.')).not.toBeInTheDocument();
    expect(screen.queryByText('약 7~10분 정도 소요될 수 있습니다.')).not.toBeInTheDocument();
    expect(screen.queryByText('내가 경험한 항목만 답하면 됩니다.')).not.toBeInTheDocument();
    expect(screen.queryByText('시설 관련 의견은 사진이나 도면 위에 위치를 표시할 수 있습니다.')).not.toBeInTheDocument();
    expect(screen.queryByText('제출 전 언제든 검토하고 수정할 수 있습니다.')).not.toBeInTheDocument();
  });

  it('renders URLs in the survey description as safe clickable links', async () => {
    const survey = {
      ...publishedSurveyFixture,
      description: { ko: '상세 안내는 https://taglow.newdawn.co.kr/help. 문의는 www.newdawn.co.kr/contact 에서 확인해주세요.' },
    };

    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/intro',
      controller: createFakeParticipantApiController({ survey }),
    });

    await waitFor(() => expect(screen.getByRole('heading', { name: '생활관 정기 설문조사' })).toBeInTheDocument());

    const absoluteLink = screen.getByRole('link', { name: 'https://taglow.newdawn.co.kr/help' });
    expect(absoluteLink).toHaveAttribute('href', 'https://taglow.newdawn.co.kr/help');
    expect(absoluteLink).toHaveAttribute('target', '_blank');
    expect(absoluteLink).toHaveAttribute('rel', 'noopener noreferrer');

    const wwwLink = screen.getByRole('link', { name: 'www.newdawn.co.kr/contact' });
    expect(wwwLink).toHaveAttribute('href', 'https://www.newdawn.co.kr/contact');
  });

  it('switches the survey intro description to English when the English version exists', async () => {
    const survey = {
      ...publishedSurveyFixture,
      sections: [
        {
          id: 'section-intro',
          surveyId: 'survey-1',
          sectionKey: 'intro',
          title: { ko: '설문 안내', en: 'Survey guide' },
          description: {
            ko: '한국어 설문 소개입니다.',
            en: 'This is the English survey introduction.',
          },
          orderIndex: -1,
          sectionType: 'intro',
          settings: {},
          questions: [],
        },
        ...publishedSurveyFixture.sections,
      ],
    };

    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/intro',
      controller: createFakeParticipantApiController({ survey }),
    });

    await waitFor(() => expect(screen.getByRole('heading', { name: '생활관 정기 설문조사' })).toBeInTheDocument());
    expect(screen.getByText('한국어 설문 소개입니다.')).toBeInTheDocument();
    expect(document.querySelector('.survey-intro-page__sections')).not.toHaveTextContent('설문 안내');

    await userEvent.click(screen.getByRole('button', { name: 'English' }));

    expect(screen.getByRole('heading', { name: 'Dormitory Survey' })).toBeInTheDocument();
    expect(screen.getByText('This is the English survey introduction.')).toBeInTheDocument();
    expect(screen.queryByText('한국어 설문 소개입니다.')).not.toBeInTheDocument();
    expect(document.querySelector('.survey-intro-page__sections')).not.toHaveTextContent('Survey guide');
  });

  it('uses the survey English description when the English locale is selected', async () => {
    const survey = {
      ...publishedSurveyFixture,
      description: {
        ko: '한국어 설문 설명입니다.',
        en: 'This is the English survey description.',
      },
    };

    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/intro',
      controller: createFakeParticipantApiController({ survey }),
    });

    await waitFor(() => expect(screen.getByText('한국어 설문 설명입니다.')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'English' }));

    expect(screen.getByText('This is the English survey description.')).toBeInTheDocument();
    expect(screen.queryByText('한국어 설문 설명입니다.')).not.toBeInTheDocument();
  });
});
