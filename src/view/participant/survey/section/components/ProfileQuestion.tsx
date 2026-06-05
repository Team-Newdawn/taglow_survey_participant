import { Select } from '../../../../../components/Select';
import type { Locale } from '../../../../../api/participant';
import { normalizeProfileRecord, resolveProfileFieldKey, type ProfileFieldKey } from '../../../../../utils/profileFields';
import { QuestionShell } from './QuestionShell';
import type { QuestionComponentProps } from './questionComponentTypes';
import { getDisplayOptions } from './questionOptions';
import './css/ProfileQuestion.css';

type ProfileValue = Partial<Record<ProfileFieldKey, string>>;

type ProfileFieldGroup = {
  key: ProfileFieldKey;
  label: Record<Locale, string>;
  options: Array<{ value: string; label: Record<Locale, string> }>;
};

type ProfileQuestionProps = QuestionComponentProps<unknown> & {
  profileFieldKey?: ProfileFieldKey;
};

const fieldGroups: ProfileFieldGroup[] = [
  {
    key: 'gender',
    label: { ko: '성별', en: 'Gender' },
    options: [
      { value: 'female', label: { ko: '여성', en: 'Female' } },
      { value: 'male', label: { ko: '남성', en: 'Male' } },
      { value: 'no_answer', label: { ko: '응답하지 않음', en: 'Prefer not to answer' } },
    ],
  },
  {
    key: 'semesterGroup',
    label: { ko: '학기', en: 'Semester' },
    options: [
      { value: '1_2', label: { ko: '1~2학기', en: '1-2 semesters' } },
      { value: '3_4', label: { ko: '3~4학기', en: '3-4 semesters' } },
      { value: '5_6', label: { ko: '5~6학기', en: '5-6 semesters' } },
      { value: '7_plus', label: { ko: '7학기 이상', en: '7+ semesters' } },
    ],
  },
  {
    key: 'department',
    label: { ko: '학부', en: 'Department' },
    options: [
      { value: 'global_leadership', label: { ko: '글로벌리더십학부', en: 'Global Leadership' } },
      { value: 'computer_science', label: { ko: '전산전자공학부', en: 'Computer Science and Electrical Engineering' } },
      { value: 'counseling_psychology', label: { ko: '상담심리사회복지학부', en: 'Counseling Psychology and Social Welfare' } },
      { value: 'management_economics', label: { ko: '경영경제학부', en: 'Management and Economics' } },
      { value: 'other', label: { ko: '기타', en: 'Other' } },
    ],
  },
  {
    key: 'rc',
    label: { ko: '소속 RC', en: 'RC' },
    options: [
      { value: 'torrey', label: { ko: '토레이', en: 'Torrey' } },
      { value: 'janggiri', label: { ko: '장기려', en: 'Jang Gi-ryeo' } },
      { value: 'sonyangwon', label: { ko: '손양원', en: 'Son Yang-won' } },
      { value: 'kuyper', label: { ko: '카이퍼', en: 'Kuyper' } },
      { value: 'other', label: { ko: '기타', en: 'Other' } },
    ],
  },
  {
    key: 'dormitory',
    label: { ko: '거주 생활관', en: 'Dormitory' },
    options: [
      { value: 'dorm_1', label: { ko: '1생활관', en: 'Dormitory 1' } },
      { value: 'dorm_2', label: { ko: '2생활관', en: 'Dormitory 2' } },
      { value: 'dorm_3', label: { ko: '3생활관', en: 'Dormitory 3' } },
      { value: 'dorm_4', label: { ko: '4생활관', en: 'Dormitory 4' } },
      { value: 'other', label: { ko: '기타', en: 'Other' } },
    ],
  },
  {
    key: 'roomType',
    label: { ko: '인실', en: 'Room type' },
    options: [
      { value: '2_person', label: { ko: '2인실', en: '2-person room' } },
      { value: '3_person', label: { ko: '3인실', en: '3-person room' } },
      { value: '4_person', label: { ko: '4인실', en: '4-person room' } },
      { value: 'other', label: { ko: '기타', en: 'Other' } },
    ],
  },
  {
    key: 'dormExperience',
    label: { ko: '생활관 거주 경험', en: 'Dormitory experience' },
    options: [
      { value: 'first_semester', label: { ko: '첫 학기', en: 'First semester' } },
      { value: '1_year', label: { ko: '1년 이내', en: 'Within 1 year' } },
      { value: '2_years', label: { ko: '2년 이내', en: 'Within 2 years' } },
      { value: '3_plus_years', label: { ko: '3년 이상', en: '3+ years' } },
    ],
  },
];

export function ProfileQuestion(props: ProfileQuestionProps) {
  const value = readProfileValue(props.value);
  const profileFieldKey = props.profileFieldKey ?? resolveProfileFieldKey(props.question);
  const fields = profileFieldKey ? fieldGroups.filter((field) => field.key === profileFieldKey) : [fieldGroups[0]];
  const displayQuestion = profileFieldKey ? createProfileFieldQuestion(props.question, fields[0]) : props.question;
  const configuredOptions = getDisplayOptions(props.question, props.locale, props.fallbackLocale);

  return (
    <QuestionShell question={displayQuestion} locale={props.locale} fallbackLocale={props.fallbackLocale} error={props.error} number={props.number}>
      <div className="profile-question">
        {fields.map((field) => (
          <Select
            key={field.key}
            label={field.label[props.locale]}
            options={profileFieldKey && configuredOptions.length > 0 ? configuredOptions : localizeOptions(field.options, props.locale)}
            value={value[field.key] ?? ''}
            onChange={(event) => props.onChange({ ...value, [field.key]: event.target.value })}
          />
        ))}
      </div>
    </QuestionShell>
  );
}

function createProfileFieldQuestion(question: QuestionComponentProps['question'], field: ProfileFieldGroup): QuestionComponentProps['question'] {
  return {
    ...question,
    id: `${question.id}-${field.key}`,
    title: field.label,
    description: undefined,
  };
}

function readProfileValue(value: unknown): ProfileValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (normalizeProfileRecord(value as Record<string, unknown>) as ProfileValue) : {};
}

function localizeOptions(options: ProfileFieldGroup['options'], locale: Locale): Array<{ value: string; label: string }> {
  return options.map((option) => ({ value: option.value, label: option.label[locale] }));
}
