const PARTICIPANT_DEVICE_ID_KEY = 'taglow-survey-device-id:v1';
const SUBMITTED_SURVEY_MARKER_PREFIX = 'taglow-survey-submitted-device:v1:';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

let memoryDeviceId: string | undefined;

export function getOrCreateParticipantDeviceId(storage: StorageLike | undefined = readLocalStorage()): string {
  const storedDeviceId = storage ? normalizeDeviceId(storage.getItem(PARTICIPANT_DEVICE_ID_KEY)) : undefined;

  if (storedDeviceId) {
    return storedDeviceId;
  }

  if (memoryDeviceId) {
    return memoryDeviceId;
  }

  const nextDeviceId = createDeviceId();
  memoryDeviceId = nextDeviceId;

  try {
    storage?.setItem(PARTICIPANT_DEVICE_ID_KEY, nextDeviceId);
  } catch {
    // Keep the in-memory id for the current tab when persistent storage is unavailable.
  }

  return nextDeviceId;
}

export function hasSurveySubmittedOnDevice(publicSlug: string, storage: StorageLike | undefined = readLocalStorage()): boolean {
  if (!publicSlug || !storage) {
    return false;
  }

  return storage.getItem(buildSubmittedSurveyMarkerKey(publicSlug)) === 'submitted';
}

export function markSurveySubmittedOnDevice(publicSlug: string, storage: StorageLike | undefined = readLocalStorage()): void {
  if (!publicSlug || !storage) {
    return;
  }

  try {
    storage.setItem(buildSubmittedSurveyMarkerKey(publicSlug), 'submitted');
  } catch {
    // The server-side device duplicate check remains the source of truth.
  }
}

export function buildSubmittedSurveyMarkerKey(publicSlug: string): string {
  return `${SUBMITTED_SURVEY_MARKER_PREFIX}${encodeURIComponent(publicSlug)}`;
}

function normalizeDeviceId(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed && /^[a-zA-Z0-9:_-]{8,128}$/.test(trimmed) ? trimmed : undefined;
}

function createDeviceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function readLocalStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}
