import type { Locale } from '../api/participant';

export function resolveSystemLocale(navigator: Pick<Navigator, 'language' | 'languages'>): Locale {
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  return languages[0]?.toLowerCase().startsWith('ko') ? 'ko' : 'en';
}
