import { describe, expect, it, vi } from 'vitest';

import {
  isAllowedParticipantImageMimeType,
  mimeTypeMatches,
  PARTICIPANT_IMAGE_UPLOAD_TARGET_BYTES,
  prepareParticipantImageUploadFile,
} from '../participantImageUpload';

describe('participantImageUpload', () => {
  it('keeps the original file when browser image processing is unavailable', async () => {
    const file = new File(['small image'], 'upload.png', { type: 'image/png' });

    await expect(
      prepareParticipantImageUploadFile(file, {}, {
        canProcess: () => false,
        readSize: vi.fn(),
        render: vi.fn(),
      }),
    ).resolves.toBe(file);
  });

  it('resizes large images to 1600px and compresses toward the target size', async () => {
    const file = new File([new Uint8Array(4 * 1024 * 1024)], 'room.png', { type: 'image/png' });
    const render = vi
      .fn()
      .mockResolvedValueOnce(new Blob([new Uint8Array(PARTICIPANT_IMAGE_UPLOAD_TARGET_BYTES + 200_000)], { type: 'image/jpeg' }))
      .mockResolvedValueOnce(new Blob([new Uint8Array(PARTICIPANT_IMAGE_UPLOAD_TARGET_BYTES - 100_000)], { type: 'image/jpeg' }));

    const preparedFile = await prepareParticipantImageUploadFile(
      file,
      {},
      {
        canProcess: () => true,
        readSize: async () => ({ width: 3200, height: 2400 }),
        render,
      },
    );

    expect(render).toHaveBeenNthCalledWith(1, file, {
      width: 1600,
      height: 1200,
      mimeType: 'image/jpeg',
      quality: 0.82,
    });
    expect(render).toHaveBeenNthCalledWith(2, file, {
      width: 1600,
      height: 1200,
      mimeType: 'image/jpeg',
      quality: 0.74,
    });
    expect(preparedFile).not.toBe(file);
    expect(preparedFile.name).toBe('room.jpg');
    expect(preparedFile.type).toBe('image/jpeg');
    expect(preparedFile.size).toBeLessThan(PARTICIPANT_IMAGE_UPLOAD_TARGET_BYTES);
  });

  it('matches the same image mime types as the storage bucket allows', () => {
    expect(isAllowedParticipantImageMimeType('image/jpeg')).toBe(true);
    expect(isAllowedParticipantImageMimeType('image/png')).toBe(true);
    expect(isAllowedParticipantImageMimeType('image/webp')).toBe(true);
    expect(isAllowedParticipantImageMimeType('image/gif')).toBe(false);
    expect(mimeTypeMatches('image/*', 'image/webp')).toBe(true);
  });
});
