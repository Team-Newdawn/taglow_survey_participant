import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { useParticipantApiController, useParticipantSessionQuery } from '../../../api/participant';
import taglowLogoUrl from '../../../assets/taglow_logo.svg';
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

      <section className="participant-login-page__body" aria-labelledby="participant-login-title">
        <div className="participant-login-page__intro">
          <h1 id="participant-login-title">목소리를 더 선명하게 모읍니다.</h1>
          <p>Taglow는 현장의 의견을 기록하고 필요한 변화를 찾도록 돕는 피드백 플랫폼입니다.</p>
        </div>

        <p className="participant-login-page__note">Google 계정으로 시작할 수 있습니다.</p>
      </section>

      <footer className="participant-login-page__bottom">
        {error ? (
          <Message tone="error" title="로그인이 필요합니다.">
            <p>{error}</p>
          </Message>
        ) : null}

        <Button fullWidth disabled={isSigningIn || sessionQuery.isPending} onClick={signIn}>
          {isSigningIn ? '로그인 이동 중' : 'Google로 계속하기'}
        </Button>
      </footer>
    </main>
  );
}
