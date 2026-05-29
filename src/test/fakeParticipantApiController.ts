import type {
  DuplicateSubmissionCommand,
  DuplicateSubmissionResult,
  ParticipantApiController,
  ParticipantQuestionImageUpload,
  ParticipantQuestionImageUploadCommand,
  ParticipantSession,
  PublicSurvey,
  SignInCommand,
  SubmissionCommand,
  SubmissionResult,
  SurveyAccessResult,
  SurveyAsset,
} from '../api/participant';
import { publishedSurveyFixture } from './fixtures/publicSurveyFixture';

type FakeControllerOverrides = Partial<{
  session: ParticipantSession | null;
  survey: PublicSurvey;
  surveyError: Error;
  duplicate: DuplicateSubmissionResult;
  submitResult: SubmissionResult;
  uploadResult: ParticipantQuestionImageUpload;
  uploadQuestionImage: ParticipantApiController['uploadQuestionImage'];
}>;

export function createFakeParticipantApiController(overrides: FakeControllerOverrides = {}): ParticipantApiController {
  const session = Object.hasOwn(overrides, 'session') ? overrides.session ?? null : { userId: 'user-1', email: 'student@example.com' };
  const survey = overrides.survey ?? publishedSurveyFixture;
  const surveyError = overrides.surveyError;
  const duplicate = overrides.duplicate ?? { alreadySubmitted: false };
  const submitResult = overrides.submitResult ?? { responseId: 'response-1', submittedAt: '2026-05-28T00:00:00.000Z' };
  const uploadResult = overrides.uploadResult ?? {
    storageBucket: 'survey-assets',
    storagePath: 'participant-uploads/upload-1.png',
    signedUrl: 'https://example.com/uploaded.png',
    metadata: {},
  };
  const uploadQuestionImage =
    overrides.uploadQuestionImage ??
    (async (_command: ParticipantQuestionImageUploadCommand) => {
      return uploadResult;
    });

  return {
    async getCurrentSession() {
      return session;
    },
    async signInWithGoogle(_command: SignInCommand) {
      return undefined;
    },
    async signOut() {
      return undefined;
    },
    async getPublicSurvey() {
      if (surveyError) {
        throw surveyError;
      }

      return survey;
    },
    async checkAccess(): Promise<SurveyAccessResult> {
      if (!session) {
        return { status: 'unauthenticated', survey };
      }

      if (duplicate.alreadySubmitted) {
        return { status: 'already_submitted', survey, session, submittedResponseId: duplicate.responseId };
      }

      return { status: 'allowed', survey, session };
    },
    async checkDuplicateSubmission(_command: DuplicateSubmissionCommand) {
      return duplicate;
    },
    async getAssetUrl(_asset: SurveyAsset) {
      return 'https://example.com/asset.jpg';
    },
    uploadQuestionImage,
    async submitSurvey(_command: SubmissionCommand) {
      return submitResult;
    },
  };
}
