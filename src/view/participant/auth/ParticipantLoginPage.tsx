import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import {
  useAssetUrlsQuery,
  useParticipantApiController,
  useParticipantSessionQuery,
  usePublicSurveyLoginPageQuery,
} from '../../../api/participant';
import newdawnDomunionLogoUrl from '../../../assets/logo_newdawn_domunion.png';
import taglowLogoUrl from '../../../assets/taglow_logo.png';
import { Button } from '../../../components/Button';
import { Message } from '../../../components/Message';
import { resolveSurveyDefaultLocale } from '../../../utils/i18nText';
import {
  buildAndroidBrowserIntentUrl,
  createGoogleOAuthHandoffUrl,
  hasGoogleOAuthHandoffParam,
  isLikelyInAppBrowser,
  removeGoogleOAuthHandoffParam,
  shouldUseAndroidBrowserHandoff,
} from './browserHandoff';
import './css/ParticipantLoginPage.css';
import { getLoginPageContent, getLoginPageImageAssets } from './loginPageContent';

export function ParticipantLoginPage() {
  const { publicSlug = '' } = useParams();
  const location = useLocation();
  const controller = useParticipantApiController();
  const sessionQuery = useParticipantSessionQuery();
  const surveyQuery = usePublicSurveyLoginPageQuery(publicSlug);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const locale = resolveSurveyDefaultLocale(surveyQuery.data);
  const loginContent = useMemo(() => getLoginPageContent(surveyQuery.data, locale), [surveyQuery.data, locale]);
  const isInAppBrowser = useMemo(() => isLikelyInAppBrowser(window.navigator.userAgent), []);
  const usesAndroidBrowserHandoff = useMemo(() => shouldUseAndroidBrowserHandoff(window.navigator.userAgent), []);
  const loginUrl = useMemo(
    () => new URL(`${location.pathname}${location.search}${location.hash}`, window.location.origin),
    [location.hash, location.pathname, location.search],
  );
  const shouldAutoStartGoogleOAuth = hasGoogleOAuthHandoffParam(location.search);
  const loginImageAssets = useMemo(() => getLoginPageImageAssets(loginContent), [loginContent]);
  const assetUrlsQuery = useAssetUrlsQuery(loginImageAssets);
  const topImageSrc = loginContent.topImage?.url ?? readAssetUrl(assetUrlsQuery.data, loginContent.topImage?.asset?.id) ?? taglowLogoUrl;
  const bottomImageSrc =
    loginContent.bottomImage?.url ?? readAssetUrl(assetUrlsQuery.data, loginContent.bottomImage?.asset?.id) ?? newdawnDomunionLogoUrl;
  const fallbackTitle = '목소리를 더 선명하게 모읍니다.';
  const title = loginContent.title ?? (surveyQuery.isPending ? '' : fallbackTitle);
  const fallbackParagraphs = [
    'Taglow는 현장의 의견을 기록하고 필요한 변화를 찾도록 돕는 피드백 플랫폼입니다.',
    '이번 설문은 **한동대학교 자치회**와 **뉴던**의 협업으로 진행됩니다. 설문 내용은 **자치회**에서 제공하였고, 플랫폼은 **뉴던**에서 제공합니다.',
  ];
  const paragraphs =
    loginContent.paragraphs.length > 0
      ? loginContent.paragraphs
      : surveyQuery.isPending
        ? []
        : fallbackParagraphs;
  const paragraphIds = paragraphs.map((_, index) => `participant-login-description-${index}`);

  const copyCurrentLink = async () => {
    try {
      await window.navigator.clipboard.writeText(window.location.href);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };

  const startGoogleSignIn = useCallback(async () => {
    setIsSigningIn(true);
    setError(null);

    try {
      const redirectTo = new URL(`/survey/${publicSlug}/intro`, window.location.origin).toString();
      if (sessionQuery.data) {
        await controller.signOut();
      }

      await controller.signInWithGoogle({ redirectTo });
    } catch {
      setError('로그인을 시작하지 못했습니다. 잠시 후 다시 시도해주세요.');
      setIsSigningIn(false);
    }
  }, [controller, publicSlug, sessionQuery.data]);

  useEffect(() => {
    if (!shouldAutoStartGoogleOAuth || isInAppBrowser || sessionQuery.isPending || isSigningIn) {
      return;
    }

    const cleanUrl = removeGoogleOAuthHandoffParam(loginUrl);
    window.history.replaceState(window.history.state, '', `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
    void startGoogleSignIn();
  }, [isInAppBrowser, isSigningIn, loginUrl, sessionQuery.isPending, shouldAutoStartGoogleOAuth, startGoogleSignIn]);

  const signIn = () => {
    if (usesAndroidBrowserHandoff) {
      const handoffUrl = createGoogleOAuthHandoffUrl(loginUrl);
      setIsSigningIn(true);
      setError(null);
      window.location.href = buildAndroidBrowserIntentUrl(handoffUrl);
      return;
    }

    void startGoogleSignIn();
  };

  return (
    <main className="participant-login-page">
      <header className="participant-login-page__top">
        <img src={topImageSrc} alt={loginContent.topImage?.alt || 'Taglow'} className="participant-login-page__logo" />
      </header>

      <section
        className="participant-login-page__body"
        aria-labelledby={title ? 'participant-login-title' : undefined}
        aria-describedby={paragraphIds.length > 0 ? paragraphIds.join(' ') : undefined}
      >
        {title ? <h1 id="participant-login-title">{title}</h1> : null}
        {paragraphs.map((paragraph, index) => (
          <p id={paragraphIds[index]} key={`${paragraphIds[index]}-${paragraph}`}>
            {renderBoldText(paragraph)}
          </p>
        ))}
      </section>

      <footer className="participant-login-page__bottom">
        {error ? (
          <Message tone="error" title="로그인이 필요합니다.">
            <p>{error}</p>
          </Message>
        ) : null}

        <img src={bottomImageSrc} alt={loginContent.bottomImage?.alt || 'Newdawn Domunion'} className="participant-login-page__partner-logo" />
        {isInAppBrowser ? (
          <Message
            tone="warning"
            title={usesAndroidBrowserHandoff ? '외부 브라우저에서 로그인을 이어갑니다.' : 'Google 로그인이 차단될 수 있습니다.'}
            action={
              <Button variant="secondary" onClick={copyCurrentLink} type="button">
                링크 복사
              </Button>
            }
          >
            <p>
              {usesAndroidBrowserHandoff
                ? 'Google로 계속하기를 누르면 기본 브라우저에서 로그인 화면을 다시 엽니다.'
                : '오류가 나면 이 링크를 Chrome 또는 Safari에서 다시 열어주세요.'}
            </p>
            {copyState === 'copied' ? <p>링크를 복사했습니다.</p> : null}
            {copyState === 'failed' ? <p>주소창의 링크를 직접 복사해주세요.</p> : null}
          </Message>
        ) : null}
        <Button fullWidth disabled={isSigningIn || sessionQuery.isPending} onClick={signIn}>
          {isSigningIn ? '로그인 이동 중' : 'Google로 계속하기'}
        </Button>
      </footer>
    </main>
  );
}

function readAssetUrl(assetUrls: Record<string, string> | undefined, assetId: string | undefined): string | undefined {
  return assetId ? assetUrls?.[assetId] : undefined;
}

function renderBoldText(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const boldPattern = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = boldPattern.exec(text))) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    nodes.push(<strong key={`strong-${match.index}`}>{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}
