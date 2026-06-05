import type { ImageTagPoint, Locale, PublicQuestion, SurveyAsset } from '../../../../../../api/participant';
import { isAnsweredValue } from '../../../../../../utils/answerNormalizer';
import { profileFieldKeys, resolveProfileFieldId } from '../../../../../../utils/profileFields';
import { getDefaultOptions, getQuestionOptions } from './questionOptions';
import { getImageTagOptions } from '../imageTag/imageTagOptions';
import { readMultiSelectMatrix } from '../questions/MultiSelectQuestion';
import { readScaleLabels } from '../questions/ScaleQuestion';

type BuildDevAutofillValuesArgs = {
  questions: PublicQuestion[];
  assets: SurveyAsset[];
  locale: Locale;
  fallbackLocale: Locale;
  currentValues: Record<string, unknown>;
};

const profileDefaults: Record<(typeof profileFieldKeys)[number], string> = {
  gender: 'no_answer',
  semesterGroup: '3_4',
  department: 'computer_science',
  rc: 'torrey',
  dormitory: 'dorm_1',
  roomType: '4_person',
  dormExperience: '1_year',
};

export function buildDevAutofillValues(args: BuildDevAutofillValuesArgs): Record<string, unknown> {
  return args.questions.reduce<Record<string, unknown>>((autofillValues, question) => {
    if (isAnsweredValue(question, args.currentValues[question.id])) {
      return autofillValues;
    }

    const value = buildDevAnswerValue(question, args);
    return value === undefined ? autofillValues : { ...autofillValues, [question.id]: value };
  }, {});
}

function buildDevAnswerValue(question: PublicQuestion, args: BuildDevAutofillValuesArgs): unknown {
  switch (question.questionType) {
    case 'profile':
      return buildProfileValue(question);
    case 'experience':
      return { experienceStatus: getQuestionOptions(question)[0]?.value ?? getDefaultOptions('experience', args.locale)[0]?.value ?? 'used' };
    case 'scale':
      return { scoreValue: readScaleAutofillScore(question, args) };
    case 'single_choice':
      return readMultiSelectMatrix(question, args.locale, args.fallbackLocale)?.cells[0]?.value ?? getQuestionOptions(question)[0]?.value;
    case 'multi_select':
    case 'matrix_multi_select':
      return buildMultiSelectValue(question, args);
    case 'ranking':
      return buildRankingValue(question);
    case 'text':
      return buildTextValue(question);
    case 'image_tag':
      return buildImageTagValue(question, args);
    case 'participant_image_tag':
      return undefined;
    case 'attention_check':
      return question.config.expectedValue ?? getQuestionOptions(question)[0]?.value ?? 5;
    default:
      return undefined;
  }
}

function buildProfileValue(question: PublicQuestion): Record<string, string> {
  const fieldId = resolveProfileFieldId(question);
  const configuredOptionValue = getQuestionOptions(question)[0]?.value;

  if (fieldId) {
    return { [fieldId]: configuredOptionValue ?? profileDefaults[fieldId as keyof typeof profileDefaults] ?? 'dev-test' };
  }

  return profileDefaults;
}

function readScaleAutofillScore(question: PublicQuestion, args: BuildDevAutofillValuesArgs): number {
  const scaleMax =
    readPositiveInteger(question.config.scaleMax) ??
    readPositiveInteger(question.config.maxScore) ??
    readScaleLabels(question, args.locale, args.fallbackLocale)?.length ??
    5;
  const excludedValues = readNumberArray(question.config.excludedValues);

  for (let score = scaleMax; score >= 1; score -= 1) {
    if (!excludedValues.includes(score)) {
      return score;
    }
  }

  return Math.min(scaleMax, 5);
}

function buildMultiSelectValue(question: PublicQuestion, args: BuildDevAutofillValuesArgs): { selectedOptions: string[] } | undefined {
  const matrix = readMultiSelectMatrix(question, args.locale, args.fallbackLocale);
  const optionValues = matrix?.cells.map((cell) => cell.value) ?? getQuestionOptions(question).map((option) => option.value);
  const minimumCount = readPositiveInteger(question.validation.minSelections ?? question.validation.minSelect ?? question.config.minSelections ?? question.config.minSelect) ?? 1;
  const maximumCount = readPositiveInteger(question.validation.maxSelections ?? question.validation.maxSelect ?? question.config.maxSelections ?? question.config.maxSelect);
  const selectionCount = Math.min(optionValues.length, maximumCount ?? minimumCount);

  if (selectionCount < 1) {
    return undefined;
  }

  return { selectedOptions: optionValues.slice(0, selectionCount) };
}

function buildRankingValue(question: PublicQuestion): { rankedOptions: Array<{ rank: number; optionValue: string }> } | undefined {
  const options = getQuestionOptions(question);
  const maximumRank = readPositiveInteger(question.validation.maxSelections ?? question.config.maxSelections) ?? 3;
  const rankedOptions = options.slice(0, maximumRank).map((option, index) => ({
    rank: index + 1,
    optionValue: option.value,
  }));

  return rankedOptions.length > 0 ? { rankedOptions } : undefined;
}

function buildTextValue(question: PublicQuestion): { textValue: string; opinionType?: string } {
  return {
    textValue: '임시 답변입니다.',
    ...(requiresOpinionType(question) ? { opinionType: readFirstTextOptionValue(question) ?? 'other' } : {}),
  };
}

function buildImageTagValue(question: PublicQuestion, args: BuildDevAutofillValuesArgs): { points: ImageTagPoint[] } | undefined {
  const asset =
    args.assets.find((item) => item.id === question.config.assetId) ??
    args.assets.find((item) => item.questionId === question.id || item.sectionId === question.sectionId);

  if (!asset) {
    return undefined;
  }

  return {
    points: [
      {
        assetId: asset.id,
        xRatio: 0.5,
        yRatio: 0.5,
        tagType: getImageTagOptions(question, args.locale, args.fallbackLocale)[0]?.value ?? 'discomfort',
        severity: 2,
        textValue: '임시 위치 메모입니다.',
      },
    ],
  };
}

function requiresOpinionType(question: PublicQuestion): boolean {
  return (
    question.config.requiresOpinionType === true ||
    question.config.textMode === 'select_text' ||
    ['options', 'opinionTypes', 'textCategories', 'categoryOptions', 'opinionOptions'].some((key) => Array.isArray(question.config[key]))
  );
}

function readFirstTextOptionValue(question: PublicQuestion): string | undefined {
  const configuredOptions = [
    question.config.opinionTypes,
    question.config.textCategories,
    question.config.categoryOptions,
    question.config.opinionOptions,
    question.config.options,
  ];

  for (const options of configuredOptions) {
    const firstValue = readFirstOptionValue(options);
    if (firstValue) {
      return firstValue;
    }
  }

  return undefined;
}

function readFirstOptionValue(value: unknown): string | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  for (const item of value) {
    if (typeof item === 'string' && item.trim().length > 0) {
      return item.trim();
    }

    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      continue;
    }

    const record = item as Record<string, unknown>;
    const optionValue = readString(record.value) ?? readString(record.id) ?? readString(record.key);
    if (optionValue) {
      return optionValue;
    }
  }

  return undefined;
}

function readPositiveInteger(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  }

  return undefined;
}

function readNumberArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value.flatMap((item) => {
        const numberValue = typeof item === 'number' ? item : typeof item === 'string' ? Number(item.trim()) : NaN;
        return Number.isFinite(numberValue) ? [numberValue] : [];
      })
    : [];
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}
