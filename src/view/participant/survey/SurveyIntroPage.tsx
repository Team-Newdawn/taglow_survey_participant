import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useParticipantSessionQuery, usePublicSurveyQuery } from '../../../api/participant';
import type { SurveyDraft } from '../../../api/participant/service/draft/draftStorage';
import { LocalStorageDraftStorage } from '../../../api/participant/service/draft/localStorageDraftStorage';
import { Button } from '../../../components/Button';
import { Message } from '../../../components/Message';
import { useParticipantDraftStore } from '../../../store/participantDraftStore';
import { useParticipantLocaleStore } from '../../../store/participantLocaleStore';
import { useParticipantProgressStore } from '../../../store/participantProgressStore';
import { buildDraftKey } from '../../../utils/draftKey';
import { formatShortDateTime } from '../../../utils/dateTime';
import { readLocalizedText, resolveSurveyDefaultLocale } from '../../../utils/i18nText';
import { DraftRestoreBanner } from './components/DraftRestoreBanner';
import './css/SurveyIntroPage.css';

const DRAFT_SCHEMA_VERSION = 1;
const URL_PATTERN = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;

export function SurveyIntroPage() {
  const { publicSlug = '' } = useParams();
  const navigate = useNavigate();
  const surveyQuery = usePublicSurveyQuery(publicSlug);
  const sessionQuery = useParticipantSessionQuery();
  const { locale, setLocale } = useParticipantLocaleStore();
  const { hydrateDraft, clearDraftValues, setRestoreDraftUpdatedAt } = useParticipantDraftStore();
  const { setCurrentSectionKey, resetProgress } = useParticipantProgressStore();
  const [draft, setDraft] = useState<SurveyDraft | null>(null);
  const survey = surveyQuery.data;
  const session = sessionQuery.data;
  const defaultLocale = resolveSurveyDefaultLocale(survey);
  const displayLocale = locale ?? defaultLocale;
  const firstSection = survey?.sections[0];
  const storage = useMemo(() => new LocalStorageDraftStorage(), []);

  useEffect(() => {
    if (!survey || !session) {
      return;
    }

    const draftKey = buildDraftKey({ surveyId: survey.id, participantUserId: session.userId });
    void storage.loadDraft(draftKey).then((loadedDraft) => {
      if (!loadedDraft || loadedDraft.schemaVersion !== DRAFT_SCHEMA_VERSION) {
        return;
      }

      setDraft(loadedDraft);
      setRestoreDraftUpdatedAt(loadedDraft.updatedAt);
    });
  }, [session, setRestoreDraftUpdatedAt, storage, survey]);

  if (!survey) {
    return null;
  }

  const surveyDescription = survey.description ? readLocalizedText(survey.description, displayLocale, defaultLocale).trim() : '';

  const startFresh = async () => {
    if (survey && session) {
      await storage.removeDraft(buildDraftKey({ surveyId: survey.id, participantUserId: session.userId }));
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

    const section = survey.sections.find((item) => item.id === draft.currentSectionId) ?? firstSection;
    hydrateDraft({
      values: draft.values,
      locale: draft.locale,
      currentSectionId: draft.currentSectionId,
      updatedAt: draft.updatedAt,
    });
    setLocale(draft.locale);
    setCurrentSectionKey(section?.sectionKey);
    navigate(section ? `/survey/${publicSlug}/sections/${section.sectionKey}` : `/survey/${publicSlug}/review`);
  };

  return (
    <main className="survey-intro-page">
      <header className="survey-intro-page__header">
        <p className="survey-intro-page__eyebrow">설문 안내</p>
        <h1>{readLocalizedText(survey.title, displayLocale, defaultLocale)}</h1>
      </header>

      {draft ? (
        <DraftRestoreBanner
          updatedAt={formatShortDateTime(draft.updatedAt)}
          onRestore={restoreDraft}
          onRestart={startFresh}
        />
      ) : null}

      {surveyDescription ? (
        <section className="survey-intro-page__card">
          <p className="survey-intro-page__description">{renderTextWithLinks(surveyDescription)}</p>
        </section>
      ) : null}

      <section className="survey-intro-page__card">
        <h2>언어</h2>
        <div className="survey-intro-page__locale">
          <button type="button" className={displayLocale === 'ko' ? 'is-selected' : ''} onClick={() => setLocale('ko')}>
            한국어
          </button>
          <button type="button" className={displayLocale === 'en' ? 'is-selected' : ''} onClick={() => setLocale('en')}>
            English
          </button>
        </div>
      </section>

      <section className="survey-intro-page__sections">
        <h2>진행할 섹션</h2>
        {survey.sections.map((section, index) => (
          <Link key={section.id} to={`/survey/${publicSlug}/sections/${section.sectionKey}`}>
            <span>{index + 1}</span>
            {readLocalizedText(section.title, displayLocale, defaultLocale)}
          </Link>
        ))}
      </section>

      <div className="survey-intro-page__bottom">
        <Button fullWidth onClick={startFresh}>
          {draft ? '새로 시작하기' : '첫 섹션으로 이동'}
        </Button>
      </div>
    </main>
  );
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
