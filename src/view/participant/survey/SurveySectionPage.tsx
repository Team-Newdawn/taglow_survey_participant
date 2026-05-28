import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import type { PublicQuestion } from '../../../api/participant';
import { useParticipantSessionQuery, usePublicSurveyQuery } from '../../../api/participant';
import type { SurveyDraft } from '../../../api/participant/service/draft/draftStorage';
import { LocalStorageDraftStorage } from '../../../api/participant/service/draft/localStorageDraftStorage';
import { shouldShowQuestion } from '../../../api/participant/service/validation/branchEvaluator';
import { Button } from '../../../components/Button';
import { Message } from '../../../components/Message';
import { StepHeader } from '../../../components/StepHeader';
import { useParticipantDraftStore } from '../../../store/participantDraftStore';
import { useParticipantLocaleStore } from '../../../store/participantLocaleStore';
import { useParticipantProgressStore } from '../../../store/participantProgressStore';
import { findMissingRequiredQuestions, isAnsweredValue } from '../../../utils/answerNormalizer';
import { buildDraftKey } from '../../../utils/draftKey';
import { formatShortDateTime } from '../../../utils/dateTime';
import { readLocalizedText, resolveSurveyDefaultLocale } from '../../../utils/i18nText';
import { DraftRestoreBanner } from './components/DraftRestoreBanner';
import { QuestionRenderer } from './components/QuestionRenderer';
import './css/SurveySectionPage.css';

const DRAFT_SCHEMA_VERSION = 1;
const AUTOSAVE_DELAY_MS = 6500;

export function SurveySectionPage() {
  const { publicSlug = '', sectionKey = '' } = useParams();
  const navigate = useNavigate();
  const surveyQuery = usePublicSurveyQuery(publicSlug);
  const sessionQuery = useParticipantSessionQuery();
  const survey = surveyQuery.data;
  const session = sessionQuery.data;
  const section = survey?.sections.find((item) => item.sectionKey === sectionKey) ?? survey?.sections[0];
  const sectionIndex = survey?.sections.findIndex((item) => item.id === section?.id) ?? 0;
  const nextSection = survey?.sections[sectionIndex + 1];
  const previousSection = survey?.sections[sectionIndex - 1];
  const { locale, setLocale } = useParticipantLocaleStore();
  const defaultLocale = resolveSurveyDefaultLocale(survey);
  const displayLocale = locale ?? defaultLocale;
  const { values, setValues, setDraftStatus, setLastSavedAt, hydrateDraft, setRestoreDraftUpdatedAt } = useParticipantDraftStore();
  const { setCurrentSectionKey, markSectionCompleted } = useParticipantProgressStore();
  const [missingQuestionIds, setMissingQuestionIds] = useState<string[]>([]);
  const [restoreDraft, setRestoreDraft] = useState<SurveyDraft | null>(null);
  const [questionScreenIndex, setQuestionScreenIndex] = useState(0);
  const storage = useMemo(() => new LocalStorageDraftStorage(), []);
  const form = useForm<Record<string, unknown>>({ defaultValues: values });

  const saveDraft = useCallback(async () => {
    if (!survey || !session || !section) {
      return;
    }

    const formValues = form.getValues();
    const draft: SurveyDraft = {
      surveyId: survey.id,
      participantUserId: session.userId,
      locale: displayLocale,
      currentSectionId: section.id,
      values: formValues,
      updatedAt: new Date().toISOString(),
      schemaVersion: DRAFT_SCHEMA_VERSION,
    };

    try {
      setDraftStatus('saving');
      await storage.saveDraft(buildDraftKey({ surveyId: survey.id, participantUserId: session.userId }), draft);
      setValues(formValues);
      setLastSavedAt(draft.updatedAt);
      setDraftStatus('saved');
    } catch {
      setDraftStatus('error');
    }
  }, [displayLocale, form, section, session, setDraftStatus, setLastSavedAt, setValues, storage, survey]);

  useEffect(() => {
    setCurrentSectionKey(section?.sectionKey);
  }, [section?.sectionKey, setCurrentSectionKey]);

  useEffect(() => {
    setQuestionScreenIndex(0);
    setMissingQuestionIds([]);
  }, [section?.id]);

  useEffect(() => {
    const subscription = form.watch((nextValues, info) => {
      if (!info.name) {
        return;
      }

      setValues(nextValues as Record<string, unknown>);
      setDraftStatus('idle');
    });

    return () => subscription.unsubscribe();
  }, [form, setDraftStatus, setValues]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void saveDraft();
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [saveDraft, values]);

  useEffect(() => {
    if (!survey || !session || Object.keys(values).length > 0) {
      return;
    }

    void storage.loadDraft(buildDraftKey({ surveyId: survey.id, participantUserId: session.userId })).then((loadedDraft) => {
      if (loadedDraft?.schemaVersion === DRAFT_SCHEMA_VERSION) {
        setRestoreDraft(loadedDraft);
        setRestoreDraftUpdatedAt(loadedDraft.updatedAt);
      }
    });
  }, [session, setRestoreDraftUpdatedAt, storage, survey, values]);

  useEffect(() => {
    const saveOnHidden = () => {
      if (document.visibilityState === 'hidden') {
        void saveDraft();
      }
    };
    const saveOnUnload = () => {
      void saveDraft();
    };

    document.addEventListener('visibilitychange', saveOnHidden);
    window.addEventListener('beforeunload', saveOnUnload);

    return () => {
      document.removeEventListener('visibilitychange', saveOnHidden);
      window.removeEventListener('beforeunload', saveOnUnload);
    };
  }, [saveDraft]);

  if (!survey || !section) {
    return null;
  }

  const visibleQuestions = section.questions.filter((question) => shouldShowQuestion({ question, values }));
  const questionScreens = buildQuestionScreens(visibleQuestions);
  const activeQuestionScreenIndex = Math.min(questionScreenIndex, Math.max(questionScreens.length - 1, 0));
  const currentQuestionScreen = questionScreens[activeQuestionScreenIndex] ?? [];
  const hasPreviousQuestionScreen = activeQuestionScreenIndex > 0;
  const hasNextQuestionScreen = activeQuestionScreenIndex < questionScreens.length - 1;
  const answeredCount = visibleQuestions.filter((question) => isAnsweredValue(question, form.watch(question.id))).length;
  const missingQuestions = findMissingRequiredQuestions(section, form.getValues()).filter((question) =>
    currentQuestionScreen.some((visibleQuestion) => visibleQuestion.id === question.id),
  );

  const restoreCurrentDraft = () => {
    if (!restoreDraft) {
      return;
    }

    hydrateDraft({
      values: restoreDraft.values,
      locale: restoreDraft.locale,
      currentSectionId: restoreDraft.currentSectionId,
      updatedAt: restoreDraft.updatedAt,
    });
    setLocale(restoreDraft.locale);
    form.reset(restoreDraft.values);
    setRestoreDraft(null);
  };

  const discardRestoreDraft = async () => {
    if (survey && session) {
      await storage.removeDraft(buildDraftKey({ surveyId: survey.id, participantUserId: session.userId }));
    }
    setRestoreDraft(null);
  };

  const goNext = async () => {
    if (missingQuestions.length > 0) {
      setMissingQuestionIds(missingQuestions.map((question) => question.id));
      return;
    }

    setMissingQuestionIds([]);

    if (hasNextQuestionScreen) {
      await saveDraft();
      setQuestionScreenIndex(activeQuestionScreenIndex + 1);
      return;
    }

    markSectionCompleted(section.id);
    await saveDraft();
    navigate(nextSection ? `/survey/${publicSlug}/sections/${nextSection.sectionKey}` : `/survey/${publicSlug}/review`);
  };

  const goPrevious = async () => {
    if (hasPreviousQuestionScreen) {
      setMissingQuestionIds([]);
      await saveDraft();
      setQuestionScreenIndex(activeQuestionScreenIndex - 1);
      return;
    }

    await saveDraft();
    navigate(previousSection ? `/survey/${publicSlug}/sections/${previousSection.sectionKey}` : `/survey/${publicSlug}/intro`);
  };

  return (
    <main className="survey-section-page">
      <StepHeader
        eyebrow={`${sectionIndex + 1}/${survey.sections.length}`}
        title={readLocalizedText(section.title, displayLocale, defaultLocale)}
        description={section.description ? readLocalizedText(section.description, displayLocale, defaultLocale) : undefined}
        current={answeredCount}
        total={visibleQuestions.length}
      />

      {restoreDraft ? (
        <DraftRestoreBanner updatedAt={formatShortDateTime(restoreDraft.updatedAt)} onRestore={restoreCurrentDraft} onRestart={discardRestoreDraft} />
      ) : null}

      {missingQuestionIds.length > 0 ? (
        <Message tone="error" title="필수 문항을 먼저 답해주세요.">
          <p>응답하지 않은 문항을 확인한 뒤 다음 섹션으로 이동할 수 있습니다.</p>
        </Message>
      ) : null}

      <form className="survey-section-page__questions">
        {currentQuestionScreen.map((question) => (
          <QuestionRenderer
            key={question.id}
            question={question}
            assets={survey.assets}
            locale={displayLocale}
            fallbackLocale={defaultLocale}
            value={form.watch(question.id)}
            error={missingQuestionIds.includes(question.id) ? '필수 문항입니다.' : undefined}
            onChange={(value) => {
              form.setValue(question.id, value, { shouldDirty: true, shouldTouch: true });
            }}
          />
        ))}
      </form>

      <nav className="survey-section-page__bottom" aria-label="섹션 이동">
        <Button type="button" variant="secondary" onClick={goPrevious}>
          이전
        </Button>
        <Button type="button" onClick={goNext}>
          {hasNextQuestionScreen || nextSection ? '다음' : '검토하기'}
        </Button>
      </nav>
    </main>
  );
}

function buildQuestionScreens(questions: PublicQuestion[]): PublicQuestion[][] {
  return questions.reduce<PublicQuestion[][]>((screens, question) => {
    if (isImageTagQuestion(question)) {
      screens.push([question]);
      return screens;
    }

    const previousScreen = screens.at(-1);
    const shouldAppendToPrevious = previousScreen && previousScreen.every((item) => !isImageTagQuestion(item));

    if (shouldAppendToPrevious) {
      previousScreen.push(question);
      return screens;
    }

    screens.push([question]);
    return screens;
  }, []);
}

function isImageTagQuestion(question: PublicQuestion): boolean {
  return question.questionType === 'image_tag' || question.questionType === 'participant_image_tag';
}
