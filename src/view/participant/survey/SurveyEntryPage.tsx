import { Navigate, useParams } from 'react-router-dom';

import { useParticipantSessionQuery, usePublicSurveyQuery } from '../../../api/participant';
import './css/SurveyEntryPage.css';

export function SurveyEntryPage() {
  const { publicSlug = '' } = useParams();
  const surveyQuery = usePublicSurveyQuery(publicSlug);
  const sessionQuery = useParticipantSessionQuery();

  if (surveyQuery.isPending || sessionQuery.isPending) {
    return <EntryShell title="설문을 불러오고 있습니다." description="잠시만 기다려주세요." />;
  }

  if (surveyQuery.isError) {
    if (!sessionQuery.data) {
      return <Navigate to={`/survey/${publicSlug}/login`} replace />;
    }

    return <Navigate to={`/survey/${publicSlug}/not-found`} replace />;
  }

  const survey = surveyQuery.data;

  if (survey.status !== 'published') {
    return <Navigate to={`/survey/${publicSlug}/closed`} replace />;
  }

  return <Navigate to={`/survey/${publicSlug}/login`} replace />;
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
