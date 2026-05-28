import { ParticipantApiError } from './apiErrors';
import type {
  ParticipantApiGateway,
  RawAnswer,
  RawCreateAnswerPayload,
  RawCreateResponsePayload,
  RawDuplicateSubmissionResult,
  RawParticipantQuestionImageUpload,
  RawPublicSurveyBundle,
  RawResponse,
  RawSession,
  RawSubmitSurveyPayload,
  RawSubmitSurveyResult,
} from './participantApiGateway';

export class HttpParticipantApiGateway implements ParticipantApiGateway {
  constructor(private readonly baseUrl: string) {}

  getSession(): Promise<RawSession | null> {
    throw new ParticipantApiError('UNKNOWN', 'HTTP participant session gateway is not implemented yet.');
  }

  signInWithGoogle(): Promise<void> {
    throw new ParticipantApiError('UNKNOWN', 'HTTP participant auth gateway is not implemented yet.');
  }

  signOut(): Promise<void> {
    throw new ParticipantApiError('UNKNOWN', 'HTTP participant auth gateway is not implemented yet.');
  }

  async fetchPublicSurveyBySlug(publicSlug: string): Promise<RawPublicSurveyBundle> {
    return this.request<RawPublicSurveyBundle>(`/api/surveys/${encodeURIComponent(publicSlug)}/public`);
  }

  async checkDuplicateSubmission(args: {
    surveyId: string;
    participantUserId: string;
  }): Promise<RawDuplicateSubmissionResult> {
    const params = new URLSearchParams({ participantUserId: args.participantUserId });
    return this.request<RawDuplicateSubmissionResult>(
      `/api/surveys/${encodeURIComponent(args.surveyId)}/submission-status?${params.toString()}`,
    );
  }

  async createResponse(payload: RawCreateResponsePayload): Promise<RawResponse> {
    return this.request<RawResponse>('/api/responses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async createAnswers(payloads: RawCreateAnswerPayload[]): Promise<RawAnswer[]> {
    return this.request<RawAnswer[]>('/api/answers/bulk', {
      method: 'POST',
      body: JSON.stringify({ answers: payloads }),
    });
  }

  async submitSurveyResponse(payload: RawSubmitSurveyPayload): Promise<RawSubmitSurveyResult> {
    return this.request<RawSubmitSurveyResult>(`/api/surveys/${String(payload.response.survey_id)}/responses`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async createSignedAssetUrl(args: { bucket: string; path: string }): Promise<string> {
    const params = new URLSearchParams(args);
    const result = await this.request<{ signedUrl: string }>(`/api/assets/signed-url?${params.toString()}`);
    return result.signedUrl;
  }

  uploadQuestionImage(): Promise<RawParticipantQuestionImageUpload> {
    throw new ParticipantApiError('UPLOAD_FAILED', 'HTTP participant image upload gateway is not implemented yet.');
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });

    if (!response.ok) {
      throw new ParticipantApiError('UNKNOWN', `HTTP participant request failed with ${response.status}.`);
    }

    return response.json() as Promise<T>;
  }
}
