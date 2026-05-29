import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createFakeParticipantApiController } from '../test/fakeParticipantApiController';
import { publishedSurveyFixture } from '../test/fixtures/publicSurveyFixture';
import { renderWithProviders } from '../test/renderWithProviders';
import { AppRoutes } from './router';

describe('participant route guards', () => {
  it('does not redirect the root route to a demo survey', () => {
    renderWithProviders(<AppRoutes />, {
      route: '/',
    });

    expect(screen.getByText('설문을 찾을 수 없습니다.')).toBeInTheDocument();
  });

  it('blocks demo routes and their child pages', () => {
    renderWithProviders(<AppRoutes />, {
      route: '/survey/demo/intro',
    });

    expect(screen.getByText('설문을 찾을 수 없습니다.')).toBeInTheDocument();
    expect(screen.queryByText('Google 로그인')).not.toBeInTheDocument();
  });

  it('routes unauthenticated participants to login', async () => {
    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/intro',
      controller: createFakeParticipantApiController({ session: null }),
    });

    await waitFor(() => expect(screen.getByText('Google 로그인')).toBeInTheDocument());
  });

  it('routes non-Handong participants to access denied', async () => {
    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/intro',
      controller: createFakeParticipantApiController({ session: { userId: 'user-1', email: 'student@example.com' } }),
    });

    await waitFor(() => expect(screen.getByText('학교 Google 계정으로 다시 로그인해주세요.')).toBeInTheDocument());
  });

  it('routes non-Handong participants to access denied even when RLS hides the survey row', async () => {
    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/intro',
      controller: createFakeParticipantApiController({
        session: { userId: 'user-1', email: 'student@example.com' },
        surveyError: new Error('RLS prevented survey select'),
      }),
    });

    await waitFor(() => expect(screen.getByText('학교 Google 계정으로 다시 로그인해주세요.')).toBeInTheDocument());
  });

  it('routes duplicate participants to already-submitted page', async () => {
    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/intro',
      controller: createFakeParticipantApiController({ duplicate: { alreadySubmitted: true, responseId: 'response-1' } }),
    });

    await waitFor(() => expect(screen.getByText('이미 제출한 설문입니다.')).toBeInTheDocument());
  });

  it('routes closed surveys to closed page', async () => {
    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/intro',
      controller: createFakeParticipantApiController({ survey: { ...publishedSurveyFixture, status: 'closed' } }),
    });

    await waitFor(() => expect(screen.getByText('지금은 응답할 수 없는 설문입니다.')).toBeInTheDocument());
  });
});
