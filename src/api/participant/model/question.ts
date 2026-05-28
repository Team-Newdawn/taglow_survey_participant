import type { LocalizedText } from './publicSurvey';

export type QuestionType =
  | 'profile'
  | 'experience'
  | 'scale'
  | 'single_choice'
  | 'multi_select'
  | 'ranking'
  | 'text'
  | 'image_tag'
  | 'participant_image_tag'
  | 'attention_check';

export type MetricType = 'none' | 'satisfaction' | 'importance' | 'experience';

export type QuestionOption = Readonly<{
  value: string;
  label: LocalizedText;
  metadata?: Record<string, unknown>;
}>;

export type QuestionConfig = Readonly<{
  options?: QuestionOption[];
  assetId?: string;
  maxTags?: number;
  minSelections?: number;
  maxSelections?: number;
  expectedValue?: string | number;
  lowScoreThreshold?: number;
  [key: string]: unknown;
}>;

export type QuestionValidation = Readonly<{
  minLength?: number;
  maxLength?: number;
  minSelections?: number;
  maxSelections?: number;
  requiredTagText?: boolean;
  [key: string]: unknown;
}>;

export type PublicQuestion = Readonly<{
  id: string;
  surveyId: string;
  sectionId: string;
  questionKey: string;
  questionType: QuestionType;
  title: LocalizedText;
  description?: LocalizedText;
  orderIndex: number;
  isRequired: boolean;
  metricType: MetricType;
  topicKey?: string;
  spaceKey?: string;
  config: QuestionConfig;
  validation: QuestionValidation;
}>;
