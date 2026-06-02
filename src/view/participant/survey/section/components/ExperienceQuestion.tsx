import { QuestionShell } from './QuestionShell';
import type { QuestionComponentProps } from './questionComponentTypes';
import { getSurveyLocaleCopy } from '../../surveyLocaleCopy';
import { getDefaultOptions, getDisplayOptions } from './questionOptions';
import './css/ExperienceQuestion.css';

type ExperienceValue = {
  experienceStatus?: string;
  noExperienceReason?: string;
};

export function ExperienceQuestion(props: QuestionComponentProps<unknown>) {
  const value = readExperienceValue(props.value);
  const configuredOptions = getDisplayOptions(props.question, props.locale, props.fallbackLocale);
  const options = configuredOptions.length > 0 ? configuredOptions : getDefaultOptions('experience', props.locale);
  const copy = getSurveyLocaleCopy(props.locale);

  return (
    <QuestionShell question={props.question} locale={props.locale} fallbackLocale={props.fallbackLocale} error={props.error} number={props.number}>
      <div className="experience-question">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={value.experienceStatus === option.value ? 'is-selected' : ''}
            onClick={() => props.onChange({ ...value, experienceStatus: option.value })}
          >
            {option.label}
          </button>
        ))}
        {value.experienceStatus && value.experienceStatus !== 'used' ? (
          <label>
            <span>{copy.experienceReasonLabel}</span>
            <input
              value={value.noExperienceReason ?? ''}
              onChange={(event) => props.onChange({ ...value, noExperienceReason: event.target.value })}
            />
          </label>
        ) : null}
      </div>
    </QuestionShell>
  );
}

function readExperienceValue(value: unknown): ExperienceValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as ExperienceValue) : {};
}
