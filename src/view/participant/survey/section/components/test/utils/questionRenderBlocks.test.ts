import { describe, expect, it } from 'vitest';

import { publishedSurveyFixture } from '../../../../../../../test/fixtures/publicSurveyFixture';
import type { PublicQuestion } from '../../../../../../../api/participant';
import { buildQuestionRenderBlocks } from '../../utils/questionRenderBlocks';

const scaleQuestion = publishedSurveyFixture.sections[1].questions[0];
const multiQuestion = publishedSurveyFixture.sections[1].questions[1];
const profileQuestion = publishedSurveyFixture.sections[0].questions[0];

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

  it('keeps the English group title when displayGroupEn is present', () => {
    const questions = [
      buildScaleQuestion('scale-1', 0, '침묵시간 만족도', 'Satisfaction with Silent Hours'),
      buildScaleQuestion('scale-2', 1, '침묵시간 만족도', 'Satisfaction with Silent Hours'),
    ];

    const blocks = buildQuestionRenderBlocks(questions);

    expect(blocks[0]).toMatchObject({
      type: 'scale_group',
      groupTitle: '침묵시간 만족도',
      groupTitleEn: 'Satisfaction with Silent Hours',
    });
  });

  it('uses the first English group title found in the grouped questions', () => {
    const questions = [
      buildScaleQuestion('scale-1', 0, '침묵시간 만족도'),
      buildScaleQuestion('scale-2', 1, '침묵시간 만족도', 'Satisfaction with Silent Hours'),
    ];

    const blocks = buildQuestionRenderBlocks(questions);

    expect(blocks[0]).toMatchObject({
      type: 'scale_group',
      groupTitleEn: 'Satisfaction with Silent Hours',
    });
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

  it('splits a composite profile question into individual profile field blocks', () => {
    const blocks = buildQuestionRenderBlocks([profileQuestion]);

    expect(blocks).toEqual([
      { type: 'profile_field', id: 'question-profile-profile-gender', question: profileQuestion, fieldKey: 'gender' },
      { type: 'profile_field', id: 'question-profile-profile-semesterGroup', question: profileQuestion, fieldKey: 'semesterGroup' },
      { type: 'profile_field', id: 'question-profile-profile-department', question: profileQuestion, fieldKey: 'department' },
      { type: 'profile_field', id: 'question-profile-profile-rc', question: profileQuestion, fieldKey: 'rc' },
      { type: 'profile_field', id: 'question-profile-profile-dormitory', question: profileQuestion, fieldKey: 'dormitory' },
      { type: 'profile_field', id: 'question-profile-profile-roomType', question: profileQuestion, fieldKey: 'roomType' },
      { type: 'profile_field', id: 'question-profile-profile-dormExperience', question: profileQuestion, fieldKey: 'dormExperience' },
    ]);
  });

  it('keeps a database profile question with its own field as a single block', () => {
    const studentNumberQuestion: PublicQuestion = {
      ...profileQuestion,
      id: 'question-student-number',
      questionKey: 'dorm_25_2_q185',
      title: { ko: '학번 (예. 22400001)' },
      config: { profileField: 'student_number', inputType: 'text', options: [] },
    };

    const blocks = buildQuestionRenderBlocks([studentNumberQuestion]);

    expect(blocks).toEqual([{ type: 'question', question: studentNumberQuestion }]);
  });

  it('does not repeat default profile fields for duplicate composite profile questions', () => {
    const duplicateProfileQuestion = {
      ...profileQuestion,
      id: 'question-profile-duplicate',
      orderIndex: 1,
    };

    const blocks = buildQuestionRenderBlocks([profileQuestion, duplicateProfileQuestion]);

    expect(blocks).toHaveLength(7);
    expect(blocks).toEqual(
      expect.arrayContaining([
        { type: 'profile_field', id: 'question-profile-profile-gender', question: profileQuestion, fieldKey: 'gender' },
        { type: 'profile_field', id: 'question-profile-profile-dormExperience', question: profileQuestion, fieldKey: 'dormExperience' },
      ]),
    );
    expect(blocks).not.toEqual(
      expect.arrayContaining([
        {
          type: 'profile_field',
          id: 'question-profile-duplicate-profile-gender',
          question: duplicateProfileQuestion,
          fieldKey: 'gender',
        },
      ]),
    );
  });

  it('only fills missing default profile fields after individual profile questions', () => {
    const genderQuestion = {
      ...profileQuestion,
      id: 'question-gender',
      questionKey: 'gender',
      orderIndex: 0,
    };
    const bundledProfileQuestion = {
      ...profileQuestion,
      id: 'question-profile-rest',
      orderIndex: 1,
    };

    const blocks = buildQuestionRenderBlocks([genderQuestion, bundledProfileQuestion]);

    expect(blocks).toEqual([
      { type: 'question', question: genderQuestion },
      { type: 'profile_field', id: 'question-profile-rest-profile-semesterGroup', question: bundledProfileQuestion, fieldKey: 'semesterGroup' },
      { type: 'profile_field', id: 'question-profile-rest-profile-department', question: bundledProfileQuestion, fieldKey: 'department' },
      { type: 'profile_field', id: 'question-profile-rest-profile-rc', question: bundledProfileQuestion, fieldKey: 'rc' },
      { type: 'profile_field', id: 'question-profile-rest-profile-dormitory', question: bundledProfileQuestion, fieldKey: 'dormitory' },
      { type: 'profile_field', id: 'question-profile-rest-profile-roomType', question: bundledProfileQuestion, fieldKey: 'roomType' },
      { type: 'profile_field', id: 'question-profile-rest-profile-dormExperience', question: bundledProfileQuestion, fieldKey: 'dormExperience' },
    ]);
  });

  it('treats titled profile rows as individual database-configured fields', () => {
    const genderQuestion = {
      ...profileQuestion,
      id: 'question-gender',
      questionKey: 'profile',
      title: { ko: '성별' },
      orderIndex: 0,
    };
    const semesterQuestion = {
      ...profileQuestion,
      id: 'question-semester',
      questionKey: 'profile',
      title: { ko: '학기' },
      orderIndex: 1,
    };

    expect(buildQuestionRenderBlocks([genderQuestion, semesterQuestion])).toEqual([
      { type: 'question', question: genderQuestion },
      { type: 'question', question: semesterQuestion },
    ]);
  });
});

function buildScaleQuestion(id: string, orderIndex: number, displayGroup: string, displayGroupEn?: string): PublicQuestion {
  return {
    ...scaleQuestion,
    id,
    questionKey: id,
    orderIndex,
    title: { ko: `${displayGroup} [(${orderIndex + 1}) 항목 ${orderIndex + 1}]` },
    config: {
      ...scaleQuestion.config,
      displayGroup,
      ...(displayGroupEn ? { displayGroupEn } : {}),
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
