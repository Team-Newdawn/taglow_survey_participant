export type ProfileFieldKey = 'gender' | 'semesterGroup' | 'department' | 'rc' | 'dormitory' | 'roomType' | 'dormExperience';

type ProfileQuestionDescriptor = {
  questionKey: string;
  title?: {
    ko?: string;
    en?: string;
  };
  config?: Record<string, unknown>;
};

export const profileFieldKeys: ProfileFieldKey[] = ['gender', 'semesterGroup', 'department', 'rc', 'dormitory', 'roomType', 'dormExperience'];

const profileFieldAliases: Record<ProfileFieldKey, string[]> = {
  gender: ['gender', 'sex', '성별'],
  semesterGroup: ['semester', 'semester_group', 'semesterGroup', '학기'],
  department: ['department', 'major', 'school_department', '학부'],
  rc: ['rc', 'residential_college', 'residentialCollege', '소속 rc'],
  dormitory: ['dormitory', 'dorm', 'residence_hall', '거주 생활관', '생활관'],
  roomType: ['room_type', 'roomType', 'room', '인실'],
  dormExperience: ['dorm_experience', 'dormExperience', 'dormitory_experience', 'residence_experience', '생활관 거주 경험', '거주 경험'],
};

const profileConfigKeys = ['profileField', 'profile_field', 'fieldKey', 'field_key', 'field', 'responseColumn', 'response_column'];

export function resolveProfileFieldKey(question: ProfileQuestionDescriptor): ProfileFieldKey | undefined {
  for (const configKey of profileConfigKeys) {
    const resolved = normalizeProfileFieldKey(question.config?.[configKey]);

    if (resolved) {
      return resolved;
    }
  }

  return normalizeProfileFieldKey(question.questionKey) ?? normalizeProfileFieldKey(question.title?.ko) ?? normalizeProfileFieldKey(question.title?.en);
}

/**
 * Resolves a stable identifier for a profile question's field. Returns the canonical
 * `ProfileFieldKey` when the field maps to a known response column, otherwise the raw
 * configured `profileField` (e.g. `student_number`, `name`) so DB-defined profile
 * questions are preserved instead of being dropped or treated as a composite question.
 */
export function resolveProfileFieldId(question: ProfileQuestionDescriptor): string | undefined {
  const canonical = resolveProfileFieldKey(question);
  if (canonical) {
    return canonical;
  }

  for (const configKey of profileConfigKeys) {
    const raw = question.config?.[configKey];
    if (typeof raw === 'string' && raw.trim().length > 0) {
      return normalizeProfileFieldString(raw);
    }
  }

  return undefined;
}

export function normalizeProfileFieldKey(value: unknown): ProfileFieldKey | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalizedValue = normalizeProfileFieldString(value);
  return Object.entries(profileFieldAliases).find(([, aliases]) => aliases.map(normalizeProfileFieldString).includes(normalizedValue))?.[0] as
    | ProfileFieldKey
    | undefined;
}

export function normalizeProfileRecord(record: Record<string, unknown>): Record<string, unknown> {
  return Object.entries(record).reduce<Record<string, unknown>>((normalized, [key, value]) => {
    const fieldKey = normalizeProfileFieldKey(key);
    normalized[fieldKey ?? key] = value;
    return normalized;
  }, {});
}

function normalizeProfileFieldString(value: string): string {
  return value.trim().toLowerCase();
}
