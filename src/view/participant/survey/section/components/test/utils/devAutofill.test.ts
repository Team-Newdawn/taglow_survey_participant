import { describe, expect, it } from 'vitest';

import type { PublicQuestion } from '../../../../../../../api/participant';
import { buildDevAutofillValues } from '../../utils/devAutofill';

describe('buildDevAutofillValues', () => {
  it('uses a valid non-excluded score for 7-point scale questions', () => {
    const question: PublicQuestion = {
      id: 'question-scale-7',
      surveyId: 'survey-1',
      sectionId: 'section-1',
      questionKey: 'scale_7',
      questionType: 'scale',
      title: { ko: '7점 척도' },
      orderIndex: 0,
      isRequired: true,
      metricType: 'satisfaction',
      config: {
        scaleMax: 7,
        labelsKo: ['참여경험없음', '매우 불만족', '불만족', '보통', '만족', '매우 만족', '들어본 적 없음'],
        excludedValues: [1, 7],
      },
      validation: {},
    };

    expect(
      buildDevAutofillValues({
        questions: [question],
        assets: [],
        locale: 'ko',
        fallbackLocale: 'ko',
        currentValues: {},
      }),
    ).toEqual({
      'question-scale-7': { scoreValue: 6 },
    });
  });
});
