import { useMemo } from 'react';

import type { SurveyDraft } from '../service/draft/draftStorage';
import { useParticipantApiController } from './participantApiControllerProvider';
import type { SurveyDraftIdentity } from './participantApiController';

export function useSurveyDraftStorage() {
  const controller = useParticipantApiController();

  return useMemo(
    () => ({
      loadDraft: (identity: SurveyDraftIdentity): Promise<SurveyDraft | null> => controller.loadSurveyDraft(identity),
      saveDraft: (draft: SurveyDraft): Promise<void> => controller.saveSurveyDraft(draft),
      removeDraft: (identity: SurveyDraftIdentity): Promise<void> => controller.removeSurveyDraft(identity),
    }),
    [controller],
  );
}
