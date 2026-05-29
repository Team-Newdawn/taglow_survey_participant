import type { PropsWithChildren } from 'react';
import { Navigate, useParams } from 'react-router-dom';

import { useDuplicateSubmissionQuery, useParticipantSessionQuery, usePublicSurveyQuery } from '../api/participant';
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
  const surveyQuery = usePublicSurveyQuery(publicSlug);
  const sessionQuery = useParticipantSessionQuery();
  const survey = surveyQuery.data;
  const session = sessionQuery.data;
  const duplicateQuery = useDuplicateSubmissionQuery({
    surveyId: survey?.id,
    participantUserId: session?.userId,
  });

  if (sessionQuery.isPending) {
    return <GuardState title="참여 가능 여부를 확인하고 있습니다." />;
  }

  if (surveyQuery.isPending) {
    return <GuardState title="참여 가능 여부를 확인하고 있습니다." />;
  }

  if ((surveyQuery.isError || !survey) && !session) {
    return <Navigate to={`/survey/${publicSlug}/login`} replace />;
  }

  if (surveyQuery.isError || !survey) {
    return <Navigate to={`/survey/${publicSlug}/not-found`} replace />;
  }

  if (survey.status !== 'published') {
    return <Navigate to={`/survey/${publicSlug}/closed`} replace />;
  }

  if (!session) {
    return <Navigate to={`/survey/${publicSlug}/login`} replace />;
  }

  if (duplicateQuery.isPending) {
    return <GuardState title="제출 이력을 확인하고 있습니다." />;
  }

  if (duplicateQuery.data?.alreadySubmitted) {
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
