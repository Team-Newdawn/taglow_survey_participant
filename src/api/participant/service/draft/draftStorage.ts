import type { Locale } from '../../model/publicSurvey';

export const SURVEY_DRAFT_SCHEMA_VERSION = 1;

export type SurveyDraft = Readonly<{
  surveyId: string;
  participantUserId: string;
  locale: Locale;
  currentSectionId?: string;
  values: Record<string, unknown>;
  updatedAt: string;
  schemaVersion: number;
}>;

export interface DraftStorage {
  loadDraft(key: string): Promise<SurveyDraft | null>;
  saveDraft(key: string, draft: SurveyDraft): Promise<void>;
  removeDraft(key: string): Promise<void>;
}

export function isSurveyDraft(value: unknown): value is SurveyDraft {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const draft = value as Partial<SurveyDraft>;
  return (
    typeof draft.surveyId === 'string' &&
    typeof draft.participantUserId === 'string' &&
    (draft.locale === 'ko' || draft.locale === 'en') &&
    typeof draft.updatedAt === 'string' &&
    typeof draft.schemaVersion === 'number' &&
    typeof draft.values === 'object' &&
    draft.values !== null
  );
}
