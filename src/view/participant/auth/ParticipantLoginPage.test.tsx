import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppRoutes } from '../../../app/router';
import { createFakeParticipantApiController } from '../../../test/fakeParticipantApiController';
import { renderWithProviders } from '../../../test/renderWithProviders';

describe('ParticipantLoginPage', () => {
  it('shows Taglow branding without survey-specific copy', async () => {
    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/login',
    });

    const logo = await screen.findByRole('img', { name: 'Taglow' });
    const title = screen.getByRole('heading', { name: '목소리를 더 선명하게 모읍니다.' });
    const signInButton = screen.getByRole('button', { name: 'Google로 계속하기' });

    expect(document.querySelector('.participant-login-page__top')).toContainElement(logo);
    expect(document.querySelector('.participant-login-page__body')).toContainElement(title);
    expect(document.querySelector('.participant-login-page__bottom')).toContainElement(signInButton);
    expect(screen.getByText('Taglow는 현장의 의견을 기록하고 필요한 변화를 찾도록 돕는 피드백 플랫폼입니다.')).toBeInTheDocument();
    expect(screen.queryByText('생활관 정기 설문조사')).not.toBeInTheDocument();
    expect(screen.queryByText(/설문에 참여/)).not.toBeInTheDocument();
  });

  it('clears an existing participant session before starting Google sign-in', async () => {
    const user = userEvent.setup();
    const signOut = vi.fn(async () => undefined);
    const signInWithGoogle = vi.fn(async () => undefined);
    const controller = {
      ...createFakeParticipantApiController({
        session: { userId: 'user-1', email: 'student@example.com' },
      }),
      signOut,
      signInWithGoogle,
    };

    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/login',
      controller,
    });

    const signInButton = await screen.findByRole('button', { name: 'Google로 계속하기' });
    await waitFor(() => expect(signInButton).toBeEnabled());
    await user.click(signInButton);

    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
    expect(signOut.mock.invocationCallOrder[0]).toBeLessThan(signInWithGoogle.mock.invocationCallOrder[0]);
    expect(signInWithGoogle).toHaveBeenCalledWith({
      redirectTo: 'http://localhost:3000/survey/fixture-survey/intro',
    });
  });
});
