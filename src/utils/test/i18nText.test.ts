import { describe, expect, it } from 'vitest';

import { readLocalizedText } from '../i18nText';

describe('readLocalizedText', () => {
  it('uses selected locale when available', () => {
    expect(readLocalizedText({ ko: '안녕하세요', en: 'Hello' }, 'en')).toBe('Hello');
  });

  it('falls back to Korean text when selected locale is missing', () => {
    expect(readLocalizedText({ ko: '안녕하세요' }, 'en')).toBe('안녕하세요');
  });
});
