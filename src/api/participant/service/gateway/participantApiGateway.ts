export type RawJson = Record<string, unknown>;

export type RawSession = Readonly<{
  user: {
    id: string;
    email?: string;
  };
  access_token?: string;
}>;

export type RawSurveyRow = Readonly<{
  id: string;
  title?: string | null;
  title_ko?: string | null;
  title_en?: string | null;
  description?: string | null;
  description_ko?: string | null;
  description_en?: string | null;
  status: string;
  public_slug?: string | null;
  public_code?: string | null;
  version_group_id?: string | null;
  version_number?: number | null;
  parent_survey_id?: string | null;
  is_latest_version?: boolean | null;
  settings?: RawJson | null;
  published_at?: string | null;
  closed_at?: string | null;
}>;

export type RawSectionRow = Readonly<{
  id: string;
  survey_id: string;
  section_key: string;
  title_ko?: string | null;
  title_en?: string | null;
  description_ko?: string | null;
  description_en?: string | null;
  order_index: number;
  section_type?: string | null;
  settings?: RawJson | null;
}>;

export type RawQuestionRow = Readonly<{
  id: string;
  survey_id: string;
  section_id: string;
  question_key: string;
  question_type: string;
  title_ko?: string | null;
  title_en?: string | null;
  description_ko?: string | null;
  description_en?: string | null;
  order_index: number;
  is_required?: boolean | null;
  metric_type?: string | null;
  topic_key?: string | null;
  space_key?: string | null;
  config?: RawJson | null;
  validation?: RawJson | null;
}>;

export type RawAssetRow = Readonly<{
  id: string;
  survey_id: string;
  section_id?: string | null;
  question_id?: string | null;
  asset_type: string;
  storage_bucket: string;
  storage_path: string;
  metadata?: RawJson | null;
}>;

export type RawPublicSurveyBundle = Readonly<{
  survey: RawSurveyRow;
  sections: RawSectionRow[];
  questions: RawQuestionRow[];
  assets: RawAssetRow[];
}>;

export type RawDuplicateSubmissionResult = Readonly<{
  alreadySubmitted: boolean;
  responseId?: string;
  submittedAt?: string;
}>;

export type RawCreateResponsePayload = Readonly<Record<string, unknown>>;
export type RawCreateAnswerPayload = Readonly<Record<string, unknown>>;

export type RawResponse = Readonly<{
  id: string;
  submitted_at?: string | null;
  [key: string]: unknown;
}>;

export type RawAnswer = Readonly<{
  id: string;
  [key: string]: unknown;
}>;

export type RawSubmitSurveyPayload = Readonly<{
  response: RawCreateResponsePayload;
  answers: RawCreateAnswerPayload[];
  rawPayload: Record<string, unknown>;
}>;

export type RawSubmitSurveyResult = Readonly<{
  responseId: string;
  submittedAt?: string;
}>;

export type RawParticipantQuestionImageUpload = Readonly<{
  storage_bucket: string;
  storage_path: string;
  signed_url?: string;
  metadata: RawJson;
}>;

export interface ParticipantApiGateway {
  getSession(): Promise<RawSession | null>;
  signInWithGoogle(redirectTo: string): Promise<void>;
  signOut(): Promise<void>;
  fetchPublicSurveyBySlug(publicSlug: string): Promise<RawPublicSurveyBundle>;
  checkDuplicateSubmission(args: {
    surveyId: string;
    participantUserId: string;
  }): Promise<RawDuplicateSubmissionResult>;
  createResponse(payload: RawCreateResponsePayload): Promise<RawResponse>;
  createAnswers(payloads: RawCreateAnswerPayload[]): Promise<RawAnswer[]>;
  submitSurveyResponse?(payload: RawSubmitSurveyPayload): Promise<RawSubmitSurveyResult>;
  createSignedAssetUrl(args: {
    bucket: string;
    path: string;
  }): Promise<string>;
  uploadQuestionImage(command: {
    surveyId: string;
    questionId: string;
    file: File;
  }): Promise<RawParticipantQuestionImageUpload>;
}
