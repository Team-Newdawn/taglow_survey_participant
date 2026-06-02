import type { SurveyAsset } from '../model/asset';
import type { ParticipantSession, SurveyAccessResult } from '../model/auth';
import type {
  DuplicateSubmissionCommand,
  DuplicateSubmissionResult,
  ParticipantQuestionImageUpload,
  ParticipantQuestionImageUploadCommand,
  ServiceFeedbackCommand,
  ServiceFeedbackResult,
  SignInCommand,
  SurveyAccessCommand,
} from '../model/commands';
import type { PublicSurvey } from '../model/publicSurvey';
import type { SubmissionCommand, SubmissionResult } from '../model/submission';
import type { SurveyDraft } from '../service/draft/draftStorage';

export type SurveyDraftIdentity = Readonly<{
  surveyId: string;
  participantUserId: string;
}>;

export interface ParticipantApiController {
  getCurrentSession(): Promise<ParticipantSession | null>;
  signInWithGoogle(command: SignInCommand): Promise<void>;
  signOut(): Promise<void>;

  getPublicSurvey(publicSlug: string): Promise<PublicSurvey>;
  checkAccess(command: SurveyAccessCommand): Promise<SurveyAccessResult>;
  checkDuplicateSubmission(command: DuplicateSubmissionCommand): Promise<DuplicateSubmissionResult>;

  getAssetUrl(asset: SurveyAsset): Promise<string>;
  getAssetUrls(assets: SurveyAsset[]): Promise<Record<string, string>>;
  uploadQuestionImage(command: ParticipantQuestionImageUploadCommand): Promise<ParticipantQuestionImageUpload>;

  submitSurvey(command: SubmissionCommand): Promise<SubmissionResult>;
  submitServiceFeedback(command: ServiceFeedbackCommand): Promise<ServiceFeedbackResult>;

  loadSurveyDraft(identity: SurveyDraftIdentity): Promise<SurveyDraft | null>;
  saveSurveyDraft(draft: SurveyDraft): Promise<void>;
  removeSurveyDraft(identity: SurveyDraftIdentity): Promise<void>;
}
