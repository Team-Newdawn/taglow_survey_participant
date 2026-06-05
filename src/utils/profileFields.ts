export type ProfileFieldKey = 'gender' | 'semesterGroup' | 'department' | 'rc' | 'dormitory' | 'roomType' | 'dormExperience';

type ProfileQuestionDescriptor = {
  questionKey: string;
  config?: Record<string, unknown>;
};

export const profileFieldKeys: ProfileFieldKey[] = ['gender', 'semesterGroup', 'department', 'rc', 'dormitory', 'roomType', 'dormExperience'];

const profileFieldAliases: Record<ProfileFieldKey, string[]> = {
  gender: ['gender', 'sex'],
  semesterGroup: ['semester', 'semester_group', 'semesterGroup'],
  department: ['department', 'major', 'school_department'],
  rc: ['rc', 'residential_college', 'residentialCollege'],
  dormitory: ['dormitory', 'dorm', 'residence_hall'],
  roomType: ['room_type', 'roomType', 'room'],
  dormExperience: ['dorm_experience', 'dormExperience', 'dormitory_experience', 'residence_experience'],
};

const profileConfigKeys = ['profileField', 'profile_field', 'fieldKey', 'field_key', 'field', 'responseColumn', 'response_column'];

export function resolveProfileFieldKey(question: ProfileQuestionDescriptor): ProfileFieldKey | undefined {
  for (const configKey of profileConfigKeys) {
    const resolved = normalizeProfileFieldKey(question.config?.[configKey]);

    if (resolved) {
      return resolved;
    }
  }

  return normalizeProfileFieldKey(question.questionKey);
}

export function normalizeProfileFieldKey(value: unknown): ProfileFieldKey | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  return Object.entries(profileFieldAliases).find(([, aliases]) => aliases.includes(value))?.[0] as ProfileFieldKey | undefined;
}

export function normalizeProfileRecord(record: Record<string, unknown>): Record<string, unknown> {
  return Object.entries(record).reduce<Record<string, unknown>>((normalized, [key, value]) => {
    const fieldKey = normalizeProfileFieldKey(key);
    normalized[fieldKey ?? key] = value;
    return normalized;
  }, {});
}
