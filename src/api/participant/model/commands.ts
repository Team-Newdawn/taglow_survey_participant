import type { SurveyAsset } from './asset';

export type SignInCommand = Readonly<{
  redirectTo: string;
}>;

export type DuplicateSubmissionCommand = Readonly<{
  surveyId: string;
  participantUserId: string;
}>;

export type DuplicateSubmissionResult = Readonly<{
  alreadySubmitted: boolean;
  responseId?: string;
  submittedAt?: string;
}>;

export type AssetUrlCommand = Readonly<{
  asset: SurveyAsset;
}>;

export type ParticipantQuestionImageUploadCommand = Readonly<{
  surveyId: string;
  questionId: string;
  file: File;
}>;

export type ParticipantQuestionImageUpload = Readonly<{
  storageBucket: string;
  storagePath: string;
  signedUrl?: string;
  metadata: Record<string, unknown>;
}>;
