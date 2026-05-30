import { useEffect, useId, useState } from 'react';

import type { Locale, PublicQuestion } from '../../../../api/participant';
import { readLocalizedText } from '../../../../utils/i18nText';
import { readLowScoreThreshold, readScaleValue, ScaleQuestionBody } from './ScaleQuestion';
import './css/ScaleQuestionGroup.css';

type ScaleQuestionGroupProps = {
  groupTitle: string;
  questions: PublicQuestion[];
  locale: Locale;
  fallbackLocale: Locale;
  values: Record<string, unknown>;
  missingQuestionIds: string[];
  number?: number;
  onChange: (questionId: string, value: unknown) => void;
};

export function ScaleQuestionGroup(props: ScaleQuestionGroupProps) {
  const titleId = useId();
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const firstMissingQuestionId = props.questions.find((question) => props.missingQuestionIds.includes(question.id))?.id;
  const answeredCount = props.questions.filter((question) => readScaleValue(props.values[question.id]).scoreValue).length;
  const isRequired = props.questions.some((question) => question.isRequired);
  const headingLabel = `${typeof props.number === 'number' ? `${props.number}. ` : ''}${props.groupTitle}${isRequired ? ' 필수' : ''}`;

  useEffect(() => {
    if (firstMissingQuestionId) {
      setExpandedQuestionId(firstMissingQuestionId);
    }
  }, [firstMissingQuestionId]);

  const moveToNextQuestion = (questionId: string) => {
    const currentIndex = props.questions.findIndex((question) => question.id === questionId);
    const nextQuestion = currentIndex >= 0 ? props.questions[currentIndex + 1] : undefined;
    setExpandedQuestionId(nextQuestion?.id ?? null);
  };

  return (
    <section className="scale-question-group" aria-labelledby={titleId}>
      <div className="scale-question-group__header">
        <div>
          <h2 id={titleId} aria-label={headingLabel}>
            {typeof props.number === 'number' ? <span className="scale-question-group__number">{props.number}.</span> : null}
            <span className="scale-question-group__title-text">
              {props.groupTitle}
              {isRequired ? <span aria-label="필수"> *</span> : null}
            </span>
          </h2>
          <p>
            {answeredCount}/{props.questions.length}개 응답
          </p>
        </div>
      </div>

      <div className="scale-question-group__items">
        {props.questions.map((question) => {
          const value = readScaleValue(props.values[question.id]);
          const scoreValue = value.scoreValue;
          const isExpanded = expandedQuestionId === question.id;
          const error = props.missingQuestionIds.includes(question.id) ? '필수 문항입니다.' : undefined;
          const panelId = `${question.id}-scale-panel`;
          const lowScoreThreshold = readLowScoreThreshold(question);

          return (
            <div key={question.id} className={`scale-question-group__item${error ? ' has-error' : ''}`}>
              <button
                type="button"
                className="scale-question-group__summary"
                aria-expanded={isExpanded}
                aria-controls={panelId}
                onClick={() => setExpandedQuestionId(isExpanded ? null : question.id)}
              >
                <span className="scale-question-group__item-title">
                  {readScaleGroupItemLabel(question, props.locale, props.fallbackLocale)}
                  {question.isRequired ? <span aria-label="필수"> *</span> : null}
                </span>
                <span className={scoreValue ? 'scale-question-group__score is-answered' : 'scale-question-group__score'}>
                  {scoreValue ? `${scoreValue}점` : '미응답'}
                </span>
                <span className="scale-question-group__toggle" aria-hidden="true">
                  {isExpanded ? '-' : '+'}
                </span>
              </button>

              {isExpanded ? (
                <div className="scale-question-group__panel" id={panelId}>
                  <ScaleQuestionBody
                    value={value}
                    threshold={lowScoreThreshold}
                    onChange={(nextValue) => props.onChange(question.id, nextValue)}
                    onScoreSelect={(score) => {
                      if (score > lowScoreThreshold) {
                        moveToNextQuestion(question.id);
                      }
                    }}
                  />
                  {error ? <p className="scale-question-group__error">{error}</p> : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function readScaleGroupItemLabel(question: PublicQuestion, locale: Locale, fallbackLocale: Locale): string {
  const localeLabel = readConfigString(question.config, locale === 'en' ? 'displayLabelEn' : 'displayLabelKo');
  const fallbackLabel = readConfigString(question.config, fallbackLocale === 'en' ? 'displayLabelEn' : 'displayLabelKo');
  const sharedLabel = readConfigString(question.config, 'displayLabel');
  const title = readLocalizedText(question.title, locale, fallbackLocale);

  return localeLabel ?? fallbackLabel ?? sharedLabel ?? extractBracketItemLabel(title) ?? title;
}

function readConfigString(config: PublicQuestion['config'], key: string): string | undefined {
  const value = config[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function extractBracketItemLabel(title: string): string | undefined {
  const match = title.match(/\[\s*(?:\(\d+\)\s*)?(.+?)\s*\]\s*$/);
  return match?.[1]?.trim();
}
