import { describe, expect, it } from 'vitest';

import { buildSubmittedSurveyMarkerKey, getOrCreateParticipantDeviceId, hasSurveySubmittedOnDevice, markSurveySubmittedOnDevice } from '../participantDevice';

describe('participant device identity', () => {
  it('creates a device id once and reuses it from storage', () => {
    const storage = createStorage();

    const firstId = getOrCreateParticipantDeviceId(storage);
    const secondId = getOrCreateParticipantDeviceId(storage);

    expect(firstId).toMatch(/^[a-zA-Z0-9:_-]{8,128}$/);
    expect(secondId).toBe(firstId);
  });

  it('tracks submitted survey markers by public slug', () => {
    const storage = createStorage();

    markSurveySubmittedOnDevice('fixture-survey', storage);

    expect(hasSurveySubmittedOnDevice('fixture-survey', storage)).toBe(true);
    expect(hasSurveySubmittedOnDevice('other-survey', storage)).toBe(false);
    expect(buildSubmittedSurveyMarkerKey('fixture-survey')).toBe('taglow-survey-submitted-device:v1:fixture-survey');
  });
});

function createStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  const values = new Map<string, string>();

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}
