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
import { ParticipantApiError, isParticipantApiError, toParticipantApiError } from '../service/gateway/apiErrors';
import type { ParticipantApiGateway } from '../service/gateway/participantApiGateway';
import { ParticipantPayloadMapper } from '../service/mapper/participantPayloadMapper';
import type { ParticipantApiController } from './participantApiController';

export class GatewayBackedParticipantApiController implements ParticipantApiController {
  constructor(
    private readonly gateway: ParticipantApiGateway,
    private readonly mapper: ParticipantPayloadMapper,
  ) {}

  async getCurrentSession(): Promise<ParticipantSession | null> {
    const raw = await this.gateway.getSession();
    if (!raw?.user.email) {
      return null;
    }

    return {
      userId: raw.user.id,
      email: raw.user.email,
    };
  }

  signInWithGoogle(command: SignInCommand): Promise<void> {
    return this.gateway.signInWithGoogle(command.redirectTo);
  }

  signOut(): Promise<void> {
    return this.gateway.signOut();
  }

  async getPublicSurvey(publicSlug: string): Promise<PublicSurvey> {
    const bundle = await this.gateway.fetchPublicSurveyBySlug(publicSlug);
    return this.mapper.toPublicSurvey(bundle);
  }

  async checkAccess(publicSlug: string): Promise<SurveyAccessResult> {
    let survey: PublicSurvey;

    try {
      survey = await this.getPublicSurvey(publicSlug);
    } catch (error) {
      if (isParticipantApiError(error) && error.code === 'SURVEY_NOT_FOUND') {
        return { status: 'survey_not_found' };
      }

      throw error;
    }

    if (survey.status !== 'published') {
      return { status: 'survey_closed', survey };
    }

    const session = await this.getCurrentSession();
    if (!session) {
      return { status: 'unauthenticated', survey };
    }

    const duplicate = await this.checkDuplicateSubmission({
      surveyId: survey.id,
      participantUserId: session.userId,
    });

    if (duplicate.alreadySubmitted) {
      return {
        status: 'already_submitted',
        survey,
        session,
        submittedResponseId: duplicate.responseId,
      };
    }

    return { status: 'allowed', survey, session };
  }

  async checkDuplicateSubmission(command: DuplicateSubmissionCommand): Promise<DuplicateSubmissionResult> {
    const raw = await this.gateway.checkDuplicateSubmission({
      surveyId: command.surveyId,
      participantUserId: command.participantUserId,
    });

    return {
      alreadySubmitted: raw.alreadySubmitted,
      responseId: raw.responseId,
      submittedAt: raw.submittedAt,
    };
  }

  getAssetUrl(asset: SurveyAsset): Promise<string> {
    return this.gateway.createSignedAssetUrl({
      bucket: asset.storageBucket,
      path: asset.storagePath,
    });
  }

  async uploadQuestionImage(command: ParticipantQuestionImageUploadCommand): Promise<ParticipantQuestionImageUpload> {
    const uploaded = await this.gateway.uploadQuestionImage(command);
    return {
      storageBucket: uploaded.storage_bucket,
      storagePath: uploaded.storage_path,
      signedUrl: uploaded.signed_url,
      metadata: uploaded.metadata,
    };
  }

  async submitSurvey(command: SubmissionCommand): Promise<SubmissionResult> {
    try {
      if (this.gateway.submitSurveyResponse) {
        const rawResult = await this.gateway.submitSurveyResponse(this.mapper.toSubmitSurveyPayload(command));
        return this.mapper.toSubmissionResult(rawResult);
      }

      const response = await this.gateway.createResponse(this.mapper.toCreateResponsePayload(command));
      const answerPayloads = command.answers.map((answer) => this.mapper.toCreateAnswerPayload(answer, response.id));
      await this.gateway.createAnswers(answerPayloads);

      return this.mapper.toSubmissionResult(response);
    } catch (error) {
      const apiError = toParticipantApiError(error, 'SUBMISSION_FAILED');

      if (apiError.code === 'ALREADY_SUBMITTED') {
        throw apiError;
      }

      throw new ParticipantApiError(apiError.code, apiError.message, error);
    }
  }
}
