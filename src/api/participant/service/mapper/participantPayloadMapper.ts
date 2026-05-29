import type { AnswerInput } from '../../model/answerDraft';
import type { SurveyAsset } from '../../model/asset';
import type {
  MetricType,
  PublicQuestion,
  QuestionConfig,
  QuestionOption,
  QuestionType,
  QuestionValidation,
} from '../../model/question';
import type { LocalizedText, PublicSurvey, SurveyStatus } from '../../model/publicSurvey';
import type { PublicSurveySection } from '../../model/section';
import type { SubmissionCommand, SubmissionResult } from '../../model/submission';
import type {
  RawAssetRow,
  RawCreateAnswerPayload,
  RawCreateResponsePayload,
  RawPublicSurveyBundle,
  RawQuestionRow,
  RawResponse,
  RawSectionRow,
  RawSubmitSurveyPayload,
  RawSubmitSurveyResult,
  RawSurveyRow,
} from '../gateway/participantApiGateway';

export class ParticipantPayloadMapper {
  toPublicSurvey(bundle: RawPublicSurveyBundle): PublicSurvey {
    const questionsBySectionId = groupQuestionsBySection(bundle.questions);
    const sections = bundle.sections
      .slice()
      .sort(byOrderIndex)
      .map((section) => this.toPublicSurveySection(section, questionsBySectionId.get(section.id) ?? []));

    return {
      id: bundle.survey.id,
      title: toLocalizedText(bundle.survey, 'title'),
      description: toOptionalLocalizedText(bundle.survey, 'description'),
      publicSlug: bundle.survey.public_slug ?? bundle.survey.public_code ?? '',
      publicCode: bundle.survey.public_code ?? undefined,
      status: normalizeSurveyStatus(bundle.survey.status),
      versionGroupId: bundle.survey.version_group_id ?? undefined,
      versionNumber: bundle.survey.version_number ?? undefined,
      parentSurveyId: bundle.survey.parent_survey_id ?? undefined,
      isLatestVersion: bundle.survey.is_latest_version ?? undefined,
      settings: bundle.survey.settings ?? {},
      sections,
      assets: bundle.assets.map(toSurveyAsset),
      publishedAt: bundle.survey.published_at ?? undefined,
      closedAt: bundle.survey.closed_at ?? undefined,
    };
  }

  toPublicSurveySection(row: RawSectionRow, questions: PublicQuestion[]): PublicSurveySection {
    return {
      id: row.id,
      surveyId: row.survey_id,
      sectionKey: row.section_key,
      title: toLocalizedText(row, 'title'),
      description: toOptionalLocalizedText(row, 'description'),
      orderIndex: row.order_index,
      sectionType: row.section_type ?? 'default',
      settings: row.settings ?? {},
      questions: questions.slice().sort(byOrderIndex),
    };
  }

  toPublicQuestion(row: RawQuestionRow): PublicQuestion {
    return {
      id: row.id,
      surveyId: row.survey_id,
      sectionId: row.section_id,
      questionKey: row.question_key,
      questionType: row.question_type as QuestionType,
      title: toLocalizedText(row, 'title'),
      description: toOptionalLocalizedText(row, 'description'),
      orderIndex: row.order_index,
      isRequired: row.is_required ?? false,
      metricType: normalizeMetricType(row.metric_type),
      topicKey: row.topic_key ?? undefined,
      spaceKey: row.space_key ?? undefined,
      config: normalizeQuestionConfig(parseRecord(row.config)),
      validation: parseRecord(row.validation) as QuestionValidation,
    };
  }

  toCreateResponsePayload(command: SubmissionCommand): RawCreateResponsePayload {
    return {
      survey_id: command.surveyId,
      participant_user_id: command.participantUserId,
      participant_email: command.participantEmail.toLowerCase(),
      status: 'submitted',
      locale: command.locale,
      gender: command.profile.gender ?? null,
      semester_group: command.profile.semesterGroup ?? null,
      department: command.profile.department ?? null,
      rc: command.profile.rc ?? null,
      dormitory: command.profile.dormitory ?? null,
      room_type: command.profile.roomType ?? null,
      dorm_experience: command.profile.dormExperience ?? null,
      profile_json: command.profile.extra ?? {},
      raw_payload: command.rawPayload,
      started_at: command.startedAt ?? null,
      submitted_at: new Date().toISOString(),
    };
  }

  toCreateAnswerPayload(input: AnswerInput, responseId: string): RawCreateAnswerPayload {
    return {
      survey_id: input.surveyId,
      response_id: responseId,
      section_id: input.sectionId,
      question_id: input.questionId,
      asset_id: input.assetId ?? null,
      answer_type: input.answerType,
      metric_type: normalizeMetricType(input.metricType),
      topic_key: input.topicKey ?? null,
      space_key: input.spaceKey ?? null,
      score_value: input.scoreValue ?? null,
      text_value: input.textValue ?? null,
      choice_value: input.choiceValue ?? null,
      x_ratio: input.tagPosition?.xRatio ?? null,
      y_ratio: input.tagPosition?.yRatio ?? null,
      tag_type: input.tagType ?? null,
      severity: input.severity ?? null,
      value_json: input.valueJson ?? {},
    };
  }

  toSubmitSurveyPayload(command: SubmissionCommand): RawSubmitSurveyPayload {
    return {
      response: this.toCreateResponsePayload(command),
      answers: command.answers.map((answer) => ({
        ...this.toCreateAnswerPayload(answer, ''),
        response_id: null,
      })),
      rawPayload: command.rawPayload,
    };
  }

  toSubmissionResult(raw: RawResponse | RawSubmitSurveyResult): SubmissionResult {
    if (isRawSubmitSurveyResult(raw)) {
      return {
        responseId: raw.responseId,
        submittedAt: raw.submittedAt,
      };
    }

    return {
      responseId: raw.id,
      submittedAt: raw.submitted_at ?? undefined,
    };
  }
}

function isRawSubmitSurveyResult(raw: RawResponse | RawSubmitSurveyResult): raw is RawSubmitSurveyResult {
  return typeof (raw as RawSubmitSurveyResult).responseId === 'string';
}

function groupQuestionsBySection(rows: RawQuestionRow[]): Map<string, PublicQuestion[]> {
  const mapper = new ParticipantPayloadMapper();
  const map = new Map<string, PublicQuestion[]>();

  for (const row of rows) {
    const current = map.get(row.section_id) ?? [];
    current.push(mapper.toPublicQuestion(row));
    map.set(row.section_id, current);
  }

  return map;
}

function toSurveyAsset(row: RawAssetRow): SurveyAsset {
  return {
    id: row.id,
    surveyId: row.survey_id,
    sectionId: row.section_id ?? undefined,
    questionId: row.question_id ?? undefined,
    assetType: row.asset_type,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    metadata: row.metadata ?? {},
  };
}

function toLocalizedText(row: object, key: 'title' | 'description'): LocalizedText {
  const record = row as Record<string, unknown>;
  const ko = readString(record[`${key}_ko`]) ?? readString(record[key]);
  const en = readString(record[`${key}_en`]);
  return {
    ...(ko ? { ko } : {}),
    ...(en ? { en } : {}),
  };
}

function toOptionalLocalizedText(row: object, key: 'title' | 'description'): LocalizedText | undefined {
  const value = toLocalizedText(row, key);
  return value.ko || value.en ? value : undefined;
}

function normalizeSurveyStatus(status: string): SurveyStatus {
  if (status === 'published' || status === 'closed' || status === 'archived') {
    return status;
  }

  return 'closed';
}

function normalizeMetricType(metricType: unknown): MetricType {
  if (metricType === 'satisfaction' || metricType === 'importance' || metricType === 'experience') {
    return metricType;
  }

  return 'none';
}

function normalizeQuestionConfig(config: Record<string, unknown>): QuestionConfig {
  const rawOptions = readArray(config.options) ?? readArray(config.choices) ?? readArray(config.items);
  const options = rawOptions?.map(normalizeQuestionOption).filter((option): option is QuestionOption => Boolean(option));

  if (!options) {
    return config as QuestionConfig;
  }

  return {
    ...config,
    options,
  } as QuestionConfig;
}

function normalizeQuestionOption(option: unknown): QuestionOption | null {
  if (typeof option === 'string') {
    return {
      value: option,
      label: { ko: option },
    };
  }

  const record = parseRecord(option);
  const value =
    readString(record.value) ??
    readString(record.id) ??
    readString(record.key) ??
    readString(record.code) ??
    readString(record.optionValue);

  if (!value) {
    return null;
  }

  return {
    value,
    label: normalizeLocalizedLabel(record, value),
    metadata: parseRecord(record.metadata),
  };
}

function normalizeLocalizedLabel(record: Record<string, unknown>, fallback: string): LocalizedText {
  const label = record.label;
  if (typeof label === 'string' && label.length > 0) {
    return { ko: label };
  }

  const labelRecord = parseRecord(label);
  const ko =
    readString(labelRecord.ko) ??
    readString(record.labelKo) ??
    readString(record.label_ko) ??
    readString(record.titleKo) ??
    readString(record.title_ko) ??
    readString(record.textKo) ??
    readString(record.text_ko) ??
    readString(record.nameKo) ??
    readString(record.name_ko) ??
    readString(record.title) ??
    readString(record.text) ??
    fallback;
  const en =
    readString(labelRecord.en) ??
    readString(record.labelEn) ??
    readString(record.label_en) ??
    readString(record.titleEn) ??
    readString(record.title_en) ??
    readString(record.textEn) ??
    readString(record.text_en) ??
    readString(record.nameEn) ??
    readString(record.name_en);

  return {
    ko,
    ...(en ? { en } : {}),
  };
}

function readArray(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? value : undefined;
}

function parseRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function byOrderIndex<T extends { orderIndex?: number; order_index?: number }>(a: T, b: T): number {
  return (a.orderIndex ?? a.order_index ?? 0) - (b.orderIndex ?? b.order_index ?? 0);
}
