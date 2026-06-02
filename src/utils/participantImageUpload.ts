export const PARTICIPANT_IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const PARTICIPANT_IMAGE_UPLOAD_TARGET_BYTES = 1 * 1024 * 1024;
export const PARTICIPANT_IMAGE_UPLOAD_MAX_DIMENSION = 1600;
export const PARTICIPANT_IMAGE_UPLOAD_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

type ParticipantImageUploadMimeType = (typeof PARTICIPANT_IMAGE_UPLOAD_MIME_TYPES)[number];

type ImageProcessingOptions = {
  maxDimension?: number;
  targetBytes?: number;
  acceptedMimeTypes?: string[];
};

type ImageSize = {
  width: number;
  height: number;
};

type RenderImageOptions = ImageSize & {
  mimeType: ParticipantImageUploadMimeType;
  quality: number;
};

type ImageProcessingDeps = {
  canProcess: () => boolean;
  readSize: (file: File) => Promise<ImageSize>;
  render: (file: File, options: RenderImageOptions) => Promise<Blob | null>;
};

const compressionQualities = [0.82, 0.74, 0.66, 0.58, 0.5, 0.42];

export async function prepareParticipantImageUploadFile(
  file: File,
  options: ImageProcessingOptions = {},
  deps: ImageProcessingDeps = browserImageProcessingDeps,
): Promise<File> {
  if (!deps.canProcess()) {
    return file;
  }

  const imageSize = await deps.readSize(file).catch(() => null);
  if (!imageSize || imageSize.width <= 0 || imageSize.height <= 0) {
    return file;
  }

  const maxDimension = options.maxDimension ?? PARTICIPANT_IMAGE_UPLOAD_MAX_DIMENSION;
  const targetBytes = options.targetBytes ?? PARTICIPANT_IMAGE_UPLOAD_TARGET_BYTES;
  const nextSize = fitImageSize(imageSize, maxDimension);
  const needsResize = nextSize.width !== imageSize.width || nextSize.height !== imageSize.height;
  const acceptedMimeTypes = options.acceptedMimeTypes?.length ? options.acceptedMimeTypes : [...PARTICIPANT_IMAGE_UPLOAD_MIME_TYPES];
  const outputMimeType = chooseOutputMimeType(file.type, acceptedMimeTypes);

  if (!needsResize && file.size <= targetBytes && outputMimeType === file.type) {
    return file;
  }

  let bestBlob: Blob | null = null;

  for (const quality of compressionQualities) {
    const blob = await deps.render(file, { ...nextSize, mimeType: outputMimeType, quality }).catch(() => null);
    if (!blob) {
      continue;
    }

    bestBlob = blob;
    if (blob.size <= targetBytes) {
      break;
    }
  }

  if (!bestBlob) {
    return file;
  }

  if (!needsResize && bestBlob.size >= file.size) {
    return file;
  }

  return new File([bestBlob], replaceImageExtension(file.name, outputMimeType), {
    type: outputMimeType,
    lastModified: Date.now(),
  });
}

export function isAllowedParticipantImageMimeType(mimeType: string): boolean {
  return PARTICIPANT_IMAGE_UPLOAD_MIME_TYPES.some((accepted) => accepted === mimeType);
}

export function mimeTypeMatches(accepted: string, actual: string): boolean {
  if (!accepted || accepted === '*/*') {
    return true;
  }

  if (accepted.endsWith('/*')) {
    return actual.startsWith(accepted.slice(0, -1));
  }

  return accepted === actual;
}

function fitImageSize(size: ImageSize, maxDimension: number): ImageSize {
  const longestSide = Math.max(size.width, size.height);
  if (longestSide <= maxDimension) {
    return size;
  }

  const ratio = maxDimension / longestSide;
  return {
    width: Math.max(1, Math.round(size.width * ratio)),
    height: Math.max(1, Math.round(size.height * ratio)),
  };
}

function chooseOutputMimeType(sourceMimeType: string, acceptedMimeTypes: string[]): ParticipantImageUploadMimeType {
  if (sourceMimeType === 'image/webp' && acceptsMimeType(acceptedMimeTypes, 'image/webp')) {
    return 'image/webp';
  }

  if (acceptsMimeType(acceptedMimeTypes, 'image/jpeg')) {
    return 'image/jpeg';
  }

  if (acceptsMimeType(acceptedMimeTypes, 'image/webp')) {
    return 'image/webp';
  }

  return 'image/png';
}

function acceptsMimeType(acceptedMimeTypes: string[], mimeType: ParticipantImageUploadMimeType): boolean {
  return acceptedMimeTypes.some((accepted) => mimeTypeMatches(accepted.trim(), mimeType));
}

function replaceImageExtension(fileName: string, mimeType: ParticipantImageUploadMimeType): string {
  const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const baseName = fileName.replace(/\.[a-z0-9]+$/i, '');
  return `${baseName || 'upload'}.${extension}`;
}

const browserImageProcessingDeps: ImageProcessingDeps = {
  canProcess: () =>
    typeof document !== 'undefined' &&
    typeof Image !== 'undefined' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    typeof HTMLCanvasElement.prototype.toBlob === 'function' &&
    typeof URL !== 'undefined' &&
    typeof URL.createObjectURL === 'function' &&
    typeof URL.revokeObjectURL === 'function',
  async readSize(file) {
    const image = await loadImage(file);
    return {
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
    };
  },
  async render(file, options) {
    const image = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = options.width;
    canvas.height = options.height;

    const context = canvas.getContext('2d');
    if (!context || typeof canvas.toBlob !== 'function') {
      return null;
    }

    context.drawImage(image, 0, 0, options.width, options.height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), options.mimeType, options.quality);
    });
  },
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    const timeoutId = window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Image loading timed out.'));
    }, 15_000);

    image.onload = () => {
      window.clearTimeout(timeoutId);
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      window.clearTimeout(timeoutId);
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not load image.'));
    };
    image.src = objectUrl;
  });
}
