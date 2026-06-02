import type { FormEvent } from 'react';
import { useId, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useServiceFeedbackMutation } from '../../../../api/participant';
import newdawnDomunionLogoUrl from '../../../../assets/logo_newdawn_domunion.svg';
import { Button, ButtonLink } from '../../../../components/Button';
import { Message } from '../../../../components/Message';
import { useParticipantLocaleStore } from '../../../../store/participantLocaleStore';
import { getSurveyLocaleCopy } from '../surveyLocaleCopy';
import './css/SurveyCompletePage.css';

export function SurveyCompletePage() {
  const { publicSlug = '' } = useParams();
  const { locale } = useParticipantLocaleStore();
  const copy = getSurveyLocaleCopy(locale ?? 'ko');
  const feedbackFieldId = useId();
  const feedbackStatusId = useId();
  const feedbackMutation = useServiceFeedbackMutation();
  const [feedbackText, setFeedbackText] = useState('');
  const normalizedFeedbackText = feedbackText.trim();

  const submitFeedback = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!normalizedFeedbackText || feedbackMutation.isPending) {
      return;
    }

    try {
      await feedbackMutation.mutateAsync({
        publicSlug,
        locale: locale ?? 'ko',
        feedbackText: normalizedFeedbackText,
      });
      setFeedbackText('');
    } catch {
      // The completion page remains usable; the inline status lets participants retry.
    }
  };

  return (
    <main className="survey-complete-page">
      <header className="survey-complete-page__header">
        <p className="survey-complete-page__eyebrow">{copy.completeEyebrow}</p>
        <img src={newdawnDomunionLogoUrl} alt="Newdawn Domunion" className="survey-complete-page__partner-logo" />
      </header>

      <section className="survey-complete-page__content">
        <h1>{copy.completeTitle}</h1>
        <p>{copy.completeDescription}</p>
        <Message tone="success" title={copy.completeThanksTitle}>
          <p>{copy.completeContactDescription}</p>
        </Message>
        <form className="survey-complete-page__feedback" onSubmit={submitFeedback}>
          <p className="survey-complete-page__feedback-title">{copy.serviceFeedbackTitle}</p>
          <label className="survey-complete-page__feedback-label" htmlFor={feedbackFieldId}>
            {copy.serviceFeedbackLabel}
          </label>
          <textarea
            id={feedbackFieldId}
            className="survey-complete-page__feedback-field"
            value={feedbackText}
            maxLength={2000}
            rows={4}
            placeholder={copy.serviceFeedbackPlaceholder}
            aria-describedby={feedbackStatusId}
            onChange={(event) => setFeedbackText(event.target.value)}
          />
          <p
            id={feedbackStatusId}
            className={[
              'survey-complete-page__feedback-status',
              feedbackMutation.isError ? 'survey-complete-page__feedback-status--error' : '',
              feedbackMutation.isSuccess ? 'survey-complete-page__feedback-status--success' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            role={feedbackMutation.isError ? 'alert' : 'status'}
          >
            {feedbackMutation.isSuccess
              ? copy.serviceFeedbackSuccess
              : feedbackMutation.isError
                ? copy.serviceFeedbackError
                : null}
          </p>
          <Button type="submit" variant="secondary" fullWidth disabled={!normalizedFeedbackText || feedbackMutation.isPending}>
            {feedbackMutation.isPending ? copy.serviceFeedbackSubmitting : copy.serviceFeedbackSubmit}
          </Button>
        </form>
        <ButtonLink variant="secondary" href={`/survey/${publicSlug}`}>
          {copy.backToIntro}
        </ButtonLink>
      </section>
    </main>
  );
}
