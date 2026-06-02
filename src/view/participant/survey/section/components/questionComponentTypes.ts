import type { Locale, PublicQuestion, SurveyAsset } from '../../../../../api/participant';

export type QuestionComponentProps<TValue = unknown> = {
  question: PublicQuestion;
  assets: SurveyAsset[];
  assetUrls?: Record<string, string>;
  locale: Locale;
  fallbackLocale: Locale;
  value: TValue;
  error?: string;
  number?: number;
  onChange: (value: TValue) => void;
};
