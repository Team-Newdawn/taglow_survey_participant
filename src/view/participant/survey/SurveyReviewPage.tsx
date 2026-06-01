import { useNavigate, useParams } from 'react-router-dom';

import {
  ParticipantApiError,
  useParticipantSessionQuery,
  usePublicSurveyQuery,
  useSubmissionMutation,
  useSurveyDraftStorage,
} from '../../../api/participant';
import { Button, ButtonLink } from '../../../components/Button';
import { Message } from '../../../components/Message';
import { useParticipantDraftStore } from '../../../store/participantDraftStore';
import { useParticipantLocaleStore } from '../../../store/participantLocaleStore';
import { useParticipantProgressStore } from '../../../store/participantProgressStore';
import { buildSubmissionAnswers, extractRespondentProfile, findMissingRequiredQuestions } from '../../../utils/answerNormalizer';
import { readLocalizedText, resolveSurveyDefaultLocale } from '../../../utils/i18nText';
import { getOrCreateParticipantDeviceId, markSurveySubmittedOnDevice } from '../../../utils/participantDevice';
import { getAnswerSections } from './surveySections';
import { getSurveyLocaleCopy } from './surveyLocaleCopy';
import './css/SurveyReviewPage.css';

export function SurveyReviewPage() {
  const { publicSlug = '' } = useParams();
  const navigate = useNavigate();
  const surveyQuery = usePublicSurveyQuery(publicSlug);
  const sessionQuery = useParticipantSessionQuery();
  const submitMutation = useSubmissionMutation();
  const survey = surveyQuery.data;
  const session = sessionQuery.data;
  const { values, clearDraftValues } = useParticipantDraftStore();
  const { locale } = useParticipantLocaleStore();
  const { setReviewVisited } = useParticipantProgressStore();
  const draftStorage = useSurveyDraftStorage();
  const defaultLocale = resolveSurveyDefaultLocale(survey);
  const displayLocale = locale ?? defaultLocale;
  const copy = getSurveyLocaleCopy(displayLocale);

  if (!survey || !session) {
    return null;
  }

  const answerSections = getAnswerSections(survey);
  const submissionAnswers = buildSubmissionAnswers({ ...survey, sections: answerSections }, values);
  const missingBySection = answerSections.map((section) => ({
    section,
    missing: findMissingRequiredQuestions(section, values),
  }));
  const missingTotal = missingBySection.reduce((sum, item) => sum + item.missing.length, 0);
  const imageTagCount = Object.values(values).reduce<number>((sum, value) => {
    if (typeof value !== 'object' || value === null || !('points' in value)) {
      return sum;
    }

    const points = (value as { points?: unknown }).points;
    return sum + (Array.isArray(points) ? points.length : 0);
  }, 0);

  const submit = async () => {
    setReviewVisited(true);

    if (missingTotal > 0) {
      return;
    }

    try {
      await submitMutation.mutateAsync({
        surveyId: survey.id,
        participantUserId: session.userId,
        participantDeviceId: getOrCreateParticipantDeviceId(),
        participantEmail: session.email,
        locale: displayLocale,
        profile: extractRespondentProfile(survey, values),
        answers: submissionAnswers,
        rawPayload: values,
      });
      markSurveySubmittedOnDevice(publicSlug);
      await draftStorage.removeDraft({ surveyId: survey.id, participantUserId: session.userId });
      clearDraftValues();
      navigate(`/survey/${publicSlug}/complete`);
    } catch (error) {
      if (error instanceof ParticipantApiError && error.code === 'ALREADY_SUBMITTED') {
        navigate(`/survey/${publicSlug}/already-submitted`);
      }
    }
  };

  return (
    <main className="survey-review-page">
      <header className="survey-review-page__header">
        <p>{copy.reviewEyebrow}</p>
        <h1>{copy.reviewTitle}</h1>
      </header>

      {missingTotal > 0 ? (
        <Message tone="warning" title={copy.missingRequiredTitle(missingTotal)}>
          <p>{copy.missingRequiredDescription}</p>
        </Message>
      ) : (
        <Message tone="success" title={copy.allRequiredAnsweredTitle}>
          <p>{copy.allRequiredAnsweredDescription}</p>
        </Message>
      )}

      <section className="survey-review-page__summary">
        <div>
          <span>{answerSections.length}</span>
          <p>{copy.sectionsSummaryLabel}</p>
        </div>
        <div>
          <span>{submissionAnswers.length}</span>
          <p>{copy.answersSummaryLabel}</p>
        </div>
        <div>
          <span>{imageTagCount}</span>
          <p>{copy.imageTagsSummaryLabel}</p>
        </div>
      </section>

      <section className="survey-review-page__sections">
        {missingBySection.map(({ section, missing }) => (
          <article key={section.id}>
            <div>
              <h2>{readLocalizedText(section.title, displayLocale, defaultLocale)}</h2>
              <p>{missing.length > 0 ? copy.sectionMissingLabel(missing.length) : copy.sectionCompleteLabel}</p>
            </div>
            <ButtonLink variant={missing.length > 0 ? 'secondary' : 'tertiary'} href={`/survey/${publicSlug}/sections/${section.sectionKey}`}>
              {missing.length > 0 ? copy.answerSection : copy.editSection}
            </ButtonLink>
          </article>
        ))}
      </section>

      {submitMutation.isError ? (
        <Message tone="error" title={copy.submitErrorTitle}>
          <p>{copy.submitErrorDescription}</p>
        </Message>
      ) : null}

      <div className="survey-review-page__bottom">
        <Button fullWidth disabled={submitMutation.isPending || missingTotal > 0} onClick={submit}>
          {submitMutation.isPending ? copy.submitting : copy.finalSubmit}
        </Button>
      </div>
    </main>
  );
}
