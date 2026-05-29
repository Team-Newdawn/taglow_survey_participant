import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';

import type { ParticipantApiController } from '../api/participant';
import { ParticipantApiControllerProvider } from '../api/participant';
import { createAppQueryClient } from '../app/queryClient';
import { createFakeParticipantApiController } from './fakeParticipantApiController';

type RenderOptions = {
  route?: string;
  controller?: ParticipantApiController;
};

export function renderWithProviders(ui: ReactElement, options: RenderOptions = {}) {
  const queryClient = createAppQueryClient();
  const controller = options.controller ?? createFakeParticipantApiController();

  return render(
    <QueryClientProvider client={queryClient}>
      <ParticipantApiControllerProvider value={controller}>
        <MemoryRouter initialEntries={[options.route ?? '/survey/fixture-survey']}>{ui}</MemoryRouter>
      </ParticipantApiControllerProvider>
    </QueryClientProvider>,
  );
}
