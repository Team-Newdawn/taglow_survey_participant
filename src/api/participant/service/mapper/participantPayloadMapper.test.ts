import { describe, expect, it } from 'vitest';

import type { AnswerInput } from '../../model/answerDraft';
import type { SubmissionCommand } from '../../model/submission';
import type { RawPublicSurveyBundle } from '../gateway/participantApiGateway';
import { ParticipantPayloadMapper } from './participantPayloadMapper';

describe('ParticipantPayloadMapper', () => {
  const mapper = new ParticipantPayloadMapper();

  it('maps the current Supabase survey shape to a public survey domain model', () => {
    const survey = mapper.toPublicSurvey({
      survey: {
        id: 'survey-1',
        title: '생활관 만족도 조사',
        description: '2026 봄학기 생활관 경험을 알려주세요.',
        description_en: 'Tell us about your dormitory experience in Spring 2026.',
        status: 'published',
        public_slug: null,
        public_code: 'D93C1C44',
        version_group_id: 'version-group-1',
        version_number: 2,
        parent_survey_id: 'survey-0',
        is_latest_version: true,
        settings: { defaultLocale: 'ko', locales: ['ko', 'en'] },
        published_at: '2026-05-28T00:00:00.000Z',
        closed_at: null,
      },
      sections: [
        {
          id: 'section-1',
          survey_id: 'survey-1',
          section_key: 'facility',
          title_ko: '시설',
          title_en: 'Facilities',
          description_ko: '공간별 만족도를 알려주세요.',
          description_en: 'Tell us about each space.',
          order_index: 1,
          section_type: 'facility',
          settings: {},
        },
      ],
      questions: [
        {
          id: 'question-1',
          survey_id: 'survey-1',
          section_id: 'section-1',
          question_key: 'laundry-experience',
          question_type: 'experience',
          title_ko: '세탁실을 사용해 보셨나요?',
          title_en: 'Have you used the laundry room?',
          description_ko: null,
          description_en: null,
          order_index: 1,
          is_required: true,
          metric_type: 'experience',
          topic_key: 'laundry',
          space_key: 'laundry_room',
          config: { options: [] },
          validation: {},
        },
        {
          id: 'question-2',
          survey_id: 'survey-1',
          section_id: 'section-1',
          question_key: 'laundry-choice',
          question_type: 'single_choice',
          title_ko: '세탁실에서 가장 불편한 점은 무엇인가요?',
          title_en: null,
          description_ko: null,
          description_en: null,
          order_index: 2,
          is_required: false,
          metric_type: null,
          topic_key: 'laundry',
          space_key: null,
          config: {
            choices: [
              { id: 'cleanliness', label_ko: '청결', label_en: 'Cleanliness' },
              { value: '05_00_07_00', labelKo: '05:00~07:00' },
              'other',
            ],
          },
          validation: {},
        },
      ],
      assets: [],
    } satisfies RawPublicSurveyBundle);

    expect(survey).toMatchObject({
      id: 'survey-1',
      title: { ko: '생활관 만족도 조사' },
      description: {
        ko: '2026 봄학기 생활관 경험을 알려주세요.',
        en: 'Tell us about your dormitory experience in Spring 2026.',
      },
      publicSlug: 'D93C1C44',
      publicCode: 'D93C1C44',
      versionGroupId: 'version-group-1',
      versionNumber: 2,
      parentSurveyId: 'survey-0',
      isLatestVersion: true,
      sections: [
        {
          sectionKey: 'facility',
          title: { ko: '시설', en: 'Facilities' },
          description: { ko: '공간별 만족도를 알려주세요.', en: 'Tell us about each space.' },
          questions: [
            {
              questionKey: 'laundry-experience',
              questionType: 'experience',
              metricType: 'experience',
              topicKey: 'laundry',
              spaceKey: 'laundry_room',
            },
            {
              questionKey: 'laundry-choice',
              questionType: 'single_choice',
              metricType: 'none',
              config: {
                options: [
                  { value: 'cleanliness', label: { ko: '청결', en: 'Cleanliness' }, metadata: {} },
                  { value: '05_00_07_00', label: { ko: '05:00~07:00' }, metadata: {} },
                  { value: 'other', label: { ko: 'other' } },
                ],
              },
            },
          ],
        },
      ],
    });
  });

  it('normalizes persistence payloads for the current DB constraints', () => {
    const responsePayload = mapper.toCreateResponsePayload({
      surveyId: 'survey-1',
      participantUserId: 'user-1',
      participantEmail: 'Student@EXAMPLE.COM',
      locale: 'ko',
      profile: {
        gender: 'female',
        semesterGroup: '3-4',
        department: 'CSEE',
        rc: 'torrey',
        dormitory: 'hyoam',
        roomType: 'double',
        dormExperience: 'one_year',
      },
      answers: [],
      rawPayload: { source: 'test' },
    } satisfies SubmissionCommand);

    const answerPayload = mapper.toCreateAnswerPayload(
      {
        surveyId: 'survey-1',
        sectionId: 'section-1',
        questionId: 'question-1',
        answerType: 'scale',
        metricType: 'legacy' as AnswerInput['metricType'],
        scoreValue: 4,
        valueJson: { note: 'ok' },
      },
      'response-1',
    );

    expect(responsePayload).toMatchObject({
      participant_email: 'student@example.com',
      status: 'submitted',
    });
    expect(answerPayload).toMatchObject({
      response_id: 'response-1',
      metric_type: 'none',
      score_value: 4,
      value_json: { note: 'ok' },
    });
  });

  it('maps a submission command to the transactional RPC payload shape', () => {
    const payload = mapper.toSubmitSurveyPayload({
      surveyId: 'survey-1',
      participantUserId: 'user-1',
      participantEmail: 'Student@EXAMPLE.COM',
      locale: 'en',
      profile: {
        department: 'CSEE',
      },
      answers: [
        {
          surveyId: 'survey-1',
          sectionId: 'section-1',
          questionId: 'question-1',
          answerType: 'single_choice',
          choiceValue: 'quiet',
          valueJson: { choiceValue: 'quiet' },
        },
      ],
      rawPayload: { question1: 'quiet' },
    } satisfies SubmissionCommand);

    expect(payload.response).toMatchObject({
      survey_id: 'survey-1',
      participant_user_id: 'user-1',
      participant_email: 'student@example.com',
      raw_payload: { question1: 'quiet' },
    });
    expect(payload.answers).toEqual([
      expect.objectContaining({
        survey_id: 'survey-1',
        response_id: null,
        answer_type: 'single_choice',
        choice_value: 'quiet',
      }),
    ]);
    expect(payload.rawPayload).toEqual({ question1: 'quiet' });
  });
});
