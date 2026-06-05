import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PublicSurvey } from '../../../api/participant';
import { AppRoutes } from '../../../app/router';
import { createFakeParticipantApiController } from '../../../test/fakeParticipantApiController';
import { publishedSurveyFixture } from '../../../test/fixtures/publicSurveyFixture';
import { renderWithProviders } from '../../../test/renderWithProviders';
import {
  buildAndroidBrowserIntentUrl,
  createGoogleOAuthHandoffUrl,
  hasGoogleOAuthHandoffParam,
  removeGoogleOAuthHandoffParam,
  shouldUseAndroidBrowserHandoff,
} from './browserHandoff';

describe('ParticipantLoginPage', () => {
  const originalUserAgent = window.navigator.userAgent;
  const originalLanguage = window.navigator.language;
  const originalLanguages = window.navigator.languages;

  afterEach(() => {
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: originalUserAgent,
    });
    Object.defineProperty(window.navigator, 'language', {
      configurable: true,
      value: originalLanguage,
    });
    Object.defineProperty(window.navigator, 'languages', {
      configurable: true,
      value: originalLanguages,
    });
  });

  it('shows Korean login copy when the system language is Korean', async () => {
    setNavigatorLanguages(['ko-KR', 'en-US']);

    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/login',
    });

    const logo = await screen.findByRole('img', { name: 'Taglow' });
    const partnerLogo = screen.getByRole('img', { name: 'Newdawn Domunion' });
    const title = await screen.findByRole('heading', { name: '목소리를 더 선명하게 모읍니다.' });
    const signInButton = screen.getByRole('button', { name: 'Google로 계속하기' });

    expect(document.querySelector('.participant-login-page__top')).toContainElement(logo);
    expect(document.querySelector('.participant-login-page__top')).not.toContainElement(partnerLogo);
    expect(document.querySelector('.participant-login-page__body')).toContainElement(title);
    expect(document.querySelector('.participant-login-page__bottom')).toContainElement(partnerLogo);
    expect(document.querySelector('.participant-login-page__bottom')).toContainElement(signInButton);
    expect(partnerLogo.compareDocumentPosition(signInButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(await screen.findByText('Taglow는 현장의 의견을 기록하고 필요한 변화를 찾도록 돕는 피드백 플랫폼입니다.')).toBeInTheDocument();
    expect(screen.queryByText('생활관 정기 설문조사')).not.toBeInTheDocument();
    expect(screen.queryByText(/설문에 참여/)).not.toBeInTheDocument();
  });

  it('shows English login copy when the system language is not Korean', async () => {
    setNavigatorLanguages(['en-US']);

    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/login',
    });

    expect(await screen.findByRole('heading', { name: 'Collecting every voice more clearly.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument();
    expect(screen.getByText('Taglow helps teams collect feedback clearly and find the changes that matter.')).toBeInTheDocument();
    expect(screen.queryByText('목소리를 더 선명하게 모읍니다.')).not.toBeInTheDocument();
  });

  it('does not fall back to Korean configured login text for non-Korean system languages', async () => {
    setNavigatorLanguages(['ja-JP']);

    const survey = {
      ...publishedSurveyFixture,
      settings: {
        ...publishedSurveyFixture.settings,
        participantLogin: {
          headline: '한국어 전용 로그인 제목',
          bodyParagraphs: ['한국어 전용 로그인 설명'],
        },
      },
    } satisfies PublicSurvey;

    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/login',
      controller: createFakeParticipantApiController({ survey }),
    });

    expect(await screen.findByRole('heading', { name: 'Collecting every voice more clearly.' })).toBeInTheDocument();
    expect(screen.queryByText('한국어 전용 로그인 제목')).not.toBeInTheDocument();
    expect(screen.queryByText('한국어 전용 로그인 설명')).not.toBeInTheDocument();
  });

  it('renders participantLogin images and bold markdown from survey settings', async () => {
    setNavigatorLanguages(['ko-KR']);

    const survey = {
      ...publishedSurveyFixture,
      settings: {
        ...publishedSurveyFixture.settings,
        participantLogin: {
          headline: '생활관 설문에 참여해주세요.',
          topImage: {
            assetId: 'login-top-asset',
            alt: 'Configured top image',
          },
          bodyParagraphs: [
            '이번 설문은 **생활관 환경 개선**을 위해 진행됩니다.',
            '**응답 내용**은 더 나은 공간 운영을 위한 참고 자료로만 사용됩니다.',
          ],
          bottomImage: {
            storagePath: 'fixture-survey/login-bottom.png',
            alt: 'Configured bottom image',
          },
        },
      },
      assets: [
        ...publishedSurveyFixture.assets,
        {
          id: 'login-top-asset',
          surveyId: publishedSurveyFixture.id,
          assetType: 'image',
          storageBucket: 'survey-assets',
          storagePath: 'fixture-survey/login-top.png',
          metadata: {},
        },
        {
          id: 'login-bottom-asset',
          surveyId: publishedSurveyFixture.id,
          assetType: 'image',
          storageBucket: 'survey-assets',
          storagePath: 'fixture-survey/login-bottom.png',
          metadata: {},
        },
      ],
    } satisfies PublicSurvey;

    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/login',
      controller: createFakeParticipantApiController({ survey }),
    });

    expect(await screen.findByRole('heading', { name: '생활관 설문에 참여해주세요.' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Configured top image' })).toHaveAttribute('src', 'https://example.com/asset.jpg');
      expect(screen.getByRole('img', { name: 'Configured bottom image' })).toHaveAttribute('src', 'https://example.com/asset.jpg');
    });
    expect(screen.getByText('생활관 환경 개선').tagName).toBe('STRONG');
    expect(screen.getByText('응답 내용').tagName).toBe('STRONG');
  });

  it('does not show a browser handoff hint in Android KakaoTalk in-app browser', async () => {
    setNavigatorLanguages(['ko-KR']);

    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Linux; Android 14) KAKAOTALK',
    });

    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/login',
    });

    expect(await screen.findByRole('button', { name: 'Google로 계속하기' })).toBeInTheDocument();
    expect(screen.queryByText('외부 브라우저에서 로그인을 이어갑니다.')).not.toBeInTheDocument();
    expect(screen.queryByText('Google로 계속하기를 누르면 기본 브라우저에서 로그인 화면을 다시 엽니다.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '링크 복사' })).not.toBeInTheDocument();
  });

  it('continues Google sign-in when the login page reopens after Android browser handoff', async () => {
    setNavigatorLanguages(['ko-KR']);

    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Linux; Android 14) Chrome/125.0.0.0 Mobile Safari/537.36',
    });

    const signInWithGoogle = vi.fn(async () => undefined);
    const controller = {
      ...createFakeParticipantApiController(),
      signInWithGoogle,
    };

    renderWithProviders(<AppRoutes />, {
      route: '/survey/fixture-survey/login?startGoogleOAuth=1',
      controller,
    });

    await waitFor(() => expect(signInWithGoogle).toHaveBeenCalledTimes(1));
    expect(signInWithGoogle).toHaveBeenCalledWith({
      redirectTo: 'http://localhost:3000/survey/fixture-survey/intro',
    });
  });

  it('clears an existing participant session before starting Google sign-in', async () => {
    setNavigatorLanguages(['ko-KR']);

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

function setNavigatorLanguages(languages: string[]) {
  Object.defineProperty(window.navigator, 'language', {
    configurable: true,
    value: languages[0] ?? '',
  });
  Object.defineProperty(window.navigator, 'languages', {
    configurable: true,
    value: languages,
  });
}

describe('browserHandoff', () => {
  it('uses Android browser handoff only for Android in-app browsers', () => {
    expect(shouldUseAndroidBrowserHandoff('Mozilla/5.0 (Linux; Android 14) KAKAOTALK')).toBe(true);
    expect(shouldUseAndroidBrowserHandoff('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5) KAKAOTALK')).toBe(false);
    expect(shouldUseAndroidBrowserHandoff('Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36')).toBe(false);
  });

  it('creates and removes the Google OAuth handoff marker', () => {
    const handoffUrl = createGoogleOAuthHandoffUrl(new URL('https://survey.example.com/survey/abc/login?from=kakao'));
    expect(handoffUrl.toString()).toBe('https://survey.example.com/survey/abc/login?from=kakao&startGoogleOAuth=1');
    expect(hasGoogleOAuthHandoffParam(handoffUrl.search)).toBe(true);

    const cleanUrl = removeGoogleOAuthHandoffParam(handoffUrl);
    expect(cleanUrl.toString()).toBe('https://survey.example.com/survey/abc/login?from=kakao');
    expect(hasGoogleOAuthHandoffParam(cleanUrl.search)).toBe(false);
  });

  it('builds a browser intent URL with the original login URL as fallback', () => {
    const targetUrl = new URL('https://survey.example.com/survey/abc/login?startGoogleOAuth=1');
    const intentUrl = buildAndroidBrowserIntentUrl(targetUrl);

    expect(intentUrl).toBe(
      'intent://survey.example.com/survey/abc/login?startGoogleOAuth=1' +
        '#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;' +
        `S.browser_fallback_url=${encodeURIComponent(targetUrl.toString())};end`,
    );
  });
});
