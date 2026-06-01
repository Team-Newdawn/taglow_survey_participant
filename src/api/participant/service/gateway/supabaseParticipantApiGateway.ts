import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { ParticipantApiError, toParticipantApiError } from './apiErrors';
import type {
  ParticipantApiGateway,
  RawAnswer,
  RawAssetRow,
  RawCreateAnswerPayload,
  RawCreateResponsePayload,
  RawDuplicateSubmissionResult,
  RawParticipantSurveyAccessResult,
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
      options: {
        redirectTo,
        queryParams: {
          prompt: 'select_account',
        },
      },
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
        description_en,
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

  async fetchParticipantSurveyAccess(args: {
    publicSlug: string;
    participantDeviceId?: string;
  }): Promise<RawParticipantSurveyAccessResult> {
    const rpcParams = args.participantDeviceId
      ? { p_public_identifier: args.publicSlug, p_device_id: args.participantDeviceId }
      : { p_public_identifier: args.publicSlug };
    let data: unknown;
    let usedDeviceAwareRpc = Boolean(args.participantDeviceId);

    const response = await this.supabase.rpc('get_participant_survey_access', rpcParams);
    data = response.data;

    if (response.error) {
      if (args.participantDeviceId && isRpcSignatureMismatch(response.error)) {
        const fallbackResponse = await this.supabase.rpc('get_participant_survey_access', { p_public_identifier: args.publicSlug });
        data = fallbackResponse.data;
        usedDeviceAwareRpc = false;

        if (fallbackResponse.error) {
          throw toParticipantApiError(fallbackResponse.error, 'UNKNOWN');
        }
      } else {
        throw toParticipantApiError(response.error, 'UNKNOWN');
      }
    }

    const result = data as Partial<RawParticipantSurveyAccessResult> | null;
    const status = normalizeParticipantSurveyAccessStatus(result?.status);

    return {
      status,
      survey: result?.survey ?? null,
      sections: Array.isArray(result?.sections) ? result.sections : [],
      questions: Array.isArray(result?.questions) ? result.questions : [],
      assets: Array.isArray(result?.assets) ? result.assets : [],
      session: normalizeParticipantSurveyAccessSession(result?.session),
      responseId: typeof result?.responseId === 'string' ? result.responseId : undefined,
      submittedAt: typeof result?.submittedAt === 'string' ? result.submittedAt : undefined,
      deviceChecked: result?.deviceChecked === true || usedDeviceAwareRpc,
    };
  }

  async checkDuplicateSubmission(args: {
    surveyId: string;
    participantUserId: string;
    participantDeviceId?: string;
  }): Promise<RawDuplicateSubmissionResult> {
    const query = this.supabase
      .from('responses')
      .select('id,submitted_at')
      .eq('survey_id', args.surveyId)
      .eq('status', 'submitted');
    const { data, error } = await (args.participantDeviceId
      ? query.or(`participant_user_id.eq.${args.participantUserId},participant_device_id.eq.${args.participantDeviceId}`).limit(1)
      : query.eq('participant_user_id', args.participantUserId).limit(1));

    if (error) {
      throw toParticipantApiError(error, 'UNKNOWN');
    }
    const firstRow = Array.isArray(data) ? data[0] : data;

    return {
      alreadySubmitted: Boolean(firstRow),
      responseId: (firstRow as { id?: string } | null | undefined)?.id,
      submittedAt: (firstRow as { submitted_at?: string | null } | null | undefined)?.submitted_at ?? undefined,
    };
  }

  async createResponse(payload: RawCreateResponsePayload): Promise<RawResponse> {
    const { data, error } = await this.supabase
      .from('responses')
      .insert(payload)
      .select('id,submitted_at')
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

    const { error } = await this.supabase.from('answers').insert(payloads);

    if (error) {
      throw toParticipantApiError(error, 'SUBMISSION_FAILED');
    }

    return [];
  }

  async createSignedAssetUrl(args: { bucket: string; path: string }): Promise<string> {
    const { data, error } = await this.supabase.storage.from(args.bucket).createSignedUrl(args.path, 60 * 60);

    if (error || !data?.signedUrl) {
      throw toParticipantApiError(error, 'ASSET_LOAD_FAILED');
    }

    return data.signedUrl;
  }

  async createSignedAssetUrls(args: { bucket: string; paths: string[] }): Promise<Record<string, string>> {
    if (args.paths.length === 0) {
      return {};
    }

    const { data, error } = await this.supabase.storage.from(args.bucket).createSignedUrls(args.paths, 60 * 60);

    if (error || !data) {
      throw toParticipantApiError(error, 'ASSET_LOAD_FAILED');
    }

    return Object.fromEntries(
      data.flatMap((item) => (item.path && item.signedUrl && !item.error ? [[item.path, item.signedUrl] as const] : [])),
    );
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

function normalizeParticipantSurveyAccessStatus(
  status: unknown,
): RawParticipantSurveyAccessResult['status'] {
  if (
    status === 'allowed' ||
    status === 'unauthenticated' ||
    status === 'survey_not_found' ||
    status === 'survey_closed' ||
    status === 'already_submitted'
  ) {
    return status;
  }

  return 'survey_not_found';
}

function normalizeParticipantSurveyAccessSession(session: unknown): RawParticipantSurveyAccessResult['session'] {
  if (!session || typeof session !== 'object') {
    return undefined;
  }

  const record = session as Record<string, unknown>;
  const userId = record.userId;
  const email = record.email;

  return typeof userId === 'string' && typeof email === 'string' ? { userId, email } : undefined;
}

function isRpcSignatureMismatch(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const record = error as Record<string, unknown>;
  return (
    record.code === 'PGRST202' ||
    (typeof record.message === 'string' &&
      record.message.includes('get_participant_survey_access') &&
      record.message.includes('p_device_id'))
  );
}
