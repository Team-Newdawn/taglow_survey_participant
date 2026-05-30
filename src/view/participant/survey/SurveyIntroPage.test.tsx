import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { AppRoutes } from '../../../app/router';
import { useParticipantDraftStore } from '../../../store/participantDraftStore';
import { useParticipantProgressStore } from '../../../store/participantProgressStore';
import { createFakeParticipantApiController } from '../../../test/fakeParticipantApiController';
import { publishedSurveyFixture } from '../../../test/fixtures/publicSurveyFixture';
import { renderWithProviders } from '../../../test/renderWithProviders';

describe('SurveyIntroPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useParticipantDraftStore.getState().clearDraftValues();
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

    const introCard = document.querySelector<HTMLElement>('.survey-intro-page__card');
    expect(introCard).toBeInTheDocument();
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
});
