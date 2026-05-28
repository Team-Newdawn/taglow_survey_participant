export type ParticipantApiErrorCode =
  | 'UNAUTHENTICATED'
  | 'NOT_HANDONG_EMAIL'
  | 'SURVEY_NOT_FOUND'
  | 'SURVEY_CLOSED'
  | 'ALREADY_SUBMITTED'
  | 'VALIDATION_FAILED'
  | 'SUBMISSION_FAILED'
  | 'ASSET_LOAD_FAILED'
  | 'UPLOAD_FAILED'
  | 'DRAFT_RESTORE_FAILED'
  | 'UNKNOWN';

export class ParticipantApiError extends Error {
  readonly code: ParticipantApiErrorCode;
  readonly cause?: unknown;

  constructor(code: ParticipantApiErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'ParticipantApiError';
    this.code = code;
    this.cause = cause;
  }
}

export function isParticipantApiError(error: unknown): error is ParticipantApiError {
  return error instanceof ParticipantApiError;
}

export function toParticipantApiError(error: unknown, fallbackCode: ParticipantApiErrorCode = 'UNKNOWN') {
  if (isParticipantApiError(error)) {
    return error;
  }

  const code = readErrorCode(error);
  const message = readErrorMessage(error) ?? 'Participant API request failed.';

  if (code === '23505') {
    return new ParticipantApiError('ALREADY_SUBMITTED', 'This participant already submitted this survey.', error);
  }

  if (code === 'PGRST116') {
    return new ParticipantApiError('SURVEY_NOT_FOUND', 'Survey was not found.', error);
  }

  if (code === '42501') {
    return new ParticipantApiError('NOT_HANDONG_EMAIL', 'The current user is not allowed to access this survey.', error);
  }

  return new ParticipantApiError(fallbackCode, message, error);
}

function readErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return undefined;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

function readErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error !== 'object' || error === null || !('message' in error)) {
    return undefined;
  }

  const message = (error as { message?: unknown }).message;
  return typeof message === 'string' ? message : undefined;
}
