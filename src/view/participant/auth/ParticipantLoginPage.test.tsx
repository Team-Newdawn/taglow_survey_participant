import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppRoutes } from '../../../app/router';
import { createFakeParticipantApiController } from '../../../test/fakeParticipantApiController';
import { renderWithProviders } from '../../../test/renderWithProviders';

describe('ParticipantLoginPage', () => {
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
