import { useCallback, useEffect, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import {
  SURVEY_DRAFT_SCHEMA_VERSION,
  useSurveyDraftStorage,
  type Locale,
  type ParticipantSession,
  type PublicSurvey,
  type PublicSurveySection,
  type SurveyDraft,
} from '../../../api/participant';
import type { DraftSaveStatus } from '../../../store/participantDraftStore';

const AUTOSAVE_DELAY_MS = 6500;

type UseDraftAutosaveArgs = {
  survey: PublicSurvey | undefined;
  session: ParticipantSession | null | undefined;
  section: PublicSurveySection | undefined;
  displayLocale: Locale;
  form: UseFormReturn<Record<string, unknown>>;
  values: Record<string, unknown>;
  setValues: (values: Record<string, unknown>) => void;
  setDraftStatus: (status: DraftSaveStatus) => void;
  setLastSavedAt: (updatedAt: string | undefined) => void;
  setRestoreDraftUpdatedAt: (updatedAt: string | undefined) => void;
};

export function useDraftAutosave(args: UseDraftAutosaveArgs) {
  const {
    survey,
    session,
    section,
    displayLocale,
    form,
    values,
    setValues,
    setDraftStatus,
    setLastSavedAt,
    setRestoreDraftUpdatedAt,
  } = args;
  const draftStorage = useSurveyDraftStorage();
  const [restoreDraft, setRestoreDraft] = useState<SurveyDraft | null>(null);

  const saveDraft = useCallback(async () => {
    if (!survey || !session || !section) {
      return;
    }

    const formValues = form.getValues();
    const draft: SurveyDraft = {
      surveyId: survey.id,
      participantUserId: session.userId,
      locale: displayLocale,
      currentSectionId: section.id,
      values: formValues,
      updatedAt: new Date().toISOString(),
      schemaVersion: SURVEY_DRAFT_SCHEMA_VERSION,
    };

    try {
      setDraftStatus('saving');
      await draftStorage.saveDraft(draft);
      setValues(formValues);
      setLastSavedAt(draft.updatedAt);
      setDraftStatus('saved');
    } catch {
      setDraftStatus('error');
    }
  }, [displayLocale, draftStorage, form, section, session, setDraftStatus, setLastSavedAt, setValues, survey]);

  const removeDraft = useCallback(async () => {
    if (!survey || !session) {
      return;
    }

    await draftStorage.removeDraft({
      surveyId: survey.id,
      participantUserId: session.userId,
    });
  }, [draftStorage, session, survey]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void saveDraft();
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [saveDraft, values]);

  useEffect(() => {
    if (!survey || !session || Object.keys(values).length > 0) {
      return;
    }

    void draftStorage
      .loadDraft({
        surveyId: survey.id,
        participantUserId: session.userId,
      })
      .then((loadedDraft) => {
        if (loadedDraft?.schemaVersion === SURVEY_DRAFT_SCHEMA_VERSION) {
          setRestoreDraft(loadedDraft);
          setRestoreDraftUpdatedAt(loadedDraft.updatedAt);
        }
      });
  }, [draftStorage, session, setRestoreDraftUpdatedAt, survey, values]);

  useEffect(() => {
    const saveOnHidden = () => {
      if (document.visibilityState === 'hidden') {
        void saveDraft();
      }
    };
    const saveOnUnload = () => {
      void saveDraft();
    };

    document.addEventListener('visibilitychange', saveOnHidden);
    window.addEventListener('beforeunload', saveOnUnload);

    return () => {
      document.removeEventListener('visibilitychange', saveOnHidden);
      window.removeEventListener('beforeunload', saveOnUnload);
    };
  }, [saveDraft]);

  return {
    restoreDraft,
    setRestoreDraft,
    saveDraft,
    removeDraft,
  };
}
