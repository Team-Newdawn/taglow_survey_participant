# Taglow Survey Participant TDD

## 1. 참여자 TDD v2 요약

참여자 페이지는 다음 흐름을 구현한다.

```text
공개 URL/QR 접속
→ 설문 상태 확인
→ Google 로그인
→ Supabase 세션 확인
→ 중복 제출 여부 확인
→ 설문 안내 화면
→ 섹션별 질문 응답
→ 프론트엔드 캐시 임시 저장
→ 이미지/도면 태깅
→ 제출 전 검토
→ 최종 제출
→ responses + answers 저장
→ 제출 완료 화면
```

현재 자체 서버가 없으므로 Supabase를 직접 사용한다. 하지만 서버 도입 후에도 참여자 View를 변경하지 않도록 API Boundary를 적용한다.

```text
현재 구조:
Participant View
  → Participant Query / Mutation Hook
  → ParticipantApiController
  → ParticipantPayloadMapper
  → SupabaseParticipantApiGateway
  → Supabase Auth / Database / Storage

서버 구축 후:
Participant View
  → Participant Query / Mutation Hook
  → ParticipantApiController
  → ParticipantPayloadMapper
  → HttpParticipantApiGateway
  → 자체 API 서버
  → Supabase
```

Supabase SDK는 `SupabaseParticipantApiGateway` 내부에만 존재한다.

---

## 2. 공통 기술 스택

| 영역 | 선택 기술 | 적용 방식 |
| --- | --- | --- |
| Frontend | React + TypeScript | 참여자 SPA 구현 |
| Routing | React Router | 공개 설문 URL 라우팅 |
| Server State | TanStack Query | 공개 설문 구조 조회, 중복 제출 조회, 제출 mutation 관리 |
| Client/UI State | Zustand | 현재 섹션, locale, draft 복구 상태, 이미지 태깅 UI 상태 |
| Form State | React Hook Form | 섹션별 질문 입력값 관리 |
| Validation | Zod | 질문 유형별 응답값, 제출 payload 검증 |
| Draft Cache | localStorage 우선, 필요 시 IndexedDB | 서버 부담 없는 프론트엔드 임시 저장 |
| Backend | Supabase | 서버 구축 전 데이터/API 백엔드 |
| Auth | Supabase Auth | Google 로그인, 세션 관리 |
| Storage | Supabase Storage | 이미지 태깅용 이미지 조회 |
| Database | Supabase Postgres | published survey 조회, responses/answers 저장 |
| Test | Vitest + React Testing Library | 단위/컴포넌트 테스트 |
| E2E | Playwright | 로그인, 응답, 임시 저장, 제출 흐름 검증 |

---

## 3. 상태관리 선택

참여자 페이지는 서버 데이터보다 “응답 중인 폼 상태”와 “draft 복구”가 중요하다. 따라서 다음처럼 역할을 나눈다.

```text
공개 설문 구조 데이터
→ TanStack Query

참여자 진행 상태
→ Zustand

질문 입력값
→ React Hook Form

임시 저장 draft
→ localStorage / IndexedDB
```

## 3.1 TanStack Query 사용 범위

- 공개 설문 데이터 조회
- 설문 상태 확인
- 섹션/질문/자산 metadata 조회
- 중복 제출 여부 조회
- 최종 제출 mutation

## 3.2 Zustand 사용 범위

- 현재 선택 locale
- 현재 section index
- 완료된 section id 목록
- draft 복구 여부
- 제출 전 검토 화면 진입 여부
- 이미지 태깅 편집 상태
- 로그인/접근 제한 상태의 화면 전환 상태

## 3.3 React Hook Form 사용 범위

- 질문 입력값 관리
- 섹션 단위 validation
- 제출 전 전체 validation
- dirty/touched 상태 추적
- draft save trigger와 연동

## 3.4 Draft Cache 사용 범위

```text
- 서버에는 최종 제출 전까지 저장하지 않는다.
- draft는 survey_id + participant_user_id 기준으로 구분한다.
- 최종 제출 성공 시 draft를 삭제한다.
- 브라우저/기기 변경 간 draft 동기화는 지원하지 않는다.
- draft에는 access token, refresh token, service key를 저장하지 않는다.
```

---

## 4. 프로젝트 구조

Generalized Project Structure Guide를 기반으로 하되, 참여자 도메인에 맞게 다음 구조를 적용한다.

```text
src/
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   ├── providers.tsx
│   ├── queryClient.ts
│   └── routeGuards.tsx
│
├── api/
│   └── participant/
│       ├── model/
│       │   ├── auth.ts
│       │   ├── publicSurvey.ts
│       │   ├── section.ts
│       │   ├── question.ts
│       │   ├── asset.ts
│       │   ├── answerDraft.ts
│       │   ├── submission.ts
│       │   └── commands.ts
│       │
│       ├── service/
│       │   ├── gateway/
│       │   │   ├── participantApiGateway.ts
│       │   │   ├── supabaseParticipantApiGateway.ts
│       │   │   ├── httpParticipantApiGateway.ts
│       │   │   └── apiErrors.ts
│       │   │
│       │   ├── mapper/
│       │   │   └── participantPayloadMapper.ts
│       │   │
│       │   ├── draft/
│       │   │   ├── draftStorage.ts
│       │   │   ├── localStorageDraftStorage.ts
│       │   │   └── indexedDbDraftStorage.ts
│       │   │
│       │   └── validation/
│       │       ├── answerSchema.ts
│       │       ├── submissionSchema.ts
│       │       ├── branchEvaluator.ts
│       │       └── attentionCheckValidator.ts
│       │
│       ├── controller/
│       │   ├── participantApiController.ts
│       │   ├── gatewayBackedParticipantApiController.ts
│       │   └── participantApiControllerProvider.tsx
│       │
│       ├── query/
│       │   ├── queryKeys.ts
│       │   ├── usePublicSurveyQuery.ts
│       │   ├── useDuplicateSubmissionQuery.ts
│       │   └── useSubmissionMutation.ts
│       │
│       └── runtime/
│           ├── createParticipantApiRuntime.ts
│           └── participantApiRuntime.tsx
│
├── store/
│   ├── participantProgressStore.ts
│   ├── participantLocaleStore.ts
│   ├── participantDraftStore.ts
│   ├── imageTaggingStore.ts
│   └── uiStore.ts
│
├── components/
│   ├── Button.tsx
│   ├── Select.tsx
│   ├── ProgressBar.tsx
│   ├── StepHeader.tsx
│   ├── Message.tsx
│   └── css/
│
├── utils/
│   ├── envConfig.ts
│   ├── authDomain.ts
│   ├── i18nText.ts
│   ├── imageRatio.ts
│   ├── answerNormalizer.ts
│   ├── draftKey.ts
│   └── dateTime.ts
│
├── view/
│   └── participant/
│       ├── auth/
│       │   ├── ParticipantLoginPage.tsx
│       │   └── components/
│       │
│       ├── survey/
│       │   ├── SurveyEntryPage.tsx
│       │   ├── SurveyIntroPage.tsx
│       │   ├── SurveySectionPage.tsx
│       │   ├── SurveyReviewPage.tsx
│       │   ├── SurveyCompletePage.tsx
│       │   └── components/
│       │       ├── SectionNavigator.tsx
│       │       ├── QuestionRenderer.tsx
│       │       ├── ScaleQuestion.tsx
│       │       ├── SingleChoiceQuestion.tsx
│       │       ├── MultiSelectQuestion.tsx
│       │       ├── RankingQuestion.tsx
│       │       ├── TextQuestion.tsx
│       │       ├── ImageTagQuestion.tsx
│       │       ├── LowScoreFollowUp.tsx
│       │       ├── AttentionCheckQuestion.tsx
│       │       └── DraftRestoreBanner.tsx
│       │
│       └── system/
│           ├── SurveyNotFoundPage.tsx
│           ├── SurveyClosedPage.tsx
│           ├── AlreadySubmittedPage.tsx
│           └── AccessDeniedPage.tsx
│
└── test/
    ├── setup.ts
    ├── renderWithProviders.tsx
    ├── fakeParticipantApiController.ts
    └── fixtures/
```

---

## 5. 라우팅 설계

```text
/survey/:publicSlug
/survey/:publicSlug/login
/survey/:publicSlug/intro
/survey/:publicSlug/sections/:sectionKey
/survey/:publicSlug/review
/survey/:publicSlug/complete
/survey/:publicSlug/closed
/survey/:publicSlug/already-submitted
/survey/:publicSlug/access-denied
```

### 5.1 Route Guard

참여자 라우트는 다음 조건을 처리한다.

```text
1. publicSlug로 survey 조회
2. survey.status = published 확인
3. Google 로그인 확인
4. responses unique index 기준 중복 제출 여부 확인
```

중복 제출 검사는 survey와 session이 모두 확인된 뒤 실행한다. 로그인 전 공개/미발견 경로에서는 participant user id가 없으므로 duplicate query를 실행하지 않는다.

분기:

```text
비로그인 → /survey/:publicSlug/login
설문 없음 → /survey/:publicSlug/not-found
closed/archived → /survey/:publicSlug/closed
이미 제출함 → /survey/:publicSlug/already-submitted
통과 → /survey/:publicSlug/intro
```

---

## 6. 확장된 Supabase Database 구조 중 참여자 관련 영역

참여자 페이지가 직접 사용하는 테이블은 다음이다.

```text
읽기:
- surveys
- survey_sections
- questions
- survey_assets

쓰기:
- responses
- answers

권한 검증:
- auth.users via Supabase Auth
- RLS policies for authenticated participant ownership
```

관리자 권한 테이블 `admin_members`는 참여자 페이지에서 직접 사용하지 않는다.

---

### 6.0 현재 Supabase 스키마 스냅샷

기준 프로젝트:

```text
project name: taglow-survey
project ref: tkaltosbhdzkuazslhtp
database: Postgres 17
checked at: 2026-05-28
applied migrations:
- 001_taglow_survey_core_schema
- 002_taglow_survey_indexes
- 003_taglow_survey_security_rpc_storage
- 004_taglow_survey_function_hardening
- 005_taglow_survey_private_rls_helpers
- 006_revoke_exposed_rls_auto_enable
- 007_align_section_type_values
```

현재 production DB 상태:

```text
public.surveys rows: 2, both draft, public_slug null
public.survey_sections rows: 1
public.questions rows: 1
public.survey_assets rows: 0
public.responses rows: 0
public.answers rows: 0
storage bucket: survey-assets, private
edge functions: none
participant submit RPC: submit_survey_response is not deployed
```

중요 구현 결정:

```text
- surveys는 title/title_ko/title_en 구조가 아니라 title/description 단일 컬럼을 가진다.
- section/question만 title_ko/title_en, description_ko/description_en 컬럼을 가진다.
- survey title/description은 LocalizedText.ko로 매핑하고, en이 없으면 ko로 fallback한다.
- 참여자용 공개 bundle RPC/Edge Function은 없으므로 Supabase gateway는 PostgREST embedded select 한 번으로 surveys + survey_sections + questions + survey_assets를 조합한다.
- 현재 제출은 submit_survey_response RPC가 아니라 responses insert + answers bulk insert를 사용한다.
- 정식 런칭 전 transactional submit RPC를 추가하면 SupabaseParticipantApiGateway에 optional submitSurveyResponse를 다시 연결한다.
- responses RLS는 participant_email lower-case가 auth email과 같은지 검사하므로 client payload는 lower-case email을 저장한다.
```

실제 check constraint:

```text
surveys.status:
- draft
- published
- closed
- archived

survey_sections.section_type:
- intro
- profile
- general
- facility
- laundry
- global_lounge
- identity
- completion
- satisfaction
- space_tagging
- free_text
- submitter

questions.question_type / answers.answer_type:
- profile
- experience
- scale
- single_choice
- multi_select
- ranking
- text
- image_tag
- attention_check

questions.metric_type / answers.metric_type:
- none
- satisfaction
- importance
- experience

responses.status:
- in_progress
- submitted
- discarded

answers.score_value:
- null or 1..5

answers.x_ratio / answers.y_ratio:
- null or 0..1

answers.severity:
- null or 1..5
```

중요 unique/index:

```text
surveys.public_slug unique
surveys(version_group_id, version_number) unique
survey_sections(survey_id, section_key) unique
questions(survey_id, question_key) unique
responses(id, survey_id) unique
responses unique submitted response:
  unique (survey_id, participant_user_id) where status = 'submitted'

analytics indexes:
- responses(survey_id, dormitory, room_type, rc, department, gender)
- answers(survey_id, answer_type, metric_type)
- answers(survey_id, topic_key, space_key)
- answers(survey_id, asset_id, tag_type) where answer_type='image_tag'
- answers.value_json gin
```

현재 RLS 요약:

```text
surveys:
- authenticated admin can CRUD own surveys
- authenticated users can select published surveys

survey_sections / questions / survey_assets:
- authenticated admin can manage own survey structure
- authenticated users can select rows for published surveys
- insert/update/delete on published/closed/archived survey structure is blocked by trigger

responses:
- participant can insert only own response
- participant_email must match current auth email lower-case
- participant can read own response
- admin can read responses of own surveys

answers:
- participant can insert answers only for own response and same survey
- participant can read own answers
- admin can read answers of own surveys

storage.objects:
- bucket survey-assets is private
- admin can manage survey asset objects
- authenticated users can read objects connected to published survey_assets
```

현재 분석 함수는 관리자/분석 화면용이며 참여자 View에서 직접 호출하지 않는다.

```text
get_survey_filter_options
get_section_satisfaction_summary
get_borich_summary
get_heatmap_points
get_text_answers
```

---

## 6.1 참여자 조회 모델

### `surveys`

참여자는 `public_slug`로 published survey를 조회한다.

필요 필드:

```text
id
title
description
status
public_slug
version_group_id
version_number
parent_survey_id
is_latest_version
settings
published_at
closed_at
```

참여자가 볼 수 있는 조건:

```text
status = published
public_slug = route param
authenticated user
```

### `survey_sections`

섹션 단위 진행을 위해 조회한다.

필요 필드:

```text
id
survey_id
section_key
title_ko
title_en
description_ko
description_en
order_index
section_type
settings
```

### `questions`

섹션 안의 질문을 렌더링하기 위해 조회한다.

필요 필드:

```text
id
survey_id
section_id
question_key
question_type
title_ko
title_en
description_ko
description_en
order_index
is_required
metric_type
topic_key
space_key
config
validation
```

### `survey_assets`

이미지 태깅용 공간 이미지를 렌더링하기 위해 조회한다.

필요 필드:

```text
id
survey_id
section_id
question_id
asset_type
storage_bucket
storage_path
metadata
```

---

## 6.2 참여자 제출 모델

### `responses`

한 명의 최종 제출 단위다.

저장 필드:

```text
survey_id
participant_user_id
participant_email
status
locale
gender
semester_group
department
rc
dormitory
room_type
dorm_experience
profile_json
raw_payload
started_at
submitted_at
```

기본 정보는 관리자 필터링을 위해 컬럼으로 저장한다.

```text
- gender
- semester_group
- department
- rc
- dormitory
- room_type
- dorm_experience
```

### `answers`

모든 질문의 응답을 통합 저장한다.

공통 필드:

```text
survey_id
response_id
section_id
question_id
answer_type
metric_type
topic_key
space_key
value_json
```

유형별 필드:

```text
scale:
- score_value

single_choice:
- choice_value

multi_select:
- value_json.selected_options

ranking:
- value_json.ranked_options

text:
- text_value
- severity optional

image_tag:
- asset_id
- x_ratio
- y_ratio
- tag_type
- severity
- text_value

attention_check:
- choice_value or score_value
```

---

## 7. Participant Domain Model

```ts
export type PublicSurvey = Readonly<{
  id: string;
  title: LocalizedText;
  description?: LocalizedText;
  publicSlug: string;
  status: 'published' | 'closed' | 'archived';
  versionGroupId?: string;
  versionNumber?: number;
  parentSurveyId?: string;
  isLatestVersion?: boolean;
  settings: PublicSurveySettings;
  sections: PublicSurveySection[];
  assets: SurveyAsset[];
}>;

export type PublicSurveySection = Readonly<{
  id: string;
  surveyId: string;
  sectionKey: string;
  title: LocalizedText;
  description?: LocalizedText;
  orderIndex: number;
  sectionType: string;
  questions: PublicQuestion[];
}>;

export type QuestionType =
  | 'profile'
  | 'experience'
  | 'scale'
  | 'single_choice'
  | 'multi_select'
  | 'ranking'
  | 'text'
  | 'image_tag'
  | 'participant_image_tag'
  | 'attention_check';

export type QuestionConfig = Readonly<{
  options?: QuestionOption[];
  assetId?: string;
  displayGroup?: string;
  maxTags?: number;
  minSelections?: number;
  maxSelections?: number;
  lowScoreThreshold?: number;
  textMode?: 'short' | 'long' | 'select_text';
  multiline?: boolean;
  maxLength?: number;
  opinionTypes?: QuestionOption[];
  opinionOptions?: QuestionOption[];
  categoryOptions?: QuestionOption[];
  branch?: BranchConfig;
  visibility?: BranchConfig;
  [key: string]: unknown;
}>;

export type PublicQuestion = Readonly<{
  id: string;
  surveyId: string;
  sectionId: string;
  questionKey: string;
  questionType: QuestionType;
  title: LocalizedText;
  description?: LocalizedText;
  orderIndex: number;
  isRequired: boolean;
  metricType: 'none' | 'satisfaction' | 'importance' | 'experience';
  topicKey?: string;
  spaceKey?: string;
  config: QuestionConfig;
  validation: QuestionValidation;
}>;

export type SubmissionCommand = Readonly<{
  surveyId: string;
  participantUserId: string;
  participantEmail: string;
  locale: 'ko' | 'en';
  startedAt?: string;
  profile: RespondentProfile;
  answers: AnswerInput[];
  rawPayload: Record<string, unknown>;
}>;
```

---

## 8. Participant API Gateway Interface

```ts
export interface ParticipantApiGateway {
  getSession(): Promise<RawSession | null>;
  signInWithGoogle(redirectTo: string): Promise<void>;
  signOut(): Promise<void>;

  fetchPublicSurveyBySlug(publicSlug: string): Promise<RawPublicSurveyBundle>;
  checkDuplicateSubmission(args: {
    surveyId: string;
    participantUserId: string;
  }): Promise<RawDuplicateSubmissionResult>;

  createResponse(payload: RawCreateResponsePayload): Promise<RawResponse>;
  createAnswers(payloads: RawCreateAnswerPayload[]): Promise<RawAnswer[]>;

  submitSurveyResponse?(payload: RawSubmitSurveyPayload): Promise<RawSubmitSurveyResult>;

  createSignedAssetUrl(args: {
    bucket: string;
    path: string;
  }): Promise<string>;
}
```

Supabase gateway의 `fetchPublicSurveyBySlug`는 HTTP API 응답처럼 `surveys` row에 embedded `survey_sections`, `questions`, `survey_assets`를 함께 select한 뒤 `RawPublicSurveyBundle`로 풀어준다. View와 query hook은 여전히 단일 `PublicSurvey` domain model만 사용한다.

### 8.1 제출 방식

현재 Supabase production DB에는 `submit_survey_response` RPC가 배포되어 있지 않다.
따라서 MVP 구현의 현재 기본값은 A안이다.

#### A안. response insert + answers bulk insert

```text
1. responses insert
2. response_id 반환
3. answers bulk insert
4. 성공 시 draft 삭제
```

장점:

```text
- 구현이 빠름
- Supabase table insert만으로 가능
```

주의점:

```text
- answers insert 실패 시 response만 남을 수 있음
- 현재 participant RLS에는 response update 권한이 없으므로 client에서 discarded로 되돌릴 수 없음
- 정식 런칭 전에는 B안 RPC 또는 서버 API로 transaction 처리 필요
```

#### B안. submit_survey_response RPC

```text
1. submitSurveyResponse(payload)
2. DB function 내부에서 response + answers transaction 처리
3. 성공 시 response_id 반환
4. 성공 시 draft 삭제
```

장점:

```text
- transaction 처리 가능
- 중간 실패 상태 최소화
- 서버 구축 전에도 DB function으로 안정성 확보
```

추천:

```text
현재 DB 기준 초기 개발은 A안으로 동작한다.
정식 런칭 전에는 B안으로 전환 권장.
RPC가 배포되기 전에는 SupabaseParticipantApiGateway에 submitSurveyResponse를 구현하지 않는다.
```

Participant Controller에서는 두 방식을 같은 use case로 감싼다.

```ts
submitSurvey(command: SubmissionCommand): Promise<SubmissionResult>
```

Gateway 구현체만 A/B를 선택한다.

---

## 9. Payload Mapper 설계

Mapper 책임:

```text
- Supabase survey/section/question/assets row를 PublicSurvey domain으로 변환
- surveys.title/description 단일 컬럼은 LocalizedText.ko로 변환
- section/question의 title_ko/title_en을 LocalizedText로 변환
- questions.config를 questionType별 config로 parse
- form values를 answers insert payload로 변환
- 기본 정보 문항 값을 responses 컬럼으로 추출
- image_tag form value를 x_ratio/y_ratio/tag_type/text_value로 변환
- metric_type은 DB check constraint 값인 none/satisfaction/importance/experience로 normalize
```

예시:

```ts
export function toAnswerPayload(input: AnswerInput): RawCreateAnswerPayload {
  return {
    survey_id: input.surveyId,
    response_id: input.responseId,
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
```

---

## 10. Participant Controller Use Cases

```ts
export interface ParticipantApiController {
  getCurrentSession(): Promise<ParticipantSession | null>;
  signInWithGoogle(command: SignInCommand): Promise<void>;
  signOut(): Promise<void>;

  getPublicSurvey(publicSlug: string): Promise<PublicSurvey>;
  checkAccess(publicSlug: string): Promise<SurveyAccessResult>;
  checkDuplicateSubmission(command: DuplicateSubmissionCommand): Promise<DuplicateSubmissionResult>;

  getAssetUrl(asset: SurveyAsset): Promise<string>;

  submitSurvey(command: SubmissionCommand): Promise<SubmissionResult>;
}
```

---

## 11. Query Key 설계

```ts
export const participantQueryKeys = {
  session: ['participant', 'session'] as const,
  publicSurvey: (publicSlug: string, authScope: string) =>
    ['participant', 'survey', publicSlug, authScope] as const,
  duplicateSubmission: (surveyId: string, participantUserId: string) => [
    'participant',
    'survey',
    surveyId,
    'duplicate',
    participantUserId,
  ] as const,
  assetUrl: (assetId: string) => ['participant', 'assetUrl', assetId] as const,
};
```

`publicSurvey` query는 session hydration 이후 실행한다. Supabase RLS가 anonymous client에는 published survey row도 숨길 수 있으므로, `authScope`는 `anonymous` 또는 `participantUserId`를 사용해 로그인 전 실패 cache가 로그인 후 화면을 막지 않게 한다.

Mutation:

```text
useSubmissionMutation()
→ controller.submitSurvey(command)
→ 성공 시 draft 삭제
→ complete page 이동
```

---

## 12. Draft Cache 설계

### 12.1 Draft Key

```ts
export function buildDraftKey(args: {
  surveyId: string;
  participantUserId: string;
}) {
  return `taglow-survey-draft:${args.surveyId}:${args.participantUserId}`;
}
```

### 12.2 Draft Shape

```ts
export type SurveyDraft = Readonly<{
  surveyId: string;
  participantUserId: string;
  locale: 'ko' | 'en';
  currentSectionId?: string;
  values: Record<string, unknown>;
  updatedAt: string;
  schemaVersion: number;
}>;
```

### 12.3 저장 시점

```text
- section 이동 시
- 5~10초 debounce
- page visibility hidden
- beforeunload
```

### 12.4 삭제 시점

```text
- 제출 성공
- 사용자가 임시 저장 삭제 선택
- survey id 또는 participant id 불일치
- schemaVersion mismatch 시 복구 불가 처리
```

---

## 13. 질문 렌더링 설계

섹션 렌더링은 `SurveySectionPage`가 소유하고, 개별 문항 렌더링은 `QuestionRenderer`와 질문 컴포넌트가 소유한다. View는 Supabase SDK나 raw row를 직접 알지 않고, `usePublicSurveyQuery`, `useParticipantSessionQuery`, draft store, React Hook Form 값만 사용한다.

### 13.0 Section Rendering Pipeline

```text
route /survey/:publicSlug/sections/:sectionKey
→ usePublicSurveyQuery(publicSlug)
→ useParticipantSessionQuery()
→ 현재 sectionKey에 해당하는 PublicSurveySection 선택
→ React Hook Form defaultValues = participantDraftStore.values
→ section.questions를 branchEvaluator.shouldShowQuestion으로 필터링
→ buildQuestionScreens(visibleQuestions)
→ 현재 questionScreenIndex의 questions 선택
→ buildQuestionRenderBlocks(currentQuestionScreen)
→ QuestionRenderer 또는 grouped question component 렌더링
```

질문 화면 분할 규칙:

- `image_tag`와 `participant_image_tag`는 각각 하나의 독립 question screen이 된다.
- 연속된 non-image 질문은 같은 question screen에 함께 렌더링할 수 있다.
- 이미지 태깅 전후의 non-image 질문은 이미지 태깅 화면과 섞지 않는다.
- `sectionKey`가 바뀌면 `questionScreenIndex`와 `missingQuestionIds`를 초기화한다.

이동 규칙:

- `goNext`는 현재 question screen에 포함된 required question만 검사한다.
- 누락이 있으면 `missingQuestionIds`를 설정하고 이동하지 않는다.
- 누락이 없고 다음 question screen이 있으면 draft 저장 후 `questionScreenIndex + 1`.
- 현재 section의 마지막 question screen이면 section completed 상태를 표시하고 draft 저장 후 다음 section 또는 review로 이동한다.
- `goPrevious`는 draft 저장 후 이전 question screen, 이전 section, intro 순서로 이동한다.

### 13.0.1 Render Block Grouping

`questionRenderBlocks.ts`는 화면에 보이는 질문 단위를 만든다.

```ts
type QuestionRenderBlock =
  | { type: 'question'; question: PublicQuestion }
  | { type: 'scale_group'; id: string; groupTitle: string; questions: PublicQuestion[] }
  | { type: 'multi_select_group'; id: string; groupTitle: string; questions: PublicQuestion[] };
```

그룹화 규칙:

- `scale` 질문이 연속되어 있고 같은 non-empty `config.displayGroup` 값을 가지면 `scale_group` 후보가 된다.
- `multi_select` 질문이 연속되어 있고 같은 non-empty `config.displayGroup` 값을 가지면 `multi_select_group` 후보가 된다.
- 같은 그룹 후보가 2개 이상일 때만 그룹 block으로 만든다.
- 그룹이 아닌 질문은 일반 `question` block으로 유지한다.
- 렌더링 번호는 `visibleQuestions` 전체에 대해 만든 render block 순서를 기준으로 부여한다.
- 그룹 block은 데이터상 여러 질문이어도 참여자 화면에서는 하나의 번호를 가진다.

### 13.0.2 QuestionRenderer Mapping

```text
profile → ProfileQuestion
experience → ExperienceQuestion
scale → ScaleQuestion
single_choice → SingleChoiceQuestion
multi_select → MultiSelectQuestion
ranking → RankingQuestion
text → TextQuestion
image_tag → ImageTagQuestion
participant_image_tag → ParticipantImageTagQuestion
attention_check → AttentionCheckQuestion
unknown → TextQuestion fallback
```

공통 props:

```ts
type QuestionComponentProps<TValue = unknown> = {
  question: PublicQuestion;
  assets: SurveyAsset[];
  locale: Locale;
  fallbackLocale: Locale;
  value: TValue;
  error?: string;
  number?: number;
  onChange: (value: TValue) => void;
};
```

### 13.0.3 QuestionShell Contract

대부분의 개별 문항은 `QuestionShell` 안에서 렌더링한다.

- `section.question-shell` 역할의 surface를 제공한다.
- `aria-labelledby`로 질문 제목을 연결한다.
- 렌더링 번호가 있으면 제목 앞에 `n.`을 표시한다.
- required question은 시각적으로 `*`를 붙이고 `aria-label="필수"`를 포함한다.
- description이 있으면 localized text로 표시한다.
- `error`가 있으면 문항 하단에 표시한다.
- 그룹 질문은 `QuestionShell`을 직접 쓰지 않고 같은 접근성/타이포그래피 계약을 자체 구현한다.

### 13.1 ScaleQuestion

값 shape:

```ts
type ScaleValue = {
  scoreValue?: number;
  lowScoreReason?: string;
  lowScoreText?: string;
};
```

렌더링:

- 1~5 고정 점수 버튼을 렌더링한다.
- 선택 점수가 `config.lowScoreThreshold` 이하이면 `LowScoreFollowUp`을 표시한다.
- threshold 기본값은 2다.
- threshold를 초과하는 점수를 선택하면 낮은 점수 후속 값은 제거한다.

저장 매핑:

```text
answer_type = scale
metric_type = question.metricType
score_value = 선택한 점수
value_json.low_score_reason = 낮은 점수 이유
value_json.low_score_text = 낮은 점수 설명
```

### 13.1.1 ScaleQuestionGroup

`scale_group` block은 `ScaleQuestionGroup`으로 렌더링한다.

렌더링:

- 그룹 제목, 렌더링 번호, required star, `answeredCount/questions.length`를 표시한다.
- 각 question은 accordion summary로 표시한다.
- summary에는 localized display label, `미응답` 또는 `n점`, toggle을 표시한다.
- 누락 required question이 있으면 해당 item panel을 자동으로 펼친다.
- panel 안에서는 `ScaleQuestionBody`를 재사용한다.

display label 우선순위:

```text
config.displayLabelKo/displayLabelEn
→ fallback locale display label
→ config.displayLabel
→ title의 bracket label
→ question title
```

### 13.2 SingleChoiceQuestion

값 shape:

```ts
type SingleChoiceValue = string;
```

렌더링:

- `role="radiogroup"`와 native `input type="radio"`를 사용한다.
- option label은 `getDisplayOptions`로 localized label을 표시한다.
- 저장값은 option label이 아니라 option value다.

저장 매핑:

```text
answer_type = single_choice
choice_value = 선택한 option.value
```

### 13.3 MultiSelectQuestion

값 shape:

```ts
type MultiSelectValue = {
  selectedOptions?: string[];
  otherText?: string;
};
```

렌더링:

- native `input type="checkbox"`를 사용한다.
- `validation.minSelections`, `validation.maxSelections`, `config.minSelections`, `config.maxSelections`를 읽는다.
- 현재 선택 개수와 min/max 안내를 표시한다.
- max 선택 수에 도달하면 미선택 option은 disabled 처리한다.
- `other`를 선택하면 `otherText` input을 표시한다.

저장 매핑:

```json
{
  "selectedOptions": ["05_07", "07_09"],
  "otherText": null
}
```

### 13.3.1 MultiSelectQuestionGroup

`multi_select_group` block은 `MultiSelectQuestionGroup`으로 렌더링한다.

렌더링:

- 같은 `displayGroup`의 연속 질문 option을 화면상 하나의 checkbox list로 flatten한다.
- 내부 값은 각 원본 question id별로 유지한다.
- selected count는 그룹 전체 기준으로 계산한다.
- min/max selection은 그룹 질문들의 validation/config 중 첫 유효 값을 사용한다.
- required group은 그룹 전체 선택 수가 minSelections보다 작으면 누락으로 본다.
- `other` option이 선택된 question에만 `otherText`를 기록한다.

### 13.4 TextQuestion

값 shape:

```ts
type TextValue = {
  topicValue?: string;
  spaceValue?: string;
  opinionType?: string;
  textValue?: string;
};
```

렌더링 모드:

- plain text: category selector 없이 input/textarea만 렌더링한다.
- short text: `config.textMode === 'short'` 또는 `config.multiline === false`이면 한 줄 input을 렌더링한다.
- long text: 기본값은 textarea다.
- select text: `config.requiresOpinionType === true`, `config.textMode === 'select_text'`, 또는 opinion option 배열이 있으면 opinion radio group을 먼저 렌더링한다.

opinion option source 우선순위:

```text
config.opinionTypes
→ config.textCategories
→ config.categoryOptions
→ config.opinionOptions
→ config.options
→ default 불편/개선/칭찬/문의/기타
```

저장 매핑:

```text
answer_type = text
text_value = textValue
value_json.topic_value = topicValue
value_json.space_value = spaceValue
value_json.opinion_type = opinionType
```

### 13.5 RankingQuestion

값 shape:

```ts
type RankingValue = {
  rankedOptions?: Array<{ rank: number; optionValue: string }>;
};
```

렌더링:

- 드래그가 아니라 tap-to-rank 방식이다.
- 선택하지 않은 option은 `-`, 선택된 option은 `n순위`로 표시한다.
- 이미 선택된 option을 다시 누르면 제거하고 rank를 재정렬한다.
- `validation.maxSelections` 또는 `config.maxSelections`를 max rank로 사용하고 기본값은 3이다.

저장 매핑:

```json
{
  "rankedOptions": [
    { "rank": 1, "optionValue": "room_assignment" },
    { "rank": 2, "optionValue": "rc_event" }
  ]
}
```

### 13.6 ImageTagQuestion

태깅 플로우:

```text
이미지 로드
→ 이미지 표시 영역 측정
→ 사용자가 스티커를 드래그해 drop한 좌표 수집
→ x_ratio/y_ratio 계산
→ tag_type 선택
→ severity 선택
→ text 입력
→ form value에 추가
```

좌표 계산:

```ts
xRatio = (clientX - imageRect.left) / imageRect.width;
yRatio = (clientY - imageRect.top) / imageRect.height;
```

저장 매핑:

```text
answer_type = image_tag
asset_id = question.config.assetId
x_ratio = xRatio
y_ratio = yRatio
tag_type = selectedTagType
severity = selectedSeverity
text_value = comment
```

UI state:

```ts
type ImageTagValue = {
  points?: ImageTagPoint[];
};

type ImageTagEditor = {
  index: number | null;
  point: ImageTagPoint;
  error?: string;
};
```

구현 규칙:

- asset은 `question.config.assetId`와 일치하는 asset을 먼저 사용하고, 없으면 question/section asset fallback을 사용한다.
- asset URL은 `useAssetUrlQuery`로 signed URL을 받아 렌더링한다.
- 신규 위치는 52px drag source를 pointer capture로 드래그해 이미지 위에 drop한다.
- drop 좌표가 이미지 rect 밖이면 editor를 열지 않는다.
- drop 좌표가 이미지 rect 안이면 `calculateImageRatio`로 0..1 비율을 계산하고 editor를 연다.
- 기존 pin은 `xRatio * 100%`, `yRatio * 100%`로 재렌더링한다.
- 첫 태그 전에는 `useStickerHintMotion`으로 원래 스티커 위치에서 이미지 중심으로 이동하는 hint를 표시한다.
- drag 중, editor open 중, 또는 points가 하나 이상이면 hint를 숨긴다.
- 저장 시 tag text가 비어 있으면 `이유를 짧게 적어주세요.` 오류를 표시한다.

### 13.7 ParticipantImageTagQuestion

참여자 업로드 이미지 위에 위치를 표시하는 문항이다.

값 shape:

```ts
type ParticipantImageTagValue = {
  image?: {
    storageBucket: string;
    storagePath: string;
    signedUrl?: string;
    metadata?: Record<string, unknown>;
  };
  points?: ParticipantImageTagPoint[];
};
```

렌더링/저장:

- file input은 styled label 안에 숨긴다.
- 기본 accept는 `image/*`이고 `config.acceptedMimeTypes`로 제한할 수 있다.
- 기본 max file size는 10MB이고 `config.maxFileSizeMb`로 변경할 수 있다.
- 파일 검증 실패 시 즉시 participant-friendly error를 표시한다.
- 업로드 성공 시 image metadata를 form value에 저장하고 기존 points는 비운다.
- 업로드된 이미지는 asset-like object로 변환해 signed URL을 조회한다.
- 위치 선택 UX는 `ImageTagQuestion`과 동일한 drag sticker/editor 패턴을 사용한다.
- `validation.requiredTagText` 또는 `config.requireText`가 true일 때만 tag text를 필수로 본다.

저장 매핑:

```text
answer_type = participant_image_tag
x_ratio/y_ratio = point ratio
tag_type = selectedTagType
severity = selectedSeverity
text_value = comment when present
value_json.participantImage.storageBucket = uploaded storage bucket
value_json.participantImage.storagePath = uploaded storage path
value_json.tagIndex = 1-based point index
```

### 13.8 AttentionCheckQuestion

렌더링:

- configured options를 button list로 렌더링한다.
- 제출 매핑 시 `validateAttentionCheck`로 expected/actual/passed를 `value_json`에 저장한다.

저장 매핑:

```text
answer_type = attention_check
choice_value 또는 score_value = actual value
value_json.expectedValue = expected value
value_json.actualValue = actual value
value_json.passed = boolean
```

---

## 14. Validation 설계

Zod schema는 question type별로 둔다.

```text
answerSchema.ts
- profileAnswerSchema
- scaleAnswerSchema
- singleChoiceAnswerSchema
- multiSelectAnswerSchema
- rankingAnswerSchema
- textAnswerSchema
- imageTagAnswerSchema
- participantImageTagAnswerSchema
- attentionCheckAnswerSchema
```

### 14.1 공통 검증

```text
- required 문항 응답 여부
- scale 점수 범위
- multi_select 최소/최대 선택 수
- ranking 중복 선택 방지
- image_tag 최대 태그 수
- image_tag 좌표 0~1 범위
- participant_image_tag 업로드 이미지 존재 및 좌표 0~1 범위
- text 최소 글자 수
- select_text 의견 유형 필수 여부
- attention_check 기대값 일치 여부
```

### 14.2 Submit 전 검증

```text
- 모든 required 질문 통과
- 기본 정보 컬럼 추출 가능
- image_tag answer의 asset_id 존재
- participant_image_tag answer의 participantImage storage 정보 존재
- attention_check 실패 응답 표시 또는 제출 차단 정책 적용
- duplicate submission query 통과
```

---

## 15. 제출 Payload 설계

Controller가 받는 command:

```ts
export type SubmissionCommand = Readonly<{
  surveyId: string;
  participantUserId: string;
  participantEmail: string;
  locale: 'ko' | 'en';
  startedAt?: string;
  profile: {
    gender?: string;
    semesterGroup?: string;
    department?: string;
    rc?: string;
    dormitory?: string;
    roomType?: string;
    dormExperience?: string;
    extra?: Record<string, unknown>;
  };
  answers: AnswerInput[];
  rawPayload: Record<string, unknown>;
}>;
```

`responses` insert payload:

```ts
{
  survey_id: command.surveyId,
  participant_user_id: command.participantUserId,
  participant_email: command.participantEmail.toLowerCase(),
  status: 'submitted',
  locale: command.locale,
  gender: command.profile.gender,
  semester_group: command.profile.semesterGroup,
  department: command.profile.department,
  rc: command.profile.rc,
  dormitory: command.profile.dormitory,
  room_type: command.profile.roomType,
  dorm_experience: command.profile.dormExperience,
  profile_json: command.profile.extra ?? {},
  raw_payload: command.rawPayload,
  started_at: command.startedAt,
  submitted_at: new Date().toISOString(),
}
```

`answers` insert payload는 각 `AnswerInput`을 mapper에서 변환한다.

---

## 16. 중복 제출 방지

DB는 다음 unique index를 가진다.

```sql
create unique index uniq_submitted_response_per_user
on public.responses (survey_id, participant_user_id)
where status = 'submitted';
```

프론트 흐름:

```text
1. 로그인 후 duplicate query 실행
2. 이미 submitted response가 있으면 AlreadySubmittedPage 표시
3. submit 시 unique violation이 발생하면 AlreadySubmittedPage로 이동
```

---

## 17. 접근 제어 및 보안

### 17.1 참여자 접근 조건

```text
- authenticated user
- survey.status = published
```

### 17.2 RLS 기대 동작

```text
surveys:
- published survey만 select 가능

survey_sections/questions/survey_assets:
- published survey에 속한 row만 select 가능

responses:
- 자기 response만 insert/select 가능

answers:
- 자기 response에 속한 answer만 insert/select 가능
```

View guard는 survey 조회, published 상태, session 존재, duplicate submission 순서로 분기한다. `/access-denied`는 직접 접근 가능한 시스템 페이지로 유지하되, 현재 참여자 정책의 기본 차단 조건은 survey 상태와 중복 제출이다.

### 17.3 브라우저에 저장하지 말아야 할 것

```text
- Supabase service role key
- access token 원문을 별도 storage에 저장
- 개인정보가 포함된 raw payload를 불필요하게 localStorage에 장기 보관
```

Draft에는 설문 응답 중간값이 저장될 수 있으므로, 민감 문항은 최소화하고 제출 성공 시 즉시 삭제한다.

---

## 18. Storage 이미지 로딩

참여자는 image_tag 질문에 연결된 asset을 조회하고 이미지를 표시한다.

흐름:

```text
questions.config.assetId
→ survey_assets row 조회
→ ParticipantApiGateway.createSignedAssetUrl(bucket, path)
→ 이미지 표시
```

private bucket을 사용하는 경우 signed URL을 사용한다.
현재 `survey-assets` bucket은 private이며, `storage.objects` select policy는 `survey_assets.storage_bucket/storage_path`와 published survey 연결을 기준으로 허용된다.

이미지 표시 실패 시:

```text
- retry 버튼 표시
- 이미지 없이 제출 불가
- 관리자에게 문의 문구 표시
```

---

## 19. Error Handling

```ts
export type ParticipantApiErrorCode =
  | 'UNAUTHENTICATED'
  | 'SURVEY_NOT_FOUND'
  | 'SURVEY_CLOSED'
  | 'ALREADY_SUBMITTED'
  | 'VALIDATION_FAILED'
  | 'SUBMISSION_FAILED'
  | 'ASSET_LOAD_FAILED'
  | 'DRAFT_RESTORE_FAILED'
  | 'UNKNOWN';
```

처리 원칙:

```text
- Gateway는 Supabase error를 ParticipantApiError로 변환한다.
- Controller는 사용자 흐름 기준으로 에러를 분기한다.
- View는 route 이동 또는 inline message로 표시한다.
```

---

## 20. 테스트 전략

## 20.1 Unit Test

```text
ParticipantPayloadMapper
- survey bundle row → PublicSurvey 변환
- survey title/description 단일 컬럼과 section/question title_ko/title_en → LocalizedText 변환
- form values → response payload 변환
- form values → answer payload 배열 변환
- image_tag value → x_ratio/y_ratio payload 변환
- participant_image_tag value → participantImage + x_ratio/y_ratio payload 변환

Validation
- required question validation
- multi_select min/max validation
- multi_select displayGroup required validation
- ranking duplicate validation
- image_tag coordinate validation
- participant_image_tag upload/coordinate validation
- text short/select_text validation
- attention_check validation

Draft
- draft key 생성
- draft save/load/delete
- schemaVersion mismatch 처리
```

```text
Question Rendering Utils
- buildQuestionScreens: image_tag/participant_image_tag 독립 screen 분리
- buildQuestionScreens: non-image 질문은 연속 screen으로 병합
- buildQuestionRenderBlocks: scale displayGroup 그룹화
- buildQuestionRenderBlocks: multi_select displayGroup 그룹화
- getQuestionRenderBlockId: group/question id 안정성
```

## 20.2 Component Test

```text
- SurveyIntroPage 렌더링
- SurveySectionPage section header/하단 이동 표시
- SurveySectionPage 현재 screen required 누락 시 이동 차단
- SurveySectionPage image_tag screen 분리
- ScaleQuestion 점수 선택
- ScaleQuestionGroup accordion/answered count/missing expansion
- SingleChoiceQuestion radio 선택
- MultiSelectQuestion 선택 개수 제한
- MultiSelectQuestionGroup checkbox flattening/min/max/otherText
- RankingQuestion 중복 선택 방지
- TextQuestion plain text/short text/select_text 렌더링
- ImageTagQuestion 좌표 표시
- ImageTagQuestion drag sticker/drop/editor/save/delete
- ParticipantImageTagQuestion upload validation/위치 표시
- DraftRestoreBanner 복구/삭제
- SurveyReviewPage 누락 응답 표시
```

## 20.3 Integration Test

fakeParticipantApiController를 사용한다.

```text
- publicSlug로 survey 조회
- 로그인 전 login page 표시
- Google session이 있으면 참여 가능
- already submitted이면 complete/blocked page 표시
- 섹션별 입력 후 draft 저장
- draft 복구 후 review 이동
- 제출 성공 시 draft 삭제
```

## 20.4 E2E Test

Playwright 기준:

```text
1. 공개 URL 접속
2. Google login mock
3. 설문 intro 확인
4. 기본 정보 입력
5. 섹션별 scale 응답
6. 이미지 태깅 입력
7. 주관식 입력
8. review 확인
9. submit
10. complete page 확인
11. 재접속 시 already submitted page 확인
```

## 20.5 Database Policy Test

Supabase local 또는 staging project에서 검증한다.

```text
- 인증되지 않은 사용자는 보호된 survey response 영역 접근 불가
- participant는 draft survey select 불가
- participant는 다른 사용자의 response select 불가
- participant는 다른 사용자의 response_id로 answers insert 불가
- duplicate submitted response insert 실패
```

---

## 21. 구현 순서

### Phase 1. Public Survey Read

```text
- ParticipantApiGateway 구현
- ParticipantPayloadMapper 구현
- publicSlug 조회
- sections/questions/assets bundle 조회
- locale 렌더링
```

### Phase 2. Auth / Access

```text
- Supabase Google Auth 연결
- session hydration 후 intro 이후 route 접근 허용
- access denied / closed / not found routing
- duplicate submission query
```

### Phase 3. Survey Rendering

```text
- QuestionRenderer
- buildQuestionScreens / buildQuestionRenderBlocks
- scale/single/multi/ranking/text/image_tag/participant_image_tag 컴포넌트
- scale_group / multi_select_group 렌더링
- section navigation과 current screen validation
```

### Phase 4. Draft Cache

```text
- localStorageDraftStorage
- draft key
- debounce save
- restore banner
- submit success delete
```

### Phase 5. Submission

```text
- response insert + answer bulk insert
- submit_survey_response RPC가 배포되면 gateway optional method로 전환
- unique violation 처리
- complete page
```

### Phase 6. Hardening

```text
- image signed URL 처리
- RLS staging test
- E2E test
- edge case handling
```

---

## 22. References

- Supabase Data REST API: https://supabase.com/docs/guides/api
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Storage Access Control: https://supabase.com/docs/guides/storage/security/access-control
- Supabase Google Login: https://supabase.com/docs/guides/auth/social-login/auth-google
