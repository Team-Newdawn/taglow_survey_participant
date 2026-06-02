import { useMutation } from '@tanstack/react-query';

import { useParticipantApiController } from '../controller/participantApiControllerProvider';
import type { ServiceFeedbackCommand } from '../model/commands';

export function useServiceFeedbackMutation() {
  const controller = useParticipantApiController();

  return useMutation({
    mutationFn: (command: ServiceFeedbackCommand) => controller.submitServiceFeedback(command),
  });
}
