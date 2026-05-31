import { useParams } from 'react-router-dom';

import { ButtonLink } from '../../../components/Button';
import { Message } from '../../../components/Message';
import { useParticipantLocaleStore } from '../../../store/participantLocaleStore';
import { getSurveyLocaleCopy } from './surveyLocaleCopy';
import './css/SurveyCompletePage.css';

export function SurveyCompletePage() {
  const { publicSlug = '' } = useParams();
  const { locale } = useParticipantLocaleStore();
  const copy = getSurveyLocaleCopy(locale ?? 'ko');

  return (
    <main className="survey-complete-page">
      <section className="survey-complete-page__content">
        <p className="survey-complete-page__eyebrow">{copy.completeEyebrow}</p>
        <h1>{copy.completeTitle}</h1>
        <p>{copy.completeDescription}</p>
        <Message tone="success" title={copy.completeThanksTitle}>
          <p>{copy.completeContactDescription}</p>
        </Message>
        <ButtonLink variant="secondary" href={`/survey/${publicSlug}`}>
          {copy.backToIntro}
        </ButtonLink>
      </section>
    </main>
  );
}
