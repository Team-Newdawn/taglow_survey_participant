import { describe, expect, it } from 'vitest';

import { buildSubmissionRawPayloadMetadata } from '../submissionMetadata';

describe('buildSubmissionRawPayloadMetadata', () => {
  it('keeps response raw_payload small by storing submission metadata only', () => {
    expect(buildSubmissionRawPayloadMetadata({ answerCount: 42, imageTagCount: 3 })).toEqual({
      source: 'participant_web',
      answerCount: 42,
      imageTagCount: 3,
    });
  });
});
