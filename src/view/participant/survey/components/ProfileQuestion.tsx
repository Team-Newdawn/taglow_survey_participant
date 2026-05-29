import { Select } from '../../../../components/Select';
import { normalizeProfileRecord, resolveProfileFieldKey, type ProfileFieldKey } from '../../../../utils/profileFields';
import { QuestionShell } from './QuestionShell';
import type { QuestionComponentProps } from './questionComponentTypes';
import { getDisplayOptions } from './questionOptions';
import './css/ProfileQuestion.css';

type ProfileValue = Partial<Record<ProfileFieldKey, string>>;

type ProfileFieldGroup = {
  key: ProfileFieldKey;
  label: string;
  options: Array<{ value: string; label: string }>;
};

const fieldGroups: ProfileFieldGroup[] = [
  {
    key: 'gender',
    label: '성별',
    options: [
      { value: 'female', label: '여성' },
      { value: 'male', label: '남성' },
      { value: 'no_answer', label: '응답하지 않음' },
    ],
  },
  {
    key: 'semesterGroup',
    label: '학기',
    options: [
      { value: '1_2', label: '1~2학기' },
      { value: '3_4', label: '3~4학기' },
      { value: '5_6', label: '5~6학기' },
      { value: '7_plus', label: '7학기 이상' },
    ],
  },
  {
    key: 'department',
    label: '학부',
    options: [
      { value: 'global_leadership', label: '글로벌리더십학부' },
      { value: 'computer_science', label: '전산전자공학부' },
      { value: 'counseling_psychology', label: '상담심리사회복지학부' },
      { value: 'management_economics', label: '경영경제학부' },
      { value: 'other', label: '기타' },
    ],
  },
  {
    key: 'rc',
    label: '소속 RC',
    options: [
      { value: 'torrey', label: '토레이' },
      { value: 'janggiri', label: '장기려' },
      { value: 'sonyangwon', label: '손양원' },
      { value: 'kuyper', label: '카이퍼' },
      { value: 'other', label: '기타' },
    ],
  },
  {
    key: 'dormitory',
    label: '거주 생활관',
    options: [
      { value: 'dorm_1', label: '1생활관' },
      { value: 'dorm_2', label: '2생활관' },
      { value: 'dorm_3', label: '3생활관' },
      { value: 'dorm_4', label: '4생활관' },
      { value: 'other', label: '기타' },
    ],
  },
  {
    key: 'roomType',
    label: '인실',
    options: [
      { value: '2_person', label: '2인실' },
      { value: '3_person', label: '3인실' },
      { value: '4_person', label: '4인실' },
      { value: 'other', label: '기타' },
    ],
  },
  {
    key: 'dormExperience',
    label: '생활관 거주 경험',
    options: [
      { value: 'first_semester', label: '첫 학기' },
      { value: '1_year', label: '1년 이내' },
      { value: '2_years', label: '2년 이내' },
      { value: '3_plus_years', label: '3년 이상' },
    ],
  },
];

export function ProfileQuestion(props: QuestionComponentProps<unknown>) {
  const value = readProfileValue(props.value);
  const profileFieldKey = resolveProfileFieldKey(props.question);
  const fields = profileFieldKey ? fieldGroups.filter((field) => field.key === profileFieldKey) : fieldGroups;
  const configuredOptions = getDisplayOptions(props.question, props.locale, props.fallbackLocale);

  return (
    <QuestionShell question={props.question} locale={props.locale} fallbackLocale={props.fallbackLocale} error={props.error} number={props.number}>
      <div className="profile-question">
        {fields.map((field) => (
          <Select
            key={field.key}
            label={field.label}
            options={profileFieldKey && configuredOptions.length > 0 ? configuredOptions : field.options}
            value={value[field.key] ?? ''}
            onChange={(event) => props.onChange({ ...value, [field.key]: event.target.value })}
          />
        ))}
      </div>
    </QuestionShell>
  );
}

function readProfileValue(value: unknown): ProfileValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (normalizeProfileRecord(value as Record<string, unknown>) as ProfileValue) : {};
}
