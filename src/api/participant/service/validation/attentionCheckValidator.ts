import type { AnswerInput } from '../../model/answerDraft';
import type { PublicQuestion } from '../../model/question';

export type AttentionCheckValidationResult = Readonly<{
  passed: boolean;
  expectedValue?: string | number;
  actualValue?: string | number;
}>;

export function validateAttentionCheck(args: {
  question: PublicQuestion;
  answer: AnswerInput;
}): AttentionCheckValidationResult {
  const expectedValue = args.question.config.expectedValue;
  const actualValue = args.answer.choiceValue ?? args.answer.scoreValue;

  return {
    expectedValue,
    actualValue,
    passed: expectedValue === undefined || normalizeComparableValue(actualValue) === normalizeComparableValue(expectedValue),
  };
}

function normalizeComparableValue(value: string | number | undefined): string | number | undefined {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : trimmed;
}
