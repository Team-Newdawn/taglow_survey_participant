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
import { buildDraftKey } from '../../../utils/draftKey';
import type { DraftStorage, SurveyDraft } from '../service/draft/draftStorage';
import { LocalStorageDraftStorage } from '../service/draft/localStorageDraftStorage';
import { ParticipantApiError, isParticipantApiError, toParticipantApiError } from '../service/gateway/apiErrors';
import type { ParticipantApiGateway } from '../service/gateway/participantApiGateway';
import { ParticipantPayloadMapper } from '../service/mapper/participantPayloadMapper';
import type { ParticipantApiController, SurveyDraftIdentity } from './participantApiController';

export class GatewayBackedParticipantApiController implements ParticipantApiController {
  constructor(
    private readonly gateway: ParticipantApiGateway,
    private readonly mapper: ParticipantPayloadMapper,
    private readonly draftStorage: DraftStorage = new LocalStorageDraftStorage(),
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

  async checkAccess(command: { publicSlug: string; participantDeviceId?: string }): Promise<SurveyAccessResult> {
    if (this.gateway.fetchParticipantSurveyAccess) {
      const raw = await this.gateway.fetchParticipantSurveyAccess(command);
      const survey = raw.survey
        ? this.mapper.toPublicSurvey({
            survey: raw.survey,
            sections: raw.sections ?? [],
            questions: raw.questions ?? [],
            assets: raw.assets ?? [],
          })
        : undefined;
      const session = raw.session;

      if (raw.status === 'allowed' && survey && session && command.participantDeviceId && !raw.deviceChecked) {
        const duplicate = await this.checkDuplicateSubmission({
          surveyId: survey.id,
          participantUserId: session.userId,
          participantDeviceId: command.participantDeviceId,
        });

        if (duplicate.alreadySubmitted) {
          return {
            status: 'already_submitted',
            survey,
            session,
            submittedResponseId: duplicate.responseId,
          };
        }
      }

      return {
        status: raw.status,
        survey,
        session,
        submittedResponseId: raw.responseId,
      };
    }

    let survey: PublicSurvey;

    try {
      survey = await this.getPublicSurvey(command.publicSlug);
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
      participantDeviceId: command.participantDeviceId,
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
      participantDeviceId: command.participantDeviceId,
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

  async getAssetUrls(assets: SurveyAsset[]): Promise<Record<string, string>> {
    if (assets.length === 0) {
      return {};
    }

    if (!this.gateway.createSignedAssetUrls) {
      const entries = await Promise.all(assets.map(async (asset) => [asset.id, await this.getAssetUrl(asset)] as const));
      return Object.fromEntries(entries);
    }

    const assetUrls: Record<string, string> = {};
    const assetsByBucket = groupAssetsByBucket(assets);

    for (const [bucket, bucketAssets] of assetsByBucket) {
      const paths = Array.from(new Set(bucketAssets.map((asset) => asset.storagePath)));
      const urlByPath = await this.gateway.createSignedAssetUrls({ bucket, paths });

      for (const asset of bucketAssets) {
        const signedUrl = urlByPath[asset.storagePath];
        if (signedUrl) {
          assetUrls[asset.id] = signedUrl;
        }
      }
    }

    return assetUrls;
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

  loadSurveyDraft(identity: SurveyDraftIdentity): Promise<SurveyDraft | null> {
    return this.draftStorage.loadDraft(buildDraftKey(identity));
  }

  saveSurveyDraft(draft: SurveyDraft): Promise<void> {
    return this.draftStorage.saveDraft(
      buildDraftKey({ surveyId: draft.surveyId, participantUserId: draft.participantUserId }),
      draft,
    );
  }

  removeSurveyDraft(identity: SurveyDraftIdentity): Promise<void> {
    return this.draftStorage.removeDraft(buildDraftKey(identity));
  }
}

function groupAssetsByBucket(assets: SurveyAsset[]): Map<string, SurveyAsset[]> {
  const groups = new Map<string, SurveyAsset[]>();

  for (const asset of assets) {
    const bucketAssets = groups.get(asset.storageBucket) ?? [];
    bucketAssets.push(asset);
    groups.set(asset.storageBucket, bucketAssets);
  }

  return groups;
}
