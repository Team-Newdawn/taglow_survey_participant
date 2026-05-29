import type { Locale, PublicQuestion } from '../../../../api/participant';
import { getDisplayOptions } from './questionOptions';

export type ImageTagOption = Readonly<{
  value: string;
  label: string;
}>;

const fallbackImageTagOptions: ImageTagOption[] = [{ value: 'discomfort', label: '불편' }];

export function getImageTagOptions(question: PublicQuestion, locale: Locale, fallbackLocale: Locale): ImageTagOption[] {
  const configuredTagTypes = readStringArray(question.config.tagTypes);
  if (configuredTagTypes.length > 0) {
    return configuredTagTypes.map((tagType) => ({ value: tagType, label: tagType }));
  }

  const configuredCategories = readStringArray(question.config.categories);
  if (configuredCategories.length > 0) {
    return configuredCategories.map((category) => ({ value: category, label: category }));
  }

  const options = getDisplayOptions(question, locale, fallbackLocale);
  return options.length > 0 ? options : fallbackImageTagOptions;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .map((item) => item.trim())
    : [];
}
