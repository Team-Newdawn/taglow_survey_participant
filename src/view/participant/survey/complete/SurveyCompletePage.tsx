import { useParams } from 'react-router-dom';

import newdawnDomunionLogoUrl from '../../../../assets/logo_newdawn_domunion.svg';
import { ButtonLink } from '../../../../components/Button';
import { Message } from '../../../../components/Message';
import { useParticipantLocaleStore } from '../../../../store/participantLocaleStore';
import { getSurveyLocaleCopy } from '../surveyLocaleCopy';
import './css/SurveyCompletePage.css';

export function SurveyCompletePage() {
  const { publicSlug = '' } = useParams();
  const { locale } = useParticipantLocaleStore();
  const copy = getSurveyLocaleCopy(locale ?? 'ko');

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
        <ButtonLink variant="secondary" href={`/survey/${publicSlug}`}>
          {copy.backToIntro}
        </ButtonLink>
      </section>
    </main>
  );
}
