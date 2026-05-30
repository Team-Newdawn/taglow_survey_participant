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
    expect(screen.queryByText('공간의 목소리를 더 선명하게 모읍니다.')).not.toBeInTheDocument();
  });

  it('routes unauthenticated participants to login', async () => {
    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/intro',
      controller: createFakeParticipantApiController({ session: null }),
    });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Google로 계속하기' })).toBeInTheDocument());
  });

  it('routes the public survey entry to login even when a session exists', async () => {
    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey',
      controller: createFakeParticipantApiController({ session: { userId: 'user-1', email: 'student@example.com' } }),
    });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Google로 계속하기' })).toBeInTheDocument());
    expect(screen.queryByText('설문 안내')).not.toBeInTheDocument();
  });

  it('allows any Google account with a Supabase session to continue', async () => {
    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/intro',
      controller: createFakeParticipantApiController({ session: { userId: 'user-1', email: 'student@example.com' } }),
    });

    await waitFor(() => expect(screen.getByText('설문 안내')).toBeInTheDocument());
  });

  it('renders a generic access denied page when the route is opened directly', async () => {
    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/access-denied',
    });

    expect(screen.getByText('이 설문에 접근할 수 없습니다.')).toBeInTheDocument();
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
