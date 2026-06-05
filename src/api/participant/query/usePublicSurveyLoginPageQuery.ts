import { useQuery } from '@tanstack/react-query';

import { useParticipantApiController } from '../controller/participantApiControllerProvider';
import { participantQueryKeys } from './queryKeys';

const PUBLIC_SURVEY_LOGIN_PAGE_STALE_TIME_MS = 10 * 60 * 1000;
const PUBLIC_SURVEY_LOGIN_PAGE_GC_TIME_MS = 30 * 60 * 1000;

export function usePublicSurveyLoginPageQuery(publicSlug: string | undefined) {
  const controller = useParticipantApiController();

  return useQuery({
    queryKey: participantQueryKeys.publicSurveyLoginPage(publicSlug ?? ''),
    queryFn: () => controller.getPublicSurveyLoginPage(publicSlug ?? ''),
    enabled: Boolean(publicSlug),
    staleTime: PUBLIC_SURVEY_LOGIN_PAGE_STALE_TIME_MS,
    gcTime: PUBLIC_SURVEY_LOGIN_PAGE_GC_TIME_MS,
  });
}
