import { describe, expect, it, vi } from 'vitest';

import type { SurveyAsset } from '../model/asset';
import type { SubmissionCommand } from '../model/submission';
import { ParticipantApiError } from '../service/gateway/apiErrors';
import type { ParticipantApiGateway } from '../service/gateway/participantApiGateway';
import { ParticipantPayloadMapper } from '../service/mapper/participantPayloadMapper';
import { GatewayBackedParticipantApiController } from './gatewayBackedParticipantApiController';

describe('GatewayBackedParticipantApiController submission', () => {
  it('uses the transactional submit RPC when the gateway exposes it', async () => {
    const submitSurveyResponse = vi.fn(async () => ({
      responseId: 'response-1',
      submittedAt: '2026-05-31T00:00:00.000Z',
    }));
    const createResponse = vi.fn();
    const createAnswers = vi.fn();
    const controller = new GatewayBackedParticipantApiController(
      createGateway({
        submitSurveyResponse,
        createResponse,
        createAnswers,
      }),
      new ParticipantPayloadMapper(),
    );

    await expect(controller.submitSurvey(createSubmissionCommand())).resolves.toEqual({
      responseId: 'response-1',
      submittedAt: '2026-05-31T00:00:00.000Z',
    });

    expect(submitSurveyResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        response: expect.objectContaining({ survey_id: 'survey-1' }),
        answers: [expect.objectContaining({ response_id: null })],
      }),
    );
    expect(createResponse).not.toHaveBeenCalled();
    expect(createAnswers).not.toHaveBeenCalled();
  });

  it('preserves already-submitted failures from the transactional submit RPC', async () => {
    const controller = new GatewayBackedParticipantApiController(
      createGateway({
        submitSurveyResponse: vi.fn(async () => {
          throw new ParticipantApiError('ALREADY_SUBMITTED', 'Already submitted.');
        }),
      }),
      new ParticipantPayloadMapper(),
    );

    await expect(controller.submitSurvey(createSubmissionCommand())).rejects.toMatchObject({
      code: 'ALREADY_SUBMITTED',
    });
  });
});

describe('GatewayBackedParticipantApiController access', () => {
  it('uses the participant access RPC when the gateway exposes it', async () => {
    const fetchParticipantSurveyAccess = vi.fn(async () => ({
      status: 'already_submitted' as const,
      survey: {
        id: 'survey-1',
        status: 'published',
        title_ko: '테스트 설문',
        public_code: 'ABC123',
      },
      sections: [],
      questions: [],
      assets: [],
      session: { userId: 'user-1', email: 'student@example.com' },
      responseId: 'response-1',
    }));
    const fetchPublicSurveyBySlug = vi.fn();
    const checkDuplicateSubmission = vi.fn();
    const controller = new GatewayBackedParticipantApiController(
      createGateway({
        fetchParticipantSurveyAccess,
        fetchPublicSurveyBySlug,
        checkDuplicateSubmission,
      }),
      new ParticipantPayloadMapper(),
    );

    await expect(controller.checkAccess('ABC123')).resolves.toMatchObject({
      status: 'already_submitted',
      survey: { id: 'survey-1', publicCode: 'ABC123' },
      session: { userId: 'user-1', email: 'student@example.com' },
      submittedResponseId: 'response-1',
    });

    expect(fetchParticipantSurveyAccess).toHaveBeenCalledWith('ABC123');
    expect(fetchPublicSurveyBySlug).not.toHaveBeenCalled();
    expect(checkDuplicateSubmission).not.toHaveBeenCalled();
  });
});

describe('GatewayBackedParticipantApiController assets', () => {
  it('batches signed asset URL creation by storage bucket', async () => {
    const createSignedAssetUrls = vi.fn(async ({ bucket }: { bucket: string; paths: string[] }): Promise<Record<string, string>> => {
      if (bucket === 'survey-assets') {
        return {
          'a/one.png': 'https://example.com/one.png',
          'a/two.png': 'https://example.com/two.png',
        };
      }

      return { 'b/three.png': 'https://example.com/three.png' };
    });
    const controller = new GatewayBackedParticipantApiController(
      createGateway({ createSignedAssetUrls }),
      new ParticipantPayloadMapper(),
    );

    await expect(controller.getAssetUrls(createAssets())).resolves.toEqual({
      'asset-1': 'https://example.com/one.png',
      'asset-2': 'https://example.com/two.png',
      'asset-3': 'https://example.com/three.png',
    });

    expect(createSignedAssetUrls).toHaveBeenCalledWith({
      bucket: 'survey-assets',
      paths: ['a/one.png', 'a/two.png'],
    });
    expect(createSignedAssetUrls).toHaveBeenCalledWith({
      bucket: 'other-assets',
      paths: ['b/three.png'],
    });
  });
});

function createSubmissionCommand(): SubmissionCommand {
  return {
    surveyId: 'survey-1',
    participantUserId: 'user-1',
    participantEmail: 'student@example.com',
    locale: 'ko',
    profile: {},
    answers: [
      {
        surveyId: 'survey-1',
        sectionId: 'section-1',
        questionId: 'question-1',
        answerType: 'scale',
        scoreValue: 5,
      },
    ],
    rawPayload: { question1: 5 },
  };
}

function createAssets(): SurveyAsset[] {
  return [
    {
      id: 'asset-1',
      surveyId: 'survey-1',
      assetType: 'image',
      storageBucket: 'survey-assets',
      storagePath: 'a/one.png',
      metadata: {},
    },
    {
      id: 'asset-2',
      surveyId: 'survey-1',
      assetType: 'image',
      storageBucket: 'survey-assets',
      storagePath: 'a/two.png',
      metadata: {},
    },
    {
      id: 'asset-3',
      surveyId: 'survey-1',
      assetType: 'image',
      storageBucket: 'other-assets',
      storagePath: 'b/three.png',
      metadata: {},
    },
  ];
}

function createGateway(overrides: Partial<ParticipantApiGateway>): ParticipantApiGateway {
  return {
    async getSession() {
      return null;
    },
    async signInWithGoogle() {
      return undefined;
    },
    async signOut() {
      return undefined;
    },
    async fetchPublicSurveyBySlug() {
      throw new ParticipantApiError('SURVEY_NOT_FOUND', 'Survey was not found.');
    },
    async checkDuplicateSubmission() {
      return { alreadySubmitted: false };
    },
    async createResponse() {
      return { id: 'response-fallback' };
    },
    async createAnswers() {
      return [];
    },
    async createSignedAssetUrl() {
      return 'https://example.com/asset.jpg';
    },
    async uploadQuestionImage() {
      return {
        storage_bucket: 'survey-assets',
        storage_path: 'participant-uploads/upload-1.png',
        metadata: {},
      };
    },
    ...overrides,
  };
}
