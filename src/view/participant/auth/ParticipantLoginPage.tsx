import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { useParticipantApiController, useParticipantSessionQuery } from '../../../api/participant';
import newdawnDomunionLogoUrl from '../../../assets/logo_newdawn_domunion.png';
import taglowLogoUrl from '../../../assets/taglow_logo.png';
import { Button } from '../../../components/Button';
import { Message } from '../../../components/Message';
import './css/ParticipantLoginPage.css';

export function ParticipantLoginPage() {
  const { publicSlug = '' } = useParams();
  const controller = useParticipantApiController();
  const sessionQuery = useParticipantSessionQuery();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
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
  };

  return (
    <main className="participant-login-page">
      <header className="participant-login-page__top">
        <img src={taglowLogoUrl} alt="Taglow" className="participant-login-page__logo" />
      </header>

      <section
        className="participant-login-page__body"
        aria-labelledby="participant-login-title"
        aria-describedby="participant-login-description participant-login-collaboration"
      >
        <h1 id="participant-login-title">목소리를 더 선명하게 모읍니다.</h1>
        <p id="participant-login-description">Taglow는 현장의 의견을 기록하고 필요한 변화를 찾도록 돕는 피드백 플랫폼입니다.</p>
        <p id="participant-login-collaboration">
          이번 설문은 <strong>한동대학교 자치회</strong>와 <strong>뉴던</strong>의 협업으로 진행됩니다. 설문 내용은{' '}
          <strong>자치회</strong>에서 제공하였고, 플랫폼은 <strong>뉴던</strong>에서 제공합니다.
        </p>
      </section>

      <footer className="participant-login-page__bottom">
        {error ? (
          <Message tone="error" title="로그인이 필요합니다.">
            <p>{error}</p>
          </Message>
        ) : null}

        <img src={newdawnDomunionLogoUrl} alt="Newdawn Domunion" className="participant-login-page__partner-logo" />
        <Button fullWidth disabled={isSigningIn || sessionQuery.isPending} onClick={signIn}>
          {isSigningIn ? '로그인 이동 중' : 'Google로 계속하기'}
        </Button>
      </footer>
    </main>
  );
}
