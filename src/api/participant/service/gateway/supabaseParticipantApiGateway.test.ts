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

describe('SupabaseParticipantApiGateway public survey', () => {
  it('fetches the nullable English survey description in the public bundle', async () => {
    const maybeSingle = vi.fn(async () => ({
      data: {
        id: 'survey-1',
        title: '생활관 만족도 조사',
        description: '한국어 설문 설명',
        description_en: 'English survey description',
        status: 'published',
        public_slug: 'fixture-survey',
        survey_sections: [],
        questions: [],
        survey_assets: [],
      },
      error: null,
    }));
    const or = vi.fn(() => ({ maybeSingle }));
    let selectedColumns = '';
    const select = vi.fn((columns: string) => {
      selectedColumns = columns;
      return { or };
    });
    const from = vi.fn(() => ({ select }));
    const gateway = new SupabaseParticipantApiGateway({ from } as unknown as SupabaseClient);

    await expect(gateway.fetchPublicSurveyBySlug('fixture-survey')).resolves.toMatchObject({
      survey: {
        description_en: 'English survey description',
      },
    });

    expect(from).toHaveBeenCalledWith('surveys');
    expect(select).toHaveBeenCalledTimes(1);
    expect(selectedColumns).toContain('description_en');
  });
});

describe('SupabaseParticipantApiGateway submission', () => {
  it('does not expose the transactional RPC before the production function is deployed', () => {
    const gateway = new SupabaseParticipantApiGateway({} as unknown as SupabaseClient);

    expect('submitSurveyResponse' in gateway).toBe(false);
  });

  it('does not ask Supabase to return inserted answer rows on the fallback path', async () => {
    const select = vi.fn();
    const insert = vi.fn(async () => ({ error: null, select }));
    const from = vi.fn(() => ({ insert }));
    const gateway = new SupabaseParticipantApiGateway({ from } as unknown as SupabaseClient);

    await expect(gateway.createAnswers([{ survey_id: 'survey-1', answer_type: 'scale' }])).resolves.toEqual([]);

    expect(from).toHaveBeenCalledWith('answers');
    expect(insert).toHaveBeenCalledWith([{ survey_id: 'survey-1', answer_type: 'scale' }]);
    expect(select).not.toHaveBeenCalled();
  });
});

describe('SupabaseParticipantApiGateway access', () => {
  it('checks participant survey access through the bundle RPC', async () => {
    const rpc = vi.fn(async () => ({
      data: {
        status: 'allowed',
        survey: { id: 'survey-1', status: 'published' },
        sections: [{ id: 'section-1', survey_id: 'survey-1', section_key: 'intro', order_index: 0 }],
        questions: [],
        assets: [],
        session: { userId: 'user-1', email: 'student@example.com' },
      },
      error: null,
    }));
    const gateway = new SupabaseParticipantApiGateway({ rpc } as unknown as SupabaseClient);

    await expect(gateway.fetchParticipantSurveyAccess('ABC123')).resolves.toMatchObject({
      status: 'allowed',
      survey: { id: 'survey-1' },
      sections: [{ id: 'section-1' }],
      session: { userId: 'user-1', email: 'student@example.com' },
    });
    expect(rpc).toHaveBeenCalledWith('get_participant_survey_access', { p_public_identifier: 'ABC123' });
  });
});

describe('SupabaseParticipantApiGateway assets', () => {
  it('creates signed URLs for multiple asset paths in one storage call', async () => {
    const createSignedUrls = vi.fn(async () => ({
      data: [
        { path: 'floor/one.png', signedUrl: 'https://example.com/one.png', error: null },
        { path: 'floor/two.png', signedUrl: 'https://example.com/two.png', error: null },
      ],
      error: null,
    }));
    const from = vi.fn(() => ({ createSignedUrls }));
    const gateway = new SupabaseParticipantApiGateway({
      storage: { from },
    } as unknown as SupabaseClient);

    await expect(
      gateway.createSignedAssetUrls({
        bucket: 'survey-assets',
        paths: ['floor/one.png', 'floor/two.png'],
      }),
    ).resolves.toEqual({
      'floor/one.png': 'https://example.com/one.png',
      'floor/two.png': 'https://example.com/two.png',
    });

    expect(from).toHaveBeenCalledWith('survey-assets');
    expect(createSignedUrls).toHaveBeenCalledWith(['floor/one.png', 'floor/two.png'], 60 * 60);
  });
});
