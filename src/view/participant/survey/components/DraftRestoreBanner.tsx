import type { Locale } from '../../../../api/participant';
import { Button } from '../../../../components/Button';
import { getSurveyLocaleCopy } from '../surveyLocaleCopy';
import './css/DraftRestoreBanner.css';

type DraftRestoreBannerProps = {
  updatedAt: string;
  locale: Locale;
  onRestore: () => void;
  onRestart: () => void;
};

export function DraftRestoreBanner({ updatedAt, locale, onRestore, onRestart }: DraftRestoreBannerProps) {
  const copy = getSurveyLocaleCopy(locale);

  return (
    <section className="draft-restore-banner">
      <div>
        <h2>{copy.draftTitle}</h2>
        <p>{updatedAt ? copy.draftSavedAt(updatedAt) : copy.draftSavedFallback}</p>
      </div>
      <div className="draft-restore-banner__actions">
        <Button type="button" variant="secondary" onClick={onRestart}>
          {copy.restart}
        </Button>
        <Button type="button" onClick={onRestore}>
          {copy.continueDraft}
        </Button>
      </div>
    </section>
  );
}
