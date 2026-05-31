import { useQuery } from '@tanstack/react-query';

import { useParticipantApiController } from '../controller/participantApiControllerProvider';
import { participantQueryKeys } from './queryKeys';
import { useParticipantSessionQuery } from './useParticipantSessionQuery';

const PUBLIC_SURVEY_STALE_TIME_MS = 10 * 60 * 1000;
const PUBLIC_SURVEY_GC_TIME_MS = 30 * 60 * 1000;

export function usePublicSurveyQuery(publicSlug: string | undefined) {
  const controller = useParticipantApiController();
  const sessionQuery = useParticipantSessionQuery();
  const authScope = sessionQuery.data?.userId ?? 'anonymous';

  return useQuery({
    queryKey: participantQueryKeys.publicSurvey(publicSlug ?? '', authScope),
    queryFn: () => controller.getPublicSurvey(publicSlug ?? ''),
    enabled: Boolean(publicSlug) && !sessionQuery.isPending,
    staleTime: PUBLIC_SURVEY_STALE_TIME_MS,
    gcTime: PUBLIC_SURVEY_GC_TIME_MS,
  });
}
