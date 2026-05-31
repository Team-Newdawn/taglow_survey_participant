import type { PropsWithChildren } from 'react';
import { Navigate, useParams } from 'react-router-dom';

import { useParticipantSessionQuery, usePublicSurveyQuery, useSurveyAccessQuery } from '../api/participant';
import { Message } from '../components/Message';

export function RequirePublishedSurvey(props: PropsWithChildren) {
  const publicSlug = useRequiredPublicSlug();
  const surveyQuery = usePublicSurveyQuery(publicSlug);

  if (surveyQuery.isPending) {
    return <GuardState title="설문을 불러오고 있습니다." />;
  }

  if (surveyQuery.isError) {
    return <Navigate to={`/survey/${publicSlug}/not-found`} replace />;
  }

  if (surveyQuery.data.status !== 'published') {
    return <Navigate to={`/survey/${publicSlug}/closed`} replace />;
  }

  return props.children;
}

export function RequireParticipantAccess(props: PropsWithChildren) {
  const publicSlug = useRequiredPublicSlug();
  const accessQuery = useSurveyAccessQuery(publicSlug);
  const access = accessQuery.data;

  if (accessQuery.isPending) {
    return <GuardState title="참여 가능 여부를 확인하고 있습니다." />;
  }

  if (accessQuery.isError || !access || access.status === 'survey_not_found') {
    return <Navigate to={`/survey/${publicSlug}/not-found`} replace />;
  }

  if (access.status === 'survey_closed') {
    return <Navigate to={`/survey/${publicSlug}/closed`} replace />;
  }

  if (access.status === 'unauthenticated') {
    return <Navigate to={`/survey/${publicSlug}/login`} replace />;
  }

  if (access.status === 'already_submitted') {
    return <Navigate to={`/survey/${publicSlug}/already-submitted`} replace />;
  }

  return props.children;
}

function useRequiredPublicSlug(): string {
  const { publicSlug } = useParams();
  return publicSlug ?? '';
}

function GuardState(props: { title: string }) {
  return (
    <main className="route-state" aria-live="polite">
      <Message tone="info" title={props.title}>
        잠시만 기다려주세요.
      </Message>
    </main>
  );
}
