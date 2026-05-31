import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useParticipantApiController } from '../controller/participantApiControllerProvider';
import { participantQueryKeys } from './queryKeys';
import { useParticipantSessionQuery } from './useParticipantSessionQuery';

const SURVEY_ACCESS_STALE_TIME_MS = 60 * 1000;

export function useSurveyAccessQuery(publicSlug: string | undefined) {
  const controller = useParticipantApiController();
  const queryClient = useQueryClient();
  const sessionQuery = useParticipantSessionQuery();
  const session = sessionQuery.data;
  const authScope = session?.userId ?? 'anonymous';

  const accessQuery = useQuery({
    queryKey: participantQueryKeys.surveyAccess(publicSlug ?? '', authScope),
    queryFn: async () => {
      if (!session) {
        return { status: 'unauthenticated' as const };
      }

      return controller.checkAccess(publicSlug ?? '');
    },
    enabled: Boolean(publicSlug) && !sessionQuery.isPending,
    staleTime: SURVEY_ACCESS_STALE_TIME_MS,
  });

  useEffect(() => {
    if (!publicSlug || !session || !accessQuery.data?.survey) {
      return;
    }

    queryClient.setQueryData(participantQueryKeys.publicSurvey(publicSlug, session.userId), accessQuery.data.survey);
  }, [accessQuery.data?.survey, publicSlug, queryClient, session]);

  return accessQuery;
}
