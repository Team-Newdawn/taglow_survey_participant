import type { PublicQuestion } from '../../../../api/participant';

export type QuestionRenderBlock =
  | Readonly<{
      type: 'question';
      question: PublicQuestion;
    }>
  | Readonly<{
      type: 'scale_group';
      id: string;
      groupTitle: string;
      questions: PublicQuestion[];
    }>
  | Readonly<{
      type: 'multi_select_group';
      id: string;
      groupTitle: string;
      questions: PublicQuestion[];
    }>;

export function buildQuestionRenderBlocks(questions: PublicQuestion[]): QuestionRenderBlock[] {
  const blocks: QuestionRenderBlock[] = [];
  let index = 0;

  while (index < questions.length) {
    const question = questions[index];
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
