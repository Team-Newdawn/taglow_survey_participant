import type { PublicQuestion } from '../../../../../../api/participant';
import { profileFieldKeys, resolveProfileFieldId, resolveProfileFieldKey, type ProfileFieldKey } from '../../../../../../utils/profileFields';
import { getQuestionOptions } from './questionOptions';

export type QuestionRenderBlock =
  | Readonly<{
      type: 'question';
      question: PublicQuestion;
    }>
  | Readonly<{
      type: 'profile_field';
      id: string;
      question: PublicQuestion;
      fieldKey: ProfileFieldKey;
    }>
  | Readonly<{
      type: 'scale_group';
      id: string;
      groupTitle: string;
      groupTitleEn?: string;
      questions: PublicQuestion[];
    }>
  | Readonly<{
      type: 'multi_select_group';
      id: string;
      groupTitle: string;
      groupTitleEn?: string;
      questions: PublicQuestion[];
    }>;

export function buildQuestionRenderBlocks(questions: PublicQuestion[]): QuestionRenderBlock[] {
  const blocks: QuestionRenderBlock[] = [];
  const handledProfileFields = new Set<ProfileFieldKey>();
  let index = 0;

  while (index < questions.length) {
    const question = questions[index];
    const profileFieldKey = question.questionType === 'profile' ? resolveProfileFieldKey(question) : undefined;

    if (profileFieldKey) {
      if (handledProfileFields.has(profileFieldKey)) {
        index += 1;
        continue;
      }

      handledProfileFields.add(profileFieldKey);
    }

    if (isCompositeProfileQuestion(question)) {
      const unhandledProfileFields = profileFieldKeys.filter((fieldKey) => !handledProfileFields.has(fieldKey));

      blocks.push(
        ...unhandledProfileFields.map((fieldKey) => ({
          type: 'profile_field' as const,
          id: `${question.id}-profile-${fieldKey}`,
          question,
          fieldKey,
        })),
      );
      unhandledProfileFields.forEach((fieldKey) => handledProfileFields.add(fieldKey));
      index += 1;
      continue;
    }

    const scaleGroupTitle = readScaleDisplayGroup(question);

    if (scaleGroupTitle) {
      const groupQuestions: PublicQuestion[] = [];
      let cursor = index;

      while (cursor < questions.length && readScaleDisplayGroup(questions[cursor]) === scaleGroupTitle) {
        groupQuestions.push(questions[cursor]);
        cursor += 1;
      }

      if (groupQuestions.length >= 2) {
        blocks.push({
          type: 'scale_group',
          id: `${groupQuestions[0].id}-scale-group`,
          groupTitle: scaleGroupTitle,
          groupTitleEn: readFirstDisplayGroupEn(groupQuestions),
          questions: groupQuestions,
        });
        index = cursor;
        continue;
      }
    }

    const multiSelectGroupTitle = readMultiSelectDisplayGroup(question);

    if (multiSelectGroupTitle) {
      const groupQuestions: PublicQuestion[] = [];
      let cursor = index;

      while (cursor < questions.length && readMultiSelectDisplayGroup(questions[cursor]) === multiSelectGroupTitle) {
        groupQuestions.push(questions[cursor]);
        cursor += 1;
      }

      if (groupQuestions.length >= 2) {
        blocks.push({
          type: 'multi_select_group',
          id: `${groupQuestions[0].id}-multi-select-group`,
          groupTitle: multiSelectGroupTitle,
          groupTitleEn: readFirstDisplayGroupEn(groupQuestions),
          questions: groupQuestions,
        });
        index = cursor;
        continue;
      }
    }

    blocks.push({ type: 'question', question });
    index += 1;
  }

  return blocks;
}

export function getQuestionRenderBlockId(block: QuestionRenderBlock): string {
  return block.type === 'question' ? block.question.id : block.id;
}

function isCompositeProfileQuestion(question: PublicQuestion): boolean {
  if (question.questionType !== 'profile') {
    return false;
  }

  // A question that identifies its own field (canonical or raw) or supplies its own
  // options is a single DB-defined profile question, not a legacy composite to split.
  return !resolveProfileFieldId(question) && getQuestionOptions(question).length === 0;
}

function readScaleDisplayGroup(question: PublicQuestion): string | undefined {
  if (question.questionType !== 'scale') {
    return undefined;
  }

  const displayGroup = question.config.displayGroup;
  return typeof displayGroup === 'string' && displayGroup.trim().length > 0 ? displayGroup.trim() : undefined;
}

function readMultiSelectDisplayGroup(question: PublicQuestion): string | undefined {
  if (question.questionType !== 'multi_select') {
    return undefined;
  }

  const displayGroup = question.config.displayGroup;
  return typeof displayGroup === 'string' && displayGroup.trim().length > 0 ? displayGroup.trim() : undefined;
}

function readDisplayGroupEn(question: PublicQuestion): string | undefined {
  return (
    readConfigString(question.config.displayGroupEn) ??
    readConfigString(question.config.groupTitleEn) ??
    readConfigString(question.config.display_group_en)
  );
}

function readFirstDisplayGroupEn(questions: PublicQuestion[]): string | undefined {
  for (const question of questions) {
    const displayGroupEn = readDisplayGroupEn(question);
    if (displayGroupEn) {
      return displayGroupEn;
    }
  }

  return undefined;
}

function readConfigString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}
