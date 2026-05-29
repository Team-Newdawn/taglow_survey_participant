import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { ParticipantApiError, toParticipantApiError } from './apiErrors';
import type {
  ParticipantApiGateway,
  RawAnswer,
  RawAssetRow,
  RawCreateAnswerPayload,
  RawCreateResponsePayload,
  RawDuplicateSubmissionResult,
  RawParticipantQuestionImageUpload,
  RawPublicSurveyBundle,
  RawQuestionRow,
  RawResponse,
  RawSectionRow,
  RawSession,
  RawSurveyRow,
} from './participantApiGateway';

type RawEmbeddedSurveyRow = RawSurveyRow &
  Readonly<{
    survey_sections?: RawSectionRow[] | null;
    questions?: RawQuestionRow[] | null;
    survey_assets?: RawAssetRow[] | null;
  }>;

export class SupabaseParticipantApiGateway implements ParticipantApiGateway {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly participantUploadBucket = 'survey-assets',
  ) {}

  async getSession(): Promise<RawSession | null> {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) {
      throw toParticipantApiError(error, 'UNAUTHENTICATED');
    }

    const session = data.session;
    if (!session) {
      return null;
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
      },
      access_token: session.access_token,
    };
  }

  async signInWithGoogle(redirectTo: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });

    if (error) {
      throw toParticipantApiError(error, 'UNAUTHENTICATED');
    }
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw toParticipantApiError(error, 'UNAUTHENTICATED');
    }
  }

  async fetchPublicSurveyBySlug(publicSlug: string): Promise<RawPublicSurveyBundle> {
    const { data: survey, error: surveyError } = await this.supabase
      .from('surveys')
      .select(`
        id,
        title,
        description,
        status,
        public_slug,
        public_code,
        version_group_id,
        version_number,
        parent_survey_id,
        is_latest_version,
        settings,
        published_at,
        closed_at,
        survey_sections(
          id,
          survey_id,
          section_key,
          title_ko,
          title_en,
          description_ko,
          description_en,
          order_index,
          section_type,
          settings
        ),
        questions(
          id,
          survey_id,
          section_id,
          question_key,
          question_type,
          title_ko,
          title_en,
          description_ko,
          description_en,
          order_index,
          is_required,
          metric_type,
          topic_key,
          space_key,
          config,
          validation
        ),
        survey_assets(
          id,
          survey_id,
          section_id,
          question_id,
          asset_type,
          storage_bucket,
          storage_path,
          metadata
        )
      `)
      .or(`public_slug.eq.${publicSlug},public_code.eq.${publicSlug}`)
      .maybeSingle();

    if (surveyError) {
      throw toParticipantApiError(surveyError, 'SURVEY_NOT_FOUND');
    }

    if (!survey) {
      throw new ParticipantApiError('SURVEY_NOT_FOUND', 'Survey was not found.');
    }

    const embeddedSurvey = survey as RawEmbeddedSurveyRow;

    return {
      survey: embeddedSurvey,
      sections: embeddedSurvey.survey_sections ?? [],
      questions: embeddedSurvey.questions ?? [],
      assets: embeddedSurvey.survey_assets ?? [],
    };
  }

  async checkDuplicateSubmission(args: {
    surveyId: string;
    participantUserId: string;
  }): Promise<RawDuplicateSubmissionResult> {
    const { data, error } = await this.supabase
      .from('responses')
      .select('id,submitted_at')
      .eq('survey_id', args.surveyId)
      .eq('participant_user_id', args.participantUserId)
      .eq('status', 'submitted')
      .maybeSingle();

    if (error) {
      throw toParticipantApiError(error, 'UNKNOWN');
    }

    return {
      alreadySubmitted: Boolean(data),
      responseId: (data as { id?: string } | null)?.id,
      submittedAt: (data as { submitted_at?: string | null } | null)?.submitted_at ?? undefined,
    };
  }

  async createResponse(payload: RawCreateResponsePayload): Promise<RawResponse> {
    const { data, error } = await this.supabase
      .from('responses')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      throw toParticipantApiError(error, 'SUBMISSION_FAILED');
    }

    return data as RawResponse;
  }

  async createAnswers(payloads: RawCreateAnswerPayload[]): Promise<RawAnswer[]> {
    if (payloads.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase.from('answers').insert(payloads).select('*').returns<RawAnswer[]>();

    if (error) {
      throw toParticipantApiError(error, 'SUBMISSION_FAILED');
    }

    return data ?? [];
  }

  async createSignedAssetUrl(args: { bucket: string; path: string }): Promise<string> {
    const { data, error } = await this.supabase.storage.from(args.bucket).createSignedUrl(args.path, 60 * 60);

    if (error || !data?.signedUrl) {
      throw toParticipantApiError(error, 'ASSET_LOAD_FAILED');
    }

    return data.signedUrl;
  }

  async uploadQuestionImage(command: {
    surveyId: string;
    questionId: string;
    file: File;
  }): Promise<RawParticipantQuestionImageUpload> {
    if (!command.file.type.startsWith('image/')) {
      throw new ParticipantApiError('UPLOAD_FAILED', 'Only image files can be uploaded.');
    }

    const { data: userData, error: userError } = await this.supabase.auth.getUser();
    if (userError) {
      throw toParticipantApiError(userError, 'UNAUTHENTICATED');
    }

    const user = userData.user;
    if (!user) {
      throw new ParticipantApiError('UNAUTHENTICATED', 'Login is required to upload an image.');
    }

    const uploadId = crypto.randomUUID();
    const storagePath = buildParticipantUploadStoragePath({ uploadId, fileName: command.file.name });
    const uploadMetadata = {
      surveyId: command.surveyId,
      questionId: command.questionId,
      originalName: command.file.name,
      contentType: command.file.type,
      size: command.file.size,
    };
    const answerMetadata = {
      originalName: command.file.name,
      contentType: command.file.type,
      size: command.file.size,
    };
    const { error: uploadError } = await this.supabase.storage.from(this.participantUploadBucket).upload(storagePath, command.file, {
      cacheControl: '3600',
      contentType: command.file.type || undefined,
      metadata: uploadMetadata,
      upsert: false,
    });

    if (uploadError) {
      throw toParticipantApiError(uploadError, 'UPLOAD_FAILED');
    }

    const { data: signedUrlData, error: signedUrlError } = await this.supabase.storage
      .from(this.participantUploadBucket)
      .createSignedUrl(storagePath, 60 * 60);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw toParticipantApiError(signedUrlError, 'UPLOAD_FAILED');
    }

    return {
      storage_bucket: this.participantUploadBucket,
      storage_path: storagePath,
      signed_url: signedUrlData.signedUrl,
      metadata: answerMetadata,
    };
  }
}

export function createSupabaseParticipantApiGateway(args: {
  supabaseUrl: string;
  supabaseAnonKey: string;
}): SupabaseParticipantApiGateway {
  return new SupabaseParticipantApiGateway(
    createClient(args.supabaseUrl, args.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }),
  );
}

export function buildParticipantUploadStoragePath(args: { uploadId: string; fileName: string }): string {
  return `participant-uploads/${args.uploadId}${getFileExtension(args.fileName)}`;
}

function getFileExtension(fileName: string): string {
  const baseName = fileName.split(/[\\/]/).at(-1) ?? '';
  const dotIndex = baseName.lastIndexOf('.');
  const extension = dotIndex >= 0 ? baseName.slice(dotIndex + 1).toLowerCase() : '';

  return /^[a-z0-9]+$/.test(extension) ? `.${extension}` : '';
}
