import { describe, expect, it } from 'vitest';

import { buildParticipantUploadStoragePath } from './supabaseParticipantApiGateway';

describe('buildParticipantUploadStoragePath', () => {
  it('stores participant uploads directly under the participant-uploads prefix', () => {
    const path = buildParticipantUploadStoragePath({ uploadId: 'upload-1', fileName: 'image.png' });

    expect(path).toBe('participant-uploads/upload-1.png');
    expect(path.split('/')).toHaveLength(2);
  });

  it('keeps only a safe lowercase extension from the original file name', () => {
    expect(buildParticipantUploadStoragePath({ uploadId: 'upload-2', fileName: '이미지.PNG' })).toBe(
      'participant-uploads/upload-2.png',
    );
    expect(buildParticipantUploadStoragePath({ uploadId: 'upload-3', fileName: 'image.bad/ext' })).toBe(
      'participant-uploads/upload-3',
    );
  });
});
