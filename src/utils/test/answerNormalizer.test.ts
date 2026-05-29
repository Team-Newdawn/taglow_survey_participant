import { describe, expect, it } from 'vitest';

import { publishedSurveyFixture } from '../../test/fixtures/publicSurveyFixture';
import { buildSubmissionAnswers, extractRespondentProfile, findMissingRequiredQuestions } from '../answerNormalizer';

describe('buildSubmissionAnswers', () => {
  it('normalizes scale and multi-select form values into submission answers', () => {
    const answers = buildSubmissionAnswers(publishedSurveyFixture, {
      'question-scale': {
        scoreValue: 2,
        lowScoreReason: 'low_quality',
        lowScoreText: '자주 고장납니다.',
      },
      'question-multi': {
        selectedOptions: ['cleanliness', 'quantity'],
      },
    });

    expect(answers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          surveyId: 'survey-1',
          sectionId: 'section-facility',
          questionId: 'question-scale',
          answerType: 'scale',
          scoreValue: 2,
          topicKey: 'laundry',
          valueJson: {
            low_score_reason: 'low_quality',
            low_score_text: '자주 고장납니다.',
          },
        }),
        expect.objectContaining({
          questionId: 'question-multi',
          answerType: 'multi_select',
          valueJson: {
            selectedOptions: ['cleanliness', 'quantity'],
            otherText: null,
          },
        }),
      ]),
    );
  });

  it('drops stale low-score details when a scale score is above the low-score threshold', () => {
    const answers = buildSubmissionAnswers(publishedSurveyFixture, {
      'question-scale': {
        scoreValue: 3,
        lowScoreReason: 'low_quality',
        lowScoreText: '이전 낮은 점수 이유입니다.',
      },
    });

    expect(answers).toEqual([
      expect.objectContaining({
        questionId: 'question-scale',
        answerType: 'scale',
        scoreValue: 3,
        valueJson: {},
      }),
    ]);
  });

  it('aggregates individual profile question answers into respondent profile columns', () => {
    const profileSurvey = {
      ...publishedSurveyFixture,
      sections: [
        {
          ...publishedSurveyFixture.sections[0],
          questions: [
            {
              ...publishedSurveyFixture.sections[0].questions[0],
              id: 'question-gender',
              questionKey: 'gender',
              title: { ko: '성별' },
            },
            {
              ...publishedSurveyFixture.sections[0].questions[0],
              id: 'question-semester',
              questionKey: 'semester_group',
              title: { ko: '학기' },
              orderIndex: 1,
            },
          ],
        },
      ],
    };
    const values = {
      'question-gender': { gender: 'female' },
      'question-semester': { semesterGroup: '3_4' },
    };

    expect(extractRespondentProfile(profileSurvey, values)).toEqual(
      expect.objectContaining({
        gender: 'female',
        semesterGroup: '3_4',
      }),
    );
    expect(buildSubmissionAnswers(profileSurvey, values)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          questionId: 'question-gender',
          answerType: 'profile',
          valueJson: { gender: 'female' },
        }),
        expect.objectContaining({
          questionId: 'question-semester',
          answerType: 'profile',
          valueJson: { semesterGroup: '3_4' },
        }),
      ]),
    );
  });

  it('normalizes participant uploaded image tags into point answers with upload metadata', () => {
    const participantImageSurvey = {
      ...publishedSurveyFixture,
      sections: [
        {
          ...publishedSurveyFixture.sections[1],
          questions: [
            {
              ...publishedSurveyFixture.sections[1].questions[0],
              id: 'question-upload-tag',
              questionKey: 'upload_tag_suggestion',
              questionType: 'participant_image_tag' as const,
              metricType: 'none' as const,
              config: { tagTypes: ['수리 요청', '개선 제안'] },
              validation: {},
            },
          ],
        },
      ],
    };

    const answers = buildSubmissionAnswers(participantImageSurvey, {
      'question-upload-tag': {
        image: {
          storageBucket: 'survey-assets',
          storagePath: 'participant-uploads/survey-1/user-1/question-upload-tag/image.png',
          signedUrl: 'https://example.com/uploaded.png',
          metadata: {
            originalName: 'image.png',
            contentType: 'image/png',
            size: 1234,
          },
        },
        points: [
          {
            id: 'pin-1',
            xRatio: 0.42,
            yRatio: 0.66,
            tagType: '수리 요청',
            textValue: '문이 잘 닫히지 않습니다.',
          },
        ],
      },
    });

    expect(answers).toEqual([
      expect.objectContaining({
        surveyId: 'survey-1',
        sectionId: 'section-facility',
        questionId: 'question-upload-tag',
        answerType: 'participant_image_tag',
        tagPosition: { xRatio: 0.42, yRatio: 0.66 },
        tagType: '수리 요청',
        textValue: '문이 잘 닫히지 않습니다.',
        valueJson: {
          participantImage: {
            storageBucket: 'survey-assets',
            storagePath: 'participant-uploads/survey-1/user-1/question-upload-tag/image.png',
            originalName: 'image.png',
            contentType: 'image/png',
            size: 1234,
          },
          tagIndex: 1,
        },
      }),
    ]);
  });

  it('treats grouped required multi-select questions as one required answer', () => {
    const section = {
      ...publishedSurveyFixture.sections[1],
      questions: [
        {
          ...publishedSurveyFixture.sections[1].questions[1],
          id: 'time-1',
          questionKey: 'time_1',
          isRequired: true,
          config: {
            displayGroup: '주로 사용하는 시간대',
            minSelect: 0,
            options: [{ value: '05_00_07_00', label: { ko: '05:00~07:00' } }],
          },
        },
        {
          ...publishedSurveyFixture.sections[1].questions[1],
          id: 'time-2',
          questionKey: 'time_2',
          isRequired: true,
          config: {
            displayGroup: '주로 사용하는 시간대',
            minSelect: 0,
            options: [{ value: '07_00_09_00', label: { ko: '07:00~09:00' } }],
          },
        },
      ],
    };

    expect(findMissingRequiredQuestions(section, {})).toEqual([section.questions[0]]);
    expect(
      findMissingRequiredQuestions(section, {
        'time-2': { selectedOptions: ['07_00_09_00'] },
      }),
    ).toEqual([]);
  });

  it('requires an opinion type only for selection-before-text questions', () => {
    const section = {
      ...publishedSurveyFixture.sections[1],
      questions: [
        {
          ...publishedSurveyFixture.sections[1].questions[1],
          id: 'plain-text',
          questionKey: 'plain_text',
          questionType: 'text' as const,
          isRequired: true,
          config: { maxLength: 1000 },
        },
        {
          ...publishedSurveyFixture.sections[1].questions[1],
          id: 'select-text',
          questionKey: 'select_text',
          questionType: 'text' as const,
          isRequired: true,
          config: {
            options: [
              { value: 'discomfort', label: { ko: '불편' } },
              { value: 'praise', label: { ko: '칭찬' } },
            ],
          },
        },
      ],
    };

    expect(
      findMissingRequiredQuestions(section, {
        'plain-text': { textValue: '좋았습니다.' },
        'select-text': { textValue: '좋았습니다.' },
      }),
    ).toEqual([section.questions[1]]);

    expect(
      buildSubmissionAnswers(
        { ...publishedSurveyFixture, sections: [section] },
        {
          'select-text': { opinionType: 'praise', textValue: '좋았습니다.' },
        },
      ),
    ).toEqual([
      expect.objectContaining({
        questionId: 'select-text',
        answerType: 'text',
        textValue: '좋았습니다.',
        valueJson: { opinion_type: 'praise' },
      }),
    ]);
  });
});
