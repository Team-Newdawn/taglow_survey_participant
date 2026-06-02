import { Navigate, useParams } from 'react-router-dom';

import { useParticipantSessionQuery, useSurveyAccessQuery } from '../../../../api/participant';
import './css/SurveyEntryPage.css';

export function SurveyEntryPage() {
  const { publicSlug = '' } = useParams();
  const sessionQuery = useParticipantSessionQuery();
  const accessQuery = useSurveyAccessQuery(publicSlug);

  if (sessionQuery.isPending || accessQuery.isPending) {
    return <EntryShell title="설문을 불러오고 있습니다." description="잠시만 기다려주세요." />;
  }

  if (accessQuery.isError || accessQuery.data?.status === 'survey_not_found') {
    return <Navigate to={`/survey/${publicSlug}/not-found`} replace />;
  }

  if (accessQuery.data?.status === 'survey_closed') {
    return <Navigate to={`/survey/${publicSlug}/closed`} replace />;
  }

  if (accessQuery.data?.status === 'already_submitted') {
    return <Navigate to={`/survey/${publicSlug}/already-submitted`} replace />;
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
