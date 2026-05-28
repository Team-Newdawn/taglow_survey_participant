import { useMutation } from '@tanstack/react-query';

import { useParticipantApiController } from '../controller/participantApiControllerProvider';
import type { ParticipantQuestionImageUploadCommand } from '../model/commands';

export function useParticipantQuestionImageUploadMutation() {
  const controller = useParticipantApiController();

  return useMutation({
    mutationFn: (command: ParticipantQuestionImageUploadCommand) => controller.uploadQuestionImage(command),
  });
}
