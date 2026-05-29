import type {
  AnswerInput,
  ImageTagPoint,
  ParticipantImageTagPoint,
  ParticipantImageTagUpload,
  PublicQuestion,
  PublicSurvey,
  PublicSurveySection,
  RespondentProfile,
} from '../api/participant';
import { validateAttentionCheck } from '../api/participant/service/validation/attentionCheckValidator';
import { normalizeProfileRecord, resolveProfileFieldKey } from './profileFields';

export type NormalizedAnswerInput = Omit<AnswerInput, 'surveyId' | 'sectionId'>;

export function normalizeAnswerInput(question: PublicQuestion, value: unknown): NormalizedAnswerInput[] {
  if (!isAnsweredValue(question, value)) {
    return [];
  }

  const base = {
    questionId: question.id,
    answerType: question.questionType,
    metricType: question.metricType,
    topicKey: question.topicKey,
    spaceKey: question.spaceKey,
  };

  switch (question.questionType) {
    case 'profile':
      return [{ ...base, valueJson: readProfileAnswerRecord(question, value) }];
    case 'experience':
      return [{ ...base, valueJson: readRecord(value) }];
    case 'scale': {
      const record = readRecord(value);
      const scoreValue = readNumber(record.scoreValue);
      const lowScoreThreshold = readLowScoreThreshold(question);
      return [
        {
          ...base,
          scoreValue,
          valueJson:
            typeof scoreValue === 'number' && scoreValue <= lowScoreThreshold
              ? pickDefined({
                  low_score_reason: readString(record.lowScoreReason),
                  low_score_text: readString(record.lowScoreText),
                })
              : {},
        },
      ];
    }
    case 'single_choice':
      return [{ ...base, choiceValue: readString(value) }];
    case 'multi_select': {
      const record = readRecord(value);
      return [
        {
          ...base,
          valueJson: {
            selectedOptions: readStringArray(record.selectedOptions),
            otherText: readString(record.otherText) ?? null,
          },
        },
      ];
    }
    case 'ranking': {
      const record = readRecord(value);
      return [
        {
          ...base,
          valueJson: {
            rankedOptions: readRankingOptions(record.rankedOptions),
          },
        },
      ];
    }
    case 'text': {
      const record = readRecord(value);
      return [
        {
          ...base,
          textValue: readString(record.textValue),
          valueJson: pickDefined({
            topic_value: readString(record.topicValue),
            space_value: readString(record.spaceValue),
            opinion_type: readString(record.opinionType),
          }),
        },
      ];
    }
    case 'image_tag': {
      const points = readImageTagPoints(readRecord(value).points);
      return points.map((point) => ({
        ...base,
        assetId: point.assetId,
        tagPosition: {
          xRatio: point.xRatio,
          yRatio: point.yRatio,
        },
        tagType: point.tagType,
        severity: point.severity,
        textValue: point.textValue,
      }));
    }
    case 'participant_image_tag': {
      const record = readRecord(value);
      const image = readParticipantImageUpload(record.image);
      const points = readParticipantImageTagPoints(record.points, isTagTextRequired(question));

      if (!image) {
        return [];
      }

      return points.map((point, index) => ({
        ...base,
        tagPosition: {
          xRatio: point.xRatio,
          yRatio: point.yRatio,
        },
        tagType: point.tagType,
        severity: point.severity,
        textValue: point.textValue,
        valueJson: {
          participantImage: {
            storageBucket: image.storageBucket,
            storagePath: image.storagePath,
            ...(image.metadata ?? {}),
          },
          tagIndex: index + 1,
        },
      }));
    }
    case 'attention_check': {
      const choiceValue = readString(value);
      const scoreValue = readNumber(value);
      const tentative: AnswerInput = {
        surveyId: question.surveyId,
        sectionId: question.sectionId,
        ...base,
        choiceValue,
        scoreValue,
      };
      const result = validateAttentionCheck({ question, answer: tentative });
      return [
        {
          ...base,
          choiceValue,
          scoreValue,
          valueJson: {
            expectedValue: result.expectedValue,
            actualValue: result.actualValue,
            passed: result.passed,
          },
        },
      ];
    }
    default:
      return [];
  }
}

export function buildSubmissionAnswers(survey: PublicSurvey, values: Record<string, unknown>): AnswerInput[] {
  return survey.sections.flatMap((section) =>
    section.questions.flatMap((question) =>
      normalizeAnswerInput(question, values[question.id]).map((answer) => ({
        surveyId: survey.id,
        sectionId: section.id,
        ...answer,
      })),
    ),
  );
}

export function extractRespondentProfile(survey: PublicSurvey, values: Record<string, unknown>): RespondentProfile {
  const profile = survey.sections
    .flatMap((section) => section.questions)
    .filter((question) => question.questionType === 'profile')
    .reduce<Record<string, unknown>>(
      (merged, question) => ({
        ...merged,
        ...readProfileAnswerRecord(question, values[question.id]),
      }),
      {},
    );

  return {
    gender: readString(profile.gender),
    semesterGroup: readString(profile.semesterGroup),
    department: readString(profile.department),
    rc: readString(profile.rc),
    dormitory: readString(profile.dormitory),
    roomType: readString(profile.roomType),
    dormExperience: readString(profile.dormExperience),
    extra: pickDefined(profile),
  };
}

export function isAnsweredValue(question: PublicQuestion, value: unknown): boolean {
  switch (question.questionType) {
    case 'profile':
      return Object.values(readProfileAnswerRecord(question, value)).some((item) => readString(item));
    case 'experience':
      return Boolean(readString(readRecord(value).experienceStatus));
    case 'scale':
      return typeof readNumber(readRecord(value).scoreValue) === 'number';
    case 'single_choice':
    case 'attention_check':
      return Boolean(readString(value)) || typeof readNumber(value) === 'number';
    case 'multi_select':
      return readStringArray(readRecord(value).selectedOptions).length > 0;
    case 'ranking':
      return readRankingOptions(readRecord(value).rankedOptions).length > 0;
    case 'text':
      return (
        Boolean(readString(readRecord(value).textValue)) &&
        (!requiresTextOpinionType(question) || Boolean(readString(readRecord(value).opinionType)))
      );
    case 'image_tag':
      return readImageTagPoints(readRecord(value).points).length > 0;
    case 'participant_image_tag': {
      const record = readRecord(value);
      return (
        Boolean(readParticipantImageUpload(record.image)) &&
        readParticipantImageTagPoints(record.points, isTagTextRequired(question)).length > 0
      );
    }
    default:
      return false;
  }
}

export function findMissingRequiredQuestions(section: PublicSurveySection, values: Record<string, unknown>): PublicQuestion[] {
  const missingQuestions: PublicQuestion[] = [];
  const handledMultiSelectGroups = new Set<string>();

  for (const question of section.questions) {
    const multiSelectGroup = readMultiSelectDisplayGroup(question);

    if (multiSelectGroup) {
      if (handledMultiSelectGroups.has(multiSelectGroup)) {
        continue;
      }

      handledMultiSelectGroups.add(multiSelectGroup);

      const groupQuestions = section.questions.filter((item) => readMultiSelectDisplayGroup(item) === multiSelectGroup);
      if (isRequiredMultiSelectGroupMissing(groupQuestions, values)) {
        missingQuestions.push(groupQuestions[0]);
      }

      continue;
    }

    if (question.isRequired && !isAnsweredValue(question, values[question.id])) {
      missingQuestions.push(question);
    }
  }

  return missingQuestions;
}

function isRequiredMultiSelectGroupMissing(questions: PublicQuestion[], values: Record<string, unknown>): boolean {
  const isRequired = questions.some((question) => question.isRequired);

  if (!isRequired) {
    return false;
  }

  const selectedCount = questions.reduce((count, question) => {
    return count + readStringArray(readRecord(values[question.id]).selectedOptions).length;
  }, 0);
  const minSelections = readGroupSelectionCount(questions, ['minSelections', 'minSelect']) ?? 1;

  return selectedCount < minSelections;
}

function readMultiSelectDisplayGroup(question: PublicQuestion): string | undefined {
  if (question.questionType !== 'multi_select') {
    return undefined;
  }

  return readString(question.config.displayGroup);
}

function readGroupSelectionCount(questions: PublicQuestion[], keys: string[]): number | undefined {
  for (const question of questions) {
    for (const source of [question.validation, question.config]) {
      for (const key of keys) {
        const value = source[key];
        if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
          return value;
        }
      }
    }
  }

  return undefined;
}

function readRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function readProfileAnswerRecord(question: PublicQuestion, value: unknown): Record<string, unknown> {
  if (typeof value === 'string' || typeof value === 'number') {
    const fieldKey = resolveProfileFieldKey(question);
    return fieldKey ? { [fieldKey]: String(value) } : {};
  }

  return normalizeProfileRecord(readRecord(value));
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.length > 0) : [];
}

function readRankingOptions(value: unknown): Array<{ rank: number; optionValue: string }> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const record = readRecord(item);
      const rank = readNumber(record.rank);
      const optionValue = readString(record.optionValue);
      return rank && optionValue ? { rank, optionValue } : null;
    })
    .filter((item): item is { rank: number; optionValue: string } => Boolean(item));
}

function readImageTagPoints(value: unknown): ImageTagPoint[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
      const record = readRecord(item);
      const assetId = readString(record.assetId);
      const xRatio = readNumber(record.xRatio);
      const yRatio = readNumber(record.yRatio);
      const tagType = readString(record.tagType);
      const textValue = readString(record.textValue);

      if (!assetId || typeof xRatio !== 'number' || typeof yRatio !== 'number' || !tagType || !textValue) {
        return [];
      }

      const severity = readNumber(record.severity);
      const point: ImageTagPoint = {
        assetId,
        xRatio,
        yRatio,
        tagType,
        textValue,
      };

      return severity === undefined ? [point] : [{ ...point, severity }];
    });
}

function readParticipantImageUpload(value: unknown): ParticipantImageTagUpload | undefined {
  const record = readRecord(value);
  const storageBucket = readString(record.storageBucket);
  const storagePath = readString(record.storagePath);

  if (!storageBucket || !storagePath) {
    return undefined;
  }

  const signedUrl = readString(record.signedUrl);
  const metadata = readRecord(record.metadata);

  return {
    storageBucket,
    storagePath,
    ...(signedUrl ? { signedUrl } : {}),
    metadata,
  };
}

function readParticipantImageTagPoints(value: unknown, requireText: boolean): ParticipantImageTagPoint[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const record = readRecord(item);
    const id = readString(record.id);
    const xRatio = readNumber(record.xRatio);
    const yRatio = readNumber(record.yRatio);
    const tagType = readString(record.tagType);
    const textValue = readString(record.textValue);

    if (typeof xRatio !== 'number' || typeof yRatio !== 'number' || !tagType || (requireText && !textValue)) {
      return [];
    }

    const severity = readNumber(record.severity);
    const point: ParticipantImageTagPoint = {
      ...(id ? { id } : {}),
      xRatio,
      yRatio,
      tagType,
      ...(textValue ? { textValue } : {}),
    };

    return severity === undefined ? [point] : [{ ...point, severity }];
  });
}

function isTagTextRequired(question: PublicQuestion): boolean {
  return question.validation.requiredTagText === true || question.config.requireText === true;
}

function requiresTextOpinionType(question: PublicQuestion): boolean {
  if (question.questionType !== 'text') {
    return false;
  }

  if (question.config.requiresOpinionType === true || question.config.textMode === 'select_text') {
    return true;
  }

  return ['options', 'opinionTypes', 'textCategories', 'categoryOptions', 'opinionOptions'].some((key) => {
    const value = question.config[key];
    return Array.isArray(value) && value.length > 0;
  });
}

function readLowScoreThreshold(question: PublicQuestion): number {
  return typeof question.config.lowScoreThreshold === 'number' ? question.config.lowScoreThreshold : 2;
}

function pickDefined(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && value !== null && value !== ''));
}
