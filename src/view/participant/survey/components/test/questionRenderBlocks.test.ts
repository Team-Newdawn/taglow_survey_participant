import { describe, expect, it } from 'vitest';

import { publishedSurveyFixture } from '../../../../../test/fixtures/publicSurveyFixture';
import type { PublicQuestion } from '../../../../../api/participant';
import { buildQuestionRenderBlocks } from '../questionRenderBlocks';

const scaleQuestion = publishedSurveyFixture.sections[1].questions[0];
const multiQuestion = publishedSurveyFixture.sections[1].questions[1];

describe('buildQuestionRenderBlocks', () => {
  it('groups consecutive scale questions that share the same displayGroup', () => {
    const questions = [
      buildScaleQuestion('scale-1', 0, '소등제도 만족도'),
      buildScaleQuestion('scale-2', 1, '소등제도 만족도'),
      multiQuestion,
    ];

    const blocks = buildQuestionRenderBlocks(questions);

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({
      type: 'scale_group',
      groupTitle: '소등제도 만족도',
      questions: [questions[0], questions[1]],
    });
    expect(blocks[1]).toEqual({ type: 'question', question: multiQuestion });
  });

  it('does not group a single scale question even when displayGroup exists', () => {
    const question = buildScaleQuestion('scale-1', 0, '소등제도 만족도');

    expect(buildQuestionRenderBlocks([question])).toEqual([{ type: 'question', question }]);
  });

  it('separates different display groups', () => {
    const questions = [
      buildScaleQuestion('scale-1', 0, '소등제도 만족도'),
      buildScaleQuestion('scale-2', 1, '소등제도 만족도'),
      buildScaleQuestion('scale-3', 2, '침묵시간 만족도'),
      buildScaleQuestion('scale-4', 3, '침묵시간 만족도'),
    ];

    const blocks = buildQuestionRenderBlocks(questions);

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ type: 'scale_group', groupTitle: '소등제도 만족도' });
    expect(blocks[1]).toMatchObject({ type: 'scale_group', groupTitle: '침묵시간 만족도' });
  });

  it('groups consecutive multi-select questions that share the same displayGroup', () => {
    const questions = [
      buildMultiSelectQuestion('multi-1', 0, '주로 사용하는 시간대'),
      buildMultiSelectQuestion('multi-2', 1, '주로 사용하는 시간대'),
      buildScaleQuestion('scale-1', 2, '만족도'),
    ];

    const blocks = buildQuestionRenderBlocks(questions);

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({
      type: 'multi_select_group',
      groupTitle: '주로 사용하는 시간대',
      questions: [questions[0], questions[1]],
    });
    expect(blocks[1]).toEqual({ type: 'question', question: questions[2] });
  });
});

function buildScaleQuestion(id: string, orderIndex: number, displayGroup: string): PublicQuestion {
  return {
    ...scaleQuestion,
    id,
    questionKey: id,
    orderIndex,
    title: { ko: `${displayGroup} [(${orderIndex + 1}) 항목 ${orderIndex + 1}]` },
    config: {
      ...scaleQuestion.config,
      displayGroup,
    },
  };
}

function buildMultiSelectQuestion(id: string, orderIndex: number, displayGroup: string): PublicQuestion {
  return {
    ...multiQuestion,
    id,
    questionKey: id,
    orderIndex,
    config: {
      ...multiQuestion.config,
      displayGroup,
    },
  };
}
