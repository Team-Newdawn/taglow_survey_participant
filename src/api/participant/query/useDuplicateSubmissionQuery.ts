import { useQuery } from '@tanstack/react-query';

import { useParticipantApiController } from '../controller/participantApiControllerProvider';
import { participantQueryKeys } from './queryKeys';

export function useDuplicateSubmissionQuery(args: {
  surveyId?: string;
  participantUserId?: string;
  participantDeviceId?: string;
}) {
  const controller = useParticipantApiController();
  const surveyId = args.surveyId ?? '';
  const participantUserId = args.participantUserId ?? '';
  const participantDeviceId = args.participantDeviceId ?? '';

  return useQuery({
    queryKey: participantQueryKeys.duplicateSubmission(surveyId, participantUserId, participantDeviceId),
    queryFn: () =>
      controller.checkDuplicateSubmission({
        surveyId,
        participantUserId,
        participantDeviceId,
      }),
    enabled: Boolean(args.surveyId && args.participantUserId),
  });
}
