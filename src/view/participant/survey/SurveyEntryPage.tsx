import { Navigate, useParams } from 'react-router-dom';

import { useParticipantSessionQuery, usePublicSurveyQuery } from '../../../api/participant';
import { ButtonLink } from '../../../components/Button';
import { Message } from '../../../components/Message';
import { useParticipantLocaleStore } from '../../../store/participantLocaleStore';
import { readLocalizedText, resolveSurveyDefaultLocale } from '../../../utils/i18nText';
import './css/SurveyEntryPage.css';

export function SurveyEntryPage() {
  const { publicSlug = '' } = useParams();
  const surveyQuery = usePublicSurveyQuery(publicSlug);
  const sessionQuery = useParticipantSessionQuery();
  const { locale, setLocale } = useParticipantLocaleStore();

  if (surveyQuery.isPending || sessionQuery.isPending) {
    return <EntryShell title="설문을 불러오고 있습니다." description="잠시만 기다려주세요." />;
  }

  if (surveyQuery.isError) {
    if (!sessionQuery.data) {
      return (
        <main className="survey-entry-page">
          <section className="survey-entry-page__hero">
            <p className="survey-entry-page__eyebrow">Taglow Survey</p>
            <h1>Google 계정으로 설문을 확인해주세요.</h1>
            <p>로그인 후 참여 가능한 설문인지 확인할 수 있습니다.</p>
          </section>
          <section className="survey-entry-page__panel">
            <Message tone="info" title="Google 로그인이 필요합니다.">
              <p>Google 계정으로 로그인하면 원래 설문으로 돌아옵니다.</p>
            </Message>
            <ButtonLink fullWidth href={`/survey/${publicSlug}/login`}>
              Google 로그인으로 계속하기
            </ButtonLink>
          </section>
        </main>
      );
    }

    return <Navigate to={`/survey/${publicSlug}/not-found`} replace />;
  }

  const survey = surveyQuery.data;
  const defaultLocale = resolveSurveyDefaultLocale(survey);
  const displayLocale = locale ?? defaultLocale;

  if (survey.status !== 'published') {
    return <Navigate to={`/survey/${publicSlug}/closed`} replace />;
  }

  if (sessionQuery.data) {
    return <Navigate to={`/survey/${publicSlug}/intro`} replace />;
  }

  return (
    <main className="survey-entry-page">
      <section className="survey-entry-page__hero">
        <p className="survey-entry-page__eyebrow">Taglow Survey</p>
        <h1>{readLocalizedText(survey.title, displayLocale, defaultLocale)}</h1>
        {survey.description ? <p>{readLocalizedText(survey.description, displayLocale, defaultLocale)}</p> : null}
      </section>

      <section className="survey-entry-page__panel">
        <div className="survey-entry-page__locale" aria-label="언어 선택">
          <button className={displayLocale === 'ko' ? 'is-selected' : ''} type="button" onClick={() => setLocale('ko')}>
            한국어
          </button>
          <button className={displayLocale === 'en' ? 'is-selected' : ''} type="button" onClick={() => setLocale('en')}>
            English
          </button>
        </div>

        <Message tone="info" title="Google 계정으로 참여해주세요.">
          <p>로그인 후 설문을 시작할 수 있습니다.</p>
        </Message>

        <ul className="survey-entry-page__facts">
          <li>섹션별로 나누어 부담 없이 응답합니다.</li>
          <li>같은 브라우저에서는 작성 중인 응답을 임시 저장할 수 있습니다.</li>
          <li>응답은 시설 개선과 보고 자료에 활용됩니다.</li>
        </ul>

        <ButtonLink fullWidth href={`/survey/${publicSlug}/login`}>
          시작하기
        </ButtonLink>
      </section>
    </main>
  );
}

function EntryShell(props: { title: string; description: string }) {
  return (
    <main className="survey-entry-page">
      <section className="survey-entry-page__hero">
        <h1>{props.title}</h1>
        <p>{props.description}</p>
      </section>
    </main>
  );
}
