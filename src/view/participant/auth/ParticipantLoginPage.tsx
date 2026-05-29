import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { useParticipantApiController, usePublicSurveyQuery } from '../../../api/participant';
import { Button } from '../../../components/Button';
import { Message } from '../../../components/Message';
import { useParticipantLocaleStore } from '../../../store/participantLocaleStore';
import { readLocalizedText, resolveSurveyDefaultLocale } from '../../../utils/i18nText';
import './css/ParticipantLoginPage.css';

export function ParticipantLoginPage() {
  const { publicSlug = '' } = useParams();
  const controller = useParticipantApiController();
  const surveyQuery = usePublicSurveyQuery(publicSlug);
  const { locale } = useParticipantLocaleStore();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const survey = surveyQuery.data;
  const defaultLocale = resolveSurveyDefaultLocale(survey);
  const displayLocale = locale ?? defaultLocale;

  const signIn = async () => {
    setIsSigningIn(true);
    setError(null);

    try {
      const redirectTo = new URL(`/survey/${publicSlug}/intro`, window.location.origin).toString();
      await controller.signInWithGoogle({ redirectTo });
    } catch {
      setError('로그인을 시작하지 못했습니다. 잠시 후 다시 시도해주세요.');
      setIsSigningIn(false);
    }
  };

  return (
    <main className="participant-login-page">
      <section className="participant-login-page__content">
        <p className="participant-login-page__eyebrow">Google 로그인</p>
        <h1>{survey ? readLocalizedText(survey.title, displayLocale, defaultLocale) : '설문 참여'}</h1>
        <p>Google 계정으로 로그인하면 이어서 설문에 참여할 수 있습니다.</p>

        <Message tone="info" title="Google 계정으로 참여할 수 있습니다.">
          <p>로그인 후 원래 설문으로 돌아옵니다.</p>
        </Message>

        {error ? (
          <Message tone="error" title="로그인이 필요합니다.">
            <p>{error}</p>
          </Message>
        ) : null}

        <Button fullWidth disabled={isSigningIn} onClick={signIn}>
          {isSigningIn ? '로그인 이동 중' : 'Google로 계속하기'}
        </Button>
      </section>
    </main>
  );
}
