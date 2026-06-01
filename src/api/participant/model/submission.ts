import type { AnswerInput } from './answerDraft';
import type { Locale } from './publicSurvey';

export type RespondentProfile = Readonly<{
  gender?: string;
  semesterGroup?: string;
  department?: string;
  rc?: string;
  dormitory?: string;
  roomType?: string;
  dormExperience?: string;
  extra?: Record<string, unknown>;
}>;

export type SubmissionCommand = Readonly<{
  surveyId: string;
  participantUserId: string;
  participantDeviceId: string;
  participantEmail: string;
  locale: Locale;
  startedAt?: string;
  profile: RespondentProfile;
  answers: AnswerInput[];
  rawPayload: Record<string, unknown>;
}>;

export type SubmissionResult = Readonly<{
  responseId: string;
  submittedAt?: string;
}>;
