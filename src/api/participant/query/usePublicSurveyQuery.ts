import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useParticipantApiController } from '../controller/participantApiControllerProvider';
import type { PublicSurvey, SurveyAccessResult } from '../model';
import { participantQueryKeys } from './queryKeys';
import { useParticipantSessionQuery } from './useParticipantSessionQuery';

const PUBLIC_SURVEY_STALE_TIME_MS = 10 * 60 * 1000;
const PUBLIC_SURVEY_GC_TIME_MS = 30 * 60 * 1000;

export function usePublicSurveyQuery(publicSlug: string | undefined) {
  const controller = useParticipantApiController();
  const queryClient = useQueryClient();
  const sessionQuery = useParticipantSessionQuery();
  const authScope = sessionQuery.data?.userId ?? 'anonymous';
  const cachedAccessSurvey = readCachedAccessSurvey(queryClient, publicSlug ?? '', authScope);

  return useQuery({
    queryKey: participantQueryKeys.publicSurvey(publicSlug ?? '', authScope),
    queryFn: () => controller.getPublicSurvey(publicSlug ?? ''),
    enabled: Boolean(publicSlug) && !sessionQuery.isPending && !cachedAccessSurvey,
    initialData: cachedAccessSurvey,
    staleTime: PUBLIC_SURVEY_STALE_TIME_MS,
    gcTime: PUBLIC_SURVEY_GC_TIME_MS,
  });
}

function readCachedAccessSurvey(queryClient: ReturnType<typeof useQueryClient>, publicSlug: string, authScope: string): PublicSurvey | undefined {
  if (!publicSlug || authScope === 'anonymous') {
    return undefined;
  }

  const accessResults = queryClient.getQueriesData<SurveyAccessResult>({
    queryKey: ['participant', 'survey', publicSlug, 'access', authScope],
  });

  return accessResults.find(([, access]) => access?.survey)?.[1]?.survey;
}
