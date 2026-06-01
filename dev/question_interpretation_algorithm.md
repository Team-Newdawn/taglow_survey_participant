# 질문 해석 및 적용 알고리즘

이 문서는 참여자 화면에서 관리자 질문 데이터가 어떻게 해석되고, 화면에 적용되고, 최종 제출 payload로 변환되는지 정리한다.

기준 구현:

- `src/api/participant/service/mapper/participantPayloadMapper.ts`
- `src/view/participant/survey/SurveySectionPage.tsx`
- `src/view/participant/survey/useQuestionScreens.ts`
- `src/view/participant/survey/components/QuestionRenderer.tsx`
- `src/view/participant/survey/components/questionRenderBlocks.ts`
- `src/utils/answerNormalizer.ts`
- `src/api/participant/service/validation/branchEvaluator.ts`
- `src/api/participant/service/validation/answerSchema.ts`

## 1. 전체 흐름

```text
Supabase raw rows
→ ParticipantPayloadMapper
→ PublicSurvey / PublicSurveySection / PublicQuestion
→ getAnswerSections()
→ useQuestionScreens()
→ buildQuestionRenderBlocks()
→ QuestionRenderer
→ React Hook Form values
→ draft autosave
→ findMissingRequiredQuestions()
→ buildSubmissionAnswers()
→ ParticipantPayloadMapper.toSubmitSurveyPayload()
→ responses + answers 저장
```

핵심 원칙은 다음과 같다.

- 화면은 Supabase row나 table name을 직접 해석하지 않는다.
- 질문 표시값은 `LocalizedText`로 렌더링하되, 답변 저장값은 번역 라벨이 아니라 stable value를 사용한다.
- 참여자 입력 중 상태는 React Hook Form이 소유한다.
- draft는 React Hook Form 값을 그대로 저장하되, 최종 제출 전까지 서버에 보내지 않는다.
- 최종 제출 시 `responses` 1개와 `answers` 여러 개로 나뉜다.

## 2. Raw 질문을 도메인 질문으로 바꾸는 단계

`ParticipantPayloadMapper.toPublicSurvey()`가 raw survey bundle을 앱 도메인 모델로 바꾼다.

### 2.1 섹션 정렬

```text
raw sections
→ order_index 기준 정렬
→ PublicSurveySection[]
```

각 섹션은 자기 섹션에 속한 질문 목록을 가진다.

```ts
section.questions = questionsBySectionId.get(section.id).sort(byOrderIndex)
```

### 2.2 질문 정규화

raw question row는 `PublicQuestion`으로 바뀐다.

중요 필드:

| 도메인 필드 | 의미 |
| --- | --- |
| `id` | form/draft/submission에서 사용하는 질문 식별자 |
| `questionKey` | 관리자/분석용 stable key |
| `questionType` | 렌더러 선택 기준 |
| `title`, `description` | `ko`, `en` 다국어 텍스트 |
| `isRequired` | 필수 응답 여부 |
| `metricType` | 분석용 metric: `none`, `satisfaction`, `importance`, `experience` |
| `topicKey`, `spaceKey` | 분석용 topic/space key |
| `config` | 질문 타입별 설정 |
| `validation` | 검증 설정 |

`config.options`, `config.choices`, `config.items`는 모두 `QuestionOption[]`으로 정규화된다.

```text
string option
→ { value: option, label: { ko: option } }

object option
→ value/id/key/code/optionValue 중 하나를 value로 사용
→ label, labelKo, labelEn 등을 LocalizedText로 정규화
```

## 3. 응답 대상 섹션 계산

참여자가 실제로 답해야 하는 섹션은 `getAnswerSections()`로 계산한다.

```text
survey.sections
→ sectionType === "intro" 또는 sectionKey === "intro" 제외
→ answerSections
```

이 기준은 다음 화면에서 공통으로 사용한다.

- Intro: 진행할 섹션 목록
- Section: 현재/이전/다음 섹션과 진행률
- Review: 검토 대상 섹션과 누락 문항 계산

즉, 안내 섹션은 설문 설명에는 쓰일 수 있지만 진행률과 제출 검토에는 포함하지 않는다.

## 4. 조건부 질문 표시 알고리즘

`useQuestionScreens()`는 먼저 현재 섹션 질문 중 표시 가능한 질문만 고른다.

```ts
visibleQuestions = section.questions.filter((question) =>
  shouldShowQuestion({ question, values }),
)
```

`shouldShowQuestion()`은 `question.config.branch` 또는 `question.config.visibility`를 읽는다.

지원 구조:

```ts
{
  branch: {
    when: {
      questionKey: string,
      operator: "eq" | "neq" | "in" | "not_in" | "lt" | "lte" | "gt" | "gte",
      value: unknown
    }
  }
}
```

여러 rule이 배열이면 모두 통과해야 표시된다.

```text
branch 없음
→ 표시

branch 있음
→ 모든 when rule 평가
→ 전부 true면 표시
→ 하나라도 false면 숨김
```

연산자 규칙:

| operator | 조건 |
| --- | --- |
| `eq` | actual === expected |
| `neq` | actual !== expected |
| `in` | expected 배열에 actual 포함 |
| `not_in` | expected 배열에 actual 미포함 |
| `lt` | actual < expected |
| `lte` | actual <= expected |
| `gt` | actual > expected |
| `gte` | actual >= expected |

주의: 현재 구현은 `values[rule.questionKey]`를 조회한다. 그런데 섹션 폼은 기본적으로 `question.id`를 key로 저장한다. 따라서 branch config의 `questionKey` 값은 현재 draft key와 일치해야 동작한다. 관리자가 DB의 `question_key`를 넣는 방식으로 고정하려면 `questionKey → question.id` 매핑 단계가 추가로 필요하다.

## 5. 질문 화면 분할 알고리즘

`useQuestionScreens()`는 visible question을 모바일에 맞는 화면 단위로 나눈다.

```text
image_tag / participant_image_tag
→ 한 화면에 하나만 배치

그 외 질문
→ 직전 화면이 이미지 태그 화면이 아니면 같은 화면에 추가
→ 이미지 태그 뒤라면 새 화면 시작
```

목적:

- 이미지/도면 태깅은 집중이 필요한 작업이므로 단독 화면으로 둔다.
- 일반 선택형/척도형 문항은 한 화면에 묶어 피로도를 줄인다.

## 6. 렌더 블록 그룹핑 알고리즘

한 화면 안의 질문은 다시 `buildQuestionRenderBlocks()`에서 렌더 블록으로 바뀐다.

### 6.1 scale group

연속된 `scale` 질문들이 같은 `config.displayGroup`을 가지면 하나의 `scale_group`으로 묶는다.

조건:

```text
questionType === "scale"
AND config.displayGroup이 비어 있지 않음
AND 같은 displayGroup을 가진 질문이 연속해서 2개 이상
```

영어 그룹 제목은 다음 순서로 찾는다.

```text
config.displayGroupEn
→ config.groupTitleEn
→ config.display_group_en
```

### 6.2 multi_select group

연속된 `multi_select` 질문들이 같은 `config.displayGroup`을 가지면 하나의 `multi_select_group`으로 묶는다.

조건:

```text
questionType === "multi_select"
AND config.displayGroup이 비어 있지 않음
AND 같은 displayGroup을 가진 질문이 연속해서 2개 이상
```

중요: 그룹핑은 “연속된 질문”만 묶는다. 같은 displayGroup이라도 사이에 다른 질문이 끼면 다른 블록으로 처리된다.

## 7. 렌더러 선택 알고리즘

`QuestionRenderer`는 `question.questionType`으로 컴포넌트를 선택한다.

| questionType | component |
| --- | --- |
| `profile` | `ProfileQuestion` |
| `experience` | `ExperienceQuestion` |
| `scale` | `ScaleQuestion` |
| `single_choice` | `SingleChoiceQuestion` |
| `multi_select` | `MultiSelectQuestion` |
| `ranking` | `RankingQuestion` |
| `text` | `TextQuestion` |
| `image_tag` | `ImageTagQuestion` |
| `participant_image_tag` | `ParticipantImageTagQuestion` |
| `attention_check` | `AttentionCheckQuestion` |

알 수 없는 타입은 현재 fallback으로 `TextQuestion`을 렌더링한다. 새 질문 타입을 추가할 때는 fallback에 기대지 말고 model, renderer, normalizer, validation, tests를 함께 수정해야 한다.

## 8. form value shape

React Hook Form의 key는 기본적으로 `question.id`다.

```ts
form.setValue(question.id, value)
```

질문 타입별 현재 값 형태는 다음처럼 해석된다.

| 타입 | form value |
| --- | --- |
| `profile` | profile field record 또는 단일 string/number |
| `experience` | `{ experienceStatus, noExperienceReason? }` |
| `scale` | `{ scoreValue, lowScoreReason?, lowScoreText? }` |
| `single_choice` | stable option value string |
| `multi_select` | `{ selectedOptions: string[], otherText? }` |
| `ranking` | `{ rankedOptions: { rank, optionValue }[] }` |
| `text` | `{ textValue, topicValue?, spaceValue?, opinionType? }` |
| `image_tag` | `{ points: ImageTagPoint[] }` |
| `participant_image_tag` | `{ image, points }` |
| `attention_check` | string 또는 number |

## 9. 필수 문항 판정 알고리즘

섹션 이동과 review에서 `findMissingRequiredQuestions()`를 사용한다.

기본 규칙:

```text
question.isRequired === true
AND isAnsweredValue(question, values[question.id]) === false
→ missing
```

타입별 answered 판정:

| 타입 | answered 조건 |
| --- | --- |
| `profile` | profile record 안에 하나 이상의 non-empty string |
| `experience` | `experienceStatus` 존재 |
| `scale` | `scoreValue`가 number로 파싱 가능 |
| `single_choice` | non-empty string 또는 number |
| `attention_check` | non-empty string 또는 number |
| `multi_select` | `selectedOptions.length > 0` |
| `ranking` | `rankedOptions.length > 0` |
| `text` | `textValue` 존재, 필요 시 `opinionType`도 존재 |
| `image_tag` | 유효한 point 1개 이상 |
| `participant_image_tag` | 업로드 이미지 존재 + 유효한 point 1개 이상 |

### 9.1 multi_select group 필수 판정

`config.displayGroup`이 있는 multi_select는 그룹 단위로 판정한다.

```text
같은 displayGroup 질문 모음
→ 하나라도 isRequired면 그룹 필수
→ 모든 질문의 selectedOptions 개수 합산
→ validation/config의 minSelections 또는 minSelect 확인
→ 합산 선택 수가 min보다 작으면 그룹 missing
```

missing에는 그룹의 첫 번째 질문이 대표로 들어간다.

## 10. 낮은 점수 후속 입력

`scale` 답변은 `scoreValue`를 기본 저장값으로 사용한다.

낮은 점수 기준:

```text
question.config.lowScoreThreshold가 number면 그 값 사용
없으면 2
```

최종 normalization 시:

```text
scoreValue <= lowScoreThreshold
→ valueJson.low_score_reason
→ valueJson.low_score_text

scoreValue > lowScoreThreshold
→ low-score valueJson 저장하지 않음
```

현재 `answerNormalizer`는 낮은 점수 후속 입력의 저장 여부를 처리한다. 후속 입력 required 여부는 UI/검증 로직과 함께 맞춰야 한다.

## 11. 이미지/도면 태깅 해석

### 11.1 관리자 이미지 태깅: `image_tag`

asset 선택 우선순위:

```text
question.config.assetId와 일치하는 asset
→ question.id 또는 section.id에 연결된 asset
```

현재 화면에 필요한 asset은 `useAssetUrlsQuery()`로 signed URL을 batch 요청한다.

point가 유효하려면 다음 값이 필요하다.

```text
assetId
xRatio
yRatio
tagType
textValue
```

제출 시 point 하나가 answer row 하나가 된다.

```text
point[]
→ answers[]
```

각 answer row에는 `asset_id`, `x_ratio`, `y_ratio`, `tag_type`, `severity`, `text_value`가 들어간다.

### 11.2 참여자 업로드 이미지 태깅: `participant_image_tag`

참여자가 이미지를 업로드하면 Storage 경로와 metadata가 form value에 저장된다.

유효 조건:

```text
image.storageBucket
image.storagePath
point.xRatio
point.yRatio
point.tagType
requiredTagText면 point.textValue
```

제출 시 point 하나가 answer row 하나가 되며, 업로드 이미지 정보는 `valueJson.participantImage`에 저장된다.

## 12. 답변 normalization 알고리즘

`buildSubmissionAnswers(survey, values)`가 최종 `AnswerInput[]`을 만든다.

```text
survey.sections
→ section.questions
→ normalizeAnswerInput(question, values[question.id])
→ sectionId, surveyId 추가
→ AnswerInput[]
```

타입별 저장 방식:

| 타입 | 저장 방식 |
| --- | --- |
| `profile` | `valueJson`에 profile record 저장 |
| `experience` | `valueJson`에 experience record 저장 |
| `scale` | `scoreValue`, 낮은 점수면 low-score metadata |
| `single_choice` | `choiceValue` |
| `multi_select` | `valueJson.selectedOptions`, `valueJson.otherText` |
| `ranking` | `valueJson.rankedOptions` |
| `text` | `textValue`, topic/space/opinion metadata |
| `image_tag` | point별 answer row 생성 |
| `participant_image_tag` | point별 answer row 생성 + 업로드 이미지 metadata |
| `attention_check` | selected value + `valueJson.passed` |

주의: `SurveyReviewPage`는 제출 답변을 만들 때 `getAnswerSections()`로 intro 섹션을 제외한 survey를 사용한다. 프로필 추출은 전체 survey 기준으로 수행하므로 profile 섹션이 answer section에 있으면 정상 반영된다.

## 13. 최종 저장 payload 변환

`ParticipantPayloadMapper.toCreateResponsePayload()`는 제출 command를 `responses` row로 바꾼다.

저장되는 대표 값:

```text
survey_id
participant_user_id
participant_email
locale
profile columns
profile_json
raw_payload
submitted_at
```

`ParticipantPayloadMapper.toCreateAnswerPayload()`는 `AnswerInput`을 `answers` row로 바꾼다.

저장되는 대표 값:

```text
survey_id
response_id
section_id
question_id
asset_id
answer_type
metric_type
topic_key
space_key
score_value
text_value
choice_value
x_ratio
y_ratio
tag_type
severity
value_json
```

RPC 제출 경로에서는 `toSubmitSurveyPayload()`가 response payload와 answer payload를 하나의 JSON payload로 묶고, 각 answer의 `response_id`는 서버 트랜잭션에서 채울 수 있도록 `null`로 둔다.

## 14. 새 질문 타입 추가 체크리스트

새 `questionType`을 추가할 때는 아래를 함께 수정한다.

1. `src/api/participant/model/question.ts`
2. `src/view/participant/survey/components/QuestionRenderer.tsx`
3. 질문 컴포넌트와 CSS
4. `src/utils/answerNormalizer.ts`
5. `src/api/participant/service/validation/answerSchema.ts`
6. mapper 테스트 또는 normalizer 테스트
7. 필요한 경우 `questionRenderBlocks.ts` 그룹핑 로직
8. 필요한 경우 `useQuestionScreens.ts` 화면 분할 로직
9. Review summary 또는 missing validation

## 15. 현재 구현상 주의점

- branch evaluator는 `values[rule.questionKey]`를 조회하지만 form value는 주로 `question.id`로 저장된다. config 작성 규칙을 통일하거나 매핑 로직을 추가해야 한다.
- 그룹핑은 같은 `displayGroup`이더라도 연속된 질문만 묶는다.
- unknown `questionType`은 현재 `TextQuestion`으로 fallback된다. 운영 안정성을 위해 새 타입 추가 시 exhaustive check 또는 테스트 보강이 필요하다.
- `answerSchema.ts`는 타입별 answer shape를 정의하지만, 모든 제출 경로에서 강제 parse하는 구조는 아니다. 최종 submit 전에 schema 검증을 통합하면 안정성이 올라간다.
- 이미지 좌표는 `0..1` ratio로 저장되어야 한다. 좌표 계산은 `imageRatio` 유틸에서 clamp하고, answer schema도 `0..1` 범위를 검증한다.
