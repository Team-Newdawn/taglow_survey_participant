import type { Locale, PublicQuestion, QuestionOption } from '../../../../api/participant';
import { readOptionLabel } from '../../../../utils/i18nText';

export function getQuestionOptions(question: PublicQuestion): QuestionOption[] {
  return Array.isArray(question.config.options) ? question.config.options : [];
}

export function getDisplayOptions(question: PublicQuestion, locale: Locale, fallbackLocale: Locale) {
  return getQuestionOptions(question).map((option) => ({
    value: option.value,
    label: readOptionLabel(option, locale, fallbackLocale),
  }));
}

export function getDefaultOptions(questionType: PublicQuestion['questionType'], locale: Locale = 'ko') {
  switch (questionType) {
    case 'experience':
      return locale === 'en'
        ? [
            { value: 'used', label: 'Used it' },
            { value: 'heard_not_used', label: 'Heard of it but have not used it' },
            { value: 'never_heard', label: 'First time hearing about it' },
            { value: 'not_applicable', label: 'Not applicable' },
          ]
        : [
            { value: 'used', label: '이용해봤다' },
            { value: 'heard_not_used', label: '들어봤지만 이용하지 않았다' },
            { value: 'never_heard', label: '처음 들어봤다' },
            { value: 'not_applicable', label: '해당 없음' },
          ];
    default:
      return [];
  }
}
