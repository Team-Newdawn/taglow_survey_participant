import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';

import { buildParticipantUploadStoragePath, SupabaseParticipantApiGateway } from './supabaseParticipantApiGateway';

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

describe('SupabaseParticipantApiGateway auth', () => {
  it('asks Google to show the account chooser on every sign-in attempt', async () => {
    const signInWithOAuth = vi.fn(async () => ({ error: null }));
    const gateway = new SupabaseParticipantApiGateway({
      auth: {
        signInWithOAuth,
      },
    } as unknown as SupabaseClient);

    await gateway.signInWithGoogle('https://example.com/survey/test/intro');

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'https://example.com/survey/test/intro',
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
  });
});
