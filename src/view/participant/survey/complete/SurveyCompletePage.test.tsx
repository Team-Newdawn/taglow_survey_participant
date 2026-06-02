import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRoutes } from '../../../../app/router';
import { useParticipantLocaleStore } from '../../../../store/participantLocaleStore';
import { createFakeParticipantApiController } from '../../../../test/fakeParticipantApiController';
import { renderWithProviders } from '../../../../test/renderWithProviders';

describe('SurveyCompletePage', () => {
  beforeEach(() => {
    useParticipantLocaleStore.getState().setLocale('ko');
  });

  it('submits optional Taglow service feedback separately from survey answers', async () => {
    const user = userEvent.setup();
    const submitServiceFeedback = vi.fn(async () => ({ submittedAt: '2026-06-02T00:00:00.000Z' }));

    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/complete',
      controller: createFakeParticipantApiController({ submitServiceFeedback }),
    });

    expect(screen.getByText(/Taglow 설문 서비스를 개선하기 위한 아이디어를 제공해주세요/)).toBeInTheDocument();

    const feedbackField = screen.getByRole('textbox', { name: '개선 아이디어' });
    const submitButton = screen.getByRole('button', { name: '아이디어 보내기' });
    expect(submitButton).toBeDisabled();

    await user.type(feedbackField, '  완료 후에도 의견을 남길 수 있어서 좋습니다.  ');
    await user.click(submitButton);

    await waitFor(() =>
      expect(submitServiceFeedback).toHaveBeenCalledWith({
        publicSlug: 'fixture-survey',
        locale: 'ko',
        feedbackText: '완료 후에도 의견을 남길 수 있어서 좋습니다.',
      }),
    );
    expect(await screen.findByText('아이디어가 전달되었습니다.')).toBeInTheDocument();
    expect(feedbackField).toHaveValue('');
  });
});
