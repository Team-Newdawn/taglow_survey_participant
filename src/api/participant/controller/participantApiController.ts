import type { SurveyAsset } from '../model/asset';
import type { ParticipantSession, SurveyAccessResult } from '../model/auth';
import type {
  DuplicateSubmissionCommand,
  DuplicateSubmissionResult,
  ParticipantQuestionImageUpload,
  ParticipantQuestionImageUploadCommand,
  SignInCommand,
} from '../model/commands';
import type { PublicSurvey } from '../model/publicSurvey';
import type { SubmissionCommand, SubmissionResult } from '../model/submission';

export interface ParticipantApiController {
  getCurrentSession(): Promise<ParticipantSession | null>;
  signInWithGoogle(command: SignInCommand): Promise<void>;
  signOut(): Promise<void>;

  getPublicSurvey(publicSlug: string): Promise<PublicSurvey>;
  checkAccess(publicSlug: string): Promise<SurveyAccessResult>;
  checkDuplicateSubmission(command: DuplicateSubmissionCommand): Promise<DuplicateSubmissionResult>;

  getAssetUrl(asset: SurveyAsset): Promise<string>;
  uploadQuestionImage(command: ParticipantQuestionImageUploadCommand): Promise<ParticipantQuestionImageUpload>;

  submitSurvey(command: SubmissionCommand): Promise<SubmissionResult>;
}
