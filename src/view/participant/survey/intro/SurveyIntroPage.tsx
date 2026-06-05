import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
  SURVEY_DRAFT_SCHEMA_VERSION,
  type Locale,
  useSurveyDraftStorage,
  useParticipantSessionQuery,
  usePublicSurveyQuery,
  type PublicSurvey,
  type SurveyDraft,
} from '../../../../api/participant';
import { Button } from '../../../../components/Button';
import { Message } from '../../../../components/Message';
import { useParticipantDraftStore } from '../../../../store/participantDraftStore';
import { useParticipantLocaleStore } from '../../../../store/participantLocaleStore';
import { useParticipantProgressStore } from '../../../../store/participantProgressStore';
import { formatShortDateTime } from '../../../../utils/dateTime';
import { readLocalizedText } from '../../../../utils/i18nText';
import { resolveSystemLocale } from '../../../../utils/systemLocale';
import { DraftRestoreBanner } from '../components/DraftRestoreBanner';
import { getAnswerSections, isIntroSection } from '../surveySections';
import { getSurveyLocaleCopy } from '../surveyLocaleCopy';
import './css/SurveyIntroPage.css';

const URL_PATTERN = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;

export function SurveyIntroPage() {
  const { publicSlug = '' } = useParams();
  const navigate = useNavigate();
  const surveyQuery = usePublicSurveyQuery(publicSlug);
  const sessionQuery = useParticipantSessionQuery();
  const { setLocale } = useParticipantLocaleStore();
  const { hydrateDraft, clearDraftValues, setRestoreDraftUpdatedAt } = useParticipantDraftStore();
  const { setCurrentSectionKey, resetProgress } = useParticipantProgressStore();
  const [draft, setDraft] = useState<SurveyDraft | null>(null);
  const draftStorage = useSurveyDraftStorage();
  const survey = surveyQuery.data;
  const session = sessionQuery.data;
  const displayLocale = useMemo(() => resolveSystemLocale(window.navigator), []);
  const answerSections = getAnswerSections(survey);
  const firstSection = answerSections[0];
  const copy = getSurveyLocaleCopy(displayLocale);
  const canOpenSectionShortcuts = import.meta.env.DEV;

  useEffect(() => {
    setLocale(displayLocale);
  }, [displayLocale, setLocale]);

  useEffect(() => {
    if (!survey || !session) {
      return;
    }

    void draftStorage.loadDraft({ surveyId: survey.id, participantUserId: session.userId }).then((loadedDraft) => {
      if (!loadedDraft || loadedDraft.schemaVersion !== SURVEY_DRAFT_SCHEMA_VERSION) {
        return;
      }

      setDraft(loadedDraft);
      setRestoreDraftUpdatedAt(loadedDraft.updatedAt);
    });
  }, [draftStorage, session, setRestoreDraftUpdatedAt, survey]);

  if (!survey) {
    return null;
  }

  const surveyDescription = readSurveyIntroDescription(survey, displayLocale);

  const startFresh = async () => {
    if (survey && session) {
      await draftStorage.removeDraft({ surveyId: survey.id, participantUserId: session.userId });
    }

    clearDraftValues();
    resetProgress();
    setDraft(null);
    setCurrentSectionKey(firstSection?.sectionKey);
    navigate(firstSection ? `/survey/${publicSlug}/sections/${firstSection.sectionKey}` : `/survey/${publicSlug}/review`);
  };

  const restoreDraft = () => {
    if (!draft) {
      return;
    }

    const section = answerSections.find((item) => item.id === draft.currentSectionId) ?? firstSection;
    hydrateDraft({
      values: draft.values,
      locale: displayLocale,
      currentSectionId: draft.currentSectionId,
      updatedAt: draft.updatedAt,
    });
    setLocale(displayLocale);
    setCurrentSectionKey(section?.sectionKey);
    navigate(section ? `/survey/${publicSlug}/sections/${section.sectionKey}` : `/survey/${publicSlug}/review`);
  };

  return (
    <main className="survey-intro-page">
      <header className="survey-intro-page__header">
        <p className="survey-intro-page__eyebrow">{copy.introEyebrow}</p>
        <h1>{readIntroLocalizedText(survey.title, displayLocale, copy.introEyebrow)}</h1>
      </header>

      {draft ? (
        <DraftRestoreBanner
          updatedAt={formatShortDateTime(draft.updatedAt)}
          locale={displayLocale}
          onRestore={restoreDraft}
          onRestart={startFresh}
        />
      ) : null}

      {surveyDescription ? (
        <section className="survey-intro-page__card">
          <p className="survey-intro-page__description">{renderTextWithLinks(surveyDescription)}</p>
        </section>
      ) : null}

      <section className="survey-intro-page__sections">
        <h2>{copy.sectionsToComplete}</h2>
        {answerSections.map((section, index) => {
          const sectionTitle = readIntroLocalizedText(section.title, displayLocale, section.sectionKey);
          const sectionContent = (
            <>
              <span className="survey-intro-page__section-index">{index + 1}</span>
              {sectionTitle}
            </>
          );

          return canOpenSectionShortcuts ? (
            <Link
              key={section.id}
              className="survey-intro-page__section-item"
              to={`/survey/${publicSlug}/sections/${section.sectionKey}`}
            >
              {sectionContent}
            </Link>
          ) : (
            <div key={section.id} className="survey-intro-page__section-item" aria-disabled="true">
              {sectionContent}
            </div>
          );
        })}
      </section>

      <div className="survey-intro-page__bottom">
        <Button fullWidth onClick={startFresh}>
          {draft ? copy.startFresh : copy.startFirstSection}
        </Button>
      </div>
    </main>
  );
}

function readSurveyIntroDescription(survey: PublicSurvey, locale: Locale): string {
  const introSection = survey.sections.find(isIntroSection);
  const candidates = [introSection?.description, survey.description];

  for (const candidate of candidates) {
    const localized = readIntroLocalizedText(candidate, locale);
    if (localized) {
      return localized;
    }
  }

  return '';
}

function readIntroLocalizedText(text: PublicSurvey['title'] | undefined, locale: Locale, fallback = ''): string {
  return readLocalizedText(text, locale, 'ko').trim() || fallback;
}

function renderTextWithLinks(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const rawUrl = match[0];
    const start = match.index ?? 0;
    const { urlText, trailingText } = splitTrailingUrlPunctuation(rawUrl);

    if (start > cursor) {
      nodes.push(text.slice(cursor, start));
    }

    if (urlText) {
      nodes.push(
        <a key={`${start}-${urlText}`} href={buildLinkHref(urlText)} target="_blank" rel="noopener noreferrer">
          {urlText}
        </a>,
      );
    }

    if (trailingText) {
      nodes.push(trailingText);
    }

    cursor = start + rawUrl.length;
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes.length > 0 ? nodes : [text];
}

function splitTrailingUrlPunctuation(value: string): { urlText: string; trailingText: string } {
  let urlText = value;
  let trailingText = '';

  while (urlText.length > 0 && shouldTrimTrailingUrlCharacter(urlText)) {
    trailingText = urlText.at(-1) + trailingText;
    urlText = urlText.slice(0, -1);
  }

  return { urlText, trailingText };
}

function shouldTrimTrailingUrlCharacter(value: string): boolean {
  const lastCharacter = value.at(-1);

  if (!lastCharacter) {
    return false;
  }

  if (/[.,!?;:，。、]/.test(lastCharacter)) {
    return true;
  }

  if (lastCharacter === ')') {
    return countCharacters(value, ')') > countCharacters(value, '(');
  }

  if (lastCharacter === ']') {
    return countCharacters(value, ']') > countCharacters(value, '[');
  }

  if (lastCharacter === '）') {
    return countCharacters(value, '）') > countCharacters(value, '（');
  }

  return false;
}

function countCharacters(value: string, character: string): number {
  return Array.from(value).filter((item) => item === character).length;
}

function buildLinkHref(urlText: string): string {
  return /^https?:\/\//i.test(urlText) ? urlText : `https://${urlText}`;
}
