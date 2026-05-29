import type { PropsWithChildren } from 'react';

import type { Locale, PublicQuestion } from '../../../../api/participant';
import { readLocalizedText } from '../../../../utils/i18nText';
import './css/QuestionShell.css';

type QuestionShellProps = PropsWithChildren<{
  question: PublicQuestion;
  locale: Locale;
  fallbackLocale: Locale;
  error?: string;
  number?: number;
}>;

export function QuestionShell({ question, locale, fallbackLocale, error, number, children }: QuestionShellProps) {
  const title = readLocalizedText(question.title, locale, fallbackLocale);
  const headingLabel = `${typeof number === 'number' ? `${number}. ` : ''}${title}${question.isRequired ? ' 필수' : ''}`;

  return (
    <section className="question-shell" aria-labelledby={`${question.id}-title`}>
      <div className="question-shell__header">
        <h2 id={`${question.id}-title`} aria-label={headingLabel}>
          {typeof number === 'number' ? <span className="question-shell__number">{number}.</span> : null}
          <span className="question-shell__title-text">
            {title}
            {question.isRequired ? <span aria-label="필수"> *</span> : null}
          </span>
        </h2>
        {question.description ? <p>{readLocalizedText(question.description, locale, fallbackLocale)}</p> : null}
      </div>
      {children}
      {error ? <p className="question-shell__error">{error}</p> : null}
    </section>
  );
}
