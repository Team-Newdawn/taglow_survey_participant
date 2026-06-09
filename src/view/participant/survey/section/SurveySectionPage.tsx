import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import { useAssetUrlsQuery, useParticipantSessionQuery, usePublicSurveyQuery } from '../../../../api/participant';
import { Button } from '../../../../components/Button';
import { Message } from '../../../../components/Message';
import { StepHeader } from '../../../../components/StepHeader';
import { useParticipantDraftStore } from '../../../../store/participantDraftStore';
import { useParticipantLocaleStore } from '../../../../store/participantLocaleStore';
import { useParticipantProgressStore } from '../../../../store/participantProgressStore';
import { findMissingRequiredQuestions } from '../../../../utils/answerNormalizer';
import { formatShortDateTime } from '../../../../utils/dateTime';
import { readLocalizedText, resolveSurveyDefaultLocale } from '../../../../utils/i18nText';
import { normalizeProfileRecord, type ProfileFieldKey } from '../../../../utils/profileFields';
import { DraftRestoreBanner } from '../components/DraftRestoreBanner';
import { findAnswerSectionByKey, getAnswerSections } from '../surveySections';
import { getSurveyLocaleCopy } from '../surveyLocaleCopy';
import { buildDevAutofillValues } from './components/utils/devAutofill';
import { useDraftAutosave } from './components/hooks/useDraftAutosave';
import { MultiSelectQuestionGroup } from './components/groups/MultiSelectQuestionGroup';
import { ProfileQuestion } from './components/questions/ProfileQuestion';
import { useQuestionScreens } from './components/hooks/useQuestionScreens';
import { QuestionRenderer } from './components/layout/QuestionRenderer';
import { ScaleQuestionGroup } from './components/groups/ScaleQuestionGroup';
import { buildQuestionRenderBlocks, getQuestionRenderBlockId } from './components/utils/questionRenderBlocks';
import { useSectionNavigation } from './navigation/useSectionNavigation';
import { useSectionSurveyForm } from './components/hooks/useSectionSurveyForm';
import './css/SurveySectionPage.css';

export function SurveySectionPage() {
  const { publicSlug = '', sectionKey = '' } = useParams();
  const location = useLocation();
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const questionBlockRefs = useRef(new Map<string, HTMLDivElement>());
  const surveyQuery = usePublicSurveyQuery(publicSlug);
  const sessionQuery = useParticipantSessionQuery();
  const survey = surveyQuery.data;
  const session = sessionQuery.data;
  const answerSections = getAnswerSections(survey);
  const section = findAnswerSectionByKey(survey, sectionKey) ?? answerSections[0];
  const { locale, setLocale } = useParticipantLocaleStore();
  const defaultLocale = resolveSurveyDefaultLocale(survey);
  const displayLocale = locale ?? defaultLocale;
  const { values, setValues, setDraftStatus, setLastSavedAt, hydrateDraft, setRestoreDraftUpdatedAt } = useParticipantDraftStore();
  const { setCurrentSectionKey, markSectionCompleted } = useParticipantProgressStore();
  const [missingQuestionIds, setMissingQuestionIds] = useState<string[]>([]);
  const [questionScreenIndex, setQuestionScreenIndex] = useState(0);
  const form = useSectionSurveyForm({
    values,
    onValuesChange: setValues,
    onDirty: () => setDraftStatus('idle'),
  });
  const { restoreDraft, setRestoreDraft, saveDraft, removeDraft } = useDraftAutosave({
    survey,
    session,
    section,
    displayLocale,
    form,
    values,
    setValues,
    setDraftStatus,
    setLastSavedAt,
    setRestoreDraftUpdatedAt,
  });

  useEffect(() => {
    setCurrentSectionKey(section?.sectionKey);
  }, [section?.sectionKey, setCurrentSectionKey]);

  useEffect(() => {
    setQuestionScreenIndex(0);
    setMissingQuestionIds([]);
    return scrollSurveySectionToTop(bodyRef.current);
  }, [section?.id]);

  const { visibleQuestions, questionScreens, activeQuestionScreenIndex, currentQuestionScreen, currentScreenAssets } = useQuestionScreens({
    section,
    assets: survey?.assets ?? [],
    values,
    questionScreenIndex,
  });
  const currentScreenAssetUrlsQuery = useAssetUrlsQuery(currentScreenAssets);
  const copy = getSurveyLocaleCopy(displayLocale);
  const canUseDevAutofill = import.meta.env.DEV;
  const visibleRenderBlocks = buildQuestionRenderBlocks(visibleQuestions);
  const currentRenderBlocks = buildQuestionRenderBlocks(currentQuestionScreen);
  const shouldOpenFirstQuestionPanel = readOpenFirstQuestionPanelState(location.state) && activeQuestionScreenIndex === 0;
  const renderBlockNumberById = new Map(visibleRenderBlocks.map((block, index) => [getQuestionRenderBlockId(block), index + 1] as const));
  const missingQuestions = section
    ? findMissingRequiredQuestions(section, form.getValues()).filter((question) =>
        currentQuestionScreen.some((visibleQuestion) => visibleQuestion.id === question.id),
      )
    : [];

  const registerBlockRef = useCallback(
    (blockId: string) => (element: HTMLDivElement | null) => {
      if (element) {
        questionBlockRefs.current.set(blockId, element);
      } else {
        questionBlockRefs.current.delete(blockId);
      }
    },
    [],
  );

  const scrollToFirstMissingQuestion = useCallback(
    (missingQuestionIds: string[]) => {
      const missingIds = new Set(missingQuestionIds);
      const topMostBlock = currentRenderBlocks.find((block) =>
        getRenderBlockQuestionIds(block).some((questionId) => missingIds.has(questionId)),
      );

      if (!topMostBlock) {
        return;
      }

      const element = questionBlockRefs.current.get(getQuestionRenderBlockId(topMostBlock));
      scrollQuestionBlockIntoView(element);
    },
    [currentRenderBlocks],
  );

  const { sectionIndex, nextSection, hasNextQuestionScreen, goNext, goPrevious } = useSectionNavigation({
    publicSlug,
    section,
    answerSections,
    activeQuestionScreenIndex,
    questionScreenCount: questionScreens.length,
    setQuestionScreenIndex,
    missingQuestions,
    setMissingQuestionIds,
    scrollToFirstMissingQuestion,
    markSectionCompleted,
    saveDraft,
  });

  if (!survey || !section) {
    return null;
  }

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
    await removeDraft();
    setRestoreDraft(null);
  };

  const autofillCurrentScreen = () => {
    const autofillValues = buildDevAutofillValues({
      questions: currentQuestionScreen,
      assets: survey.assets,
      locale: displayLocale,
      fallbackLocale: defaultLocale,
      currentValues: form.getValues(),
    });

    Object.entries(autofillValues).forEach(([questionId, value]) => {
      form.setValue(questionId, value, { shouldDirty: true, shouldTouch: true });
    });

    setMissingQuestionIds((questionIds) => questionIds.filter((questionId) => !(questionId in autofillValues)));
  };

  return (
    <main className="survey-section-page">
      <StepHeader
        eyebrow={`${sectionIndex + 1}/${answerSections.length}`}
        title={readLocalizedText(section.title, displayLocale, defaultLocale)}
        description={section.description ? readLocalizedText(section.description, displayLocale, defaultLocale) : undefined}
        current={sectionIndex + 1}
        total={answerSections.length}
        progressLabel={copy.sectionProgress(sectionIndex + 1, answerSections.length)}
      />

      <div ref={bodyRef} className="survey-section-page__body">
        {restoreDraft ? (
          <DraftRestoreBanner
            updatedAt={formatShortDateTime(restoreDraft.updatedAt)}
            locale={displayLocale}
            onRestore={restoreCurrentDraft}
            onRestart={discardRestoreDraft}
          />
        ) : null}

        {missingQuestionIds.length > 0 ? (
          <Message tone="error" title={copy.requiredMissingTitle}>
            <p>{copy.requiredMissingDescription}</p>
          </Message>
        ) : null}

        <form className="survey-section-page__questions">
          {currentRenderBlocks.map((block) => {
            const blockId = getQuestionRenderBlockId(block);
            let content;

            if (block.type === 'scale_group') {
              const isFirstRenderBlock = currentRenderBlocks[0] === block;

              content = (
                <ScaleQuestionGroup
                  groupTitle={readGroupTitle(block, displayLocale)}
                  questions={block.questions}
                  locale={displayLocale}
                  fallbackLocale={defaultLocale}
                  values={Object.fromEntries(block.questions.map((question) => [question.id, form.watch(question.id)]))}
                  missingQuestionIds={missingQuestionIds}
                  number={renderBlockNumberById.get(block.id)}
                  initialExpandedQuestionId={shouldOpenFirstQuestionPanel && isFirstRenderBlock ? block.questions[0]?.id : undefined}
                  onChange={(questionId, value) => {
                    form.setValue(questionId, value, { shouldDirty: true, shouldTouch: true });
                  }}
                />
              );
            } else if (block.type === 'multi_select_group') {
              content = (
                <MultiSelectQuestionGroup
                  groupTitle={readGroupTitle(block, displayLocale)}
                  questions={block.questions}
                  locale={displayLocale}
                  fallbackLocale={defaultLocale}
                  values={Object.fromEntries(block.questions.map((question) => [question.id, form.watch(question.id)]))}
                  missingQuestionIds={missingQuestionIds}
                  number={renderBlockNumberById.get(block.id)}
                  onChange={(questionId, value) => {
                    form.setValue(questionId, value, { shouldDirty: true, shouldTouch: true });
                  }}
                />
              );
            } else if (block.type === 'profile_field') {
              const value = form.watch(block.question.id);

              content = (
                <ProfileQuestion
                  question={block.question}
                  assets={survey.assets}
                  locale={displayLocale}
                  fallbackLocale={defaultLocale}
                  value={value}
                  error={
                    missingQuestionIds.includes(block.question.id) && isProfileFieldMissing(value, block.fieldKey) ? copy.requiredQuestion : undefined
                  }
                  number={renderBlockNumberById.get(block.id)}
                  profileFieldKey={block.fieldKey}
                  onChange={(nextValue) => {
                    form.setValue(block.question.id, nextValue, { shouldDirty: true, shouldTouch: true });
                  }}
                />
              );
            } else {
              content = (
                <QuestionRenderer
                  question={block.question}
                  assets={survey.assets}
                  assetUrls={currentScreenAssetUrlsQuery.data ?? {}}
                  locale={displayLocale}
                  fallbackLocale={defaultLocale}
                  value={form.watch(block.question.id)}
                  error={missingQuestionIds.includes(block.question.id) ? copy.requiredQuestion : undefined}
                  number={renderBlockNumberById.get(block.question.id)}
                  onChange={(value) => {
                    form.setValue(block.question.id, value, { shouldDirty: true, shouldTouch: true });
                  }}
                />
              );
            }

            return (
              <div key={blockId} ref={registerBlockRef(blockId)} className="survey-section-page__question-block">
                {content}
              </div>
            );
          })}
        </form>
      </div>

      {canUseDevAutofill ? (
        <div className="survey-section-page__dev-tools">
          <Button type="button" variant="tertiary" onClick={autofillCurrentScreen}>
            현재 화면 자동채움
          </Button>
        </div>
      ) : null}

      <nav className="survey-section-page__bottom" aria-label={copy.sectionNavigation}>
        <Button type="button" variant="secondary" onClick={goPrevious}>
          {copy.previous}
        </Button>
        <Button type="button" onClick={goNext}>
          {hasNextQuestionScreen || nextSection ? copy.next : copy.review}
        </Button>
      </nav>
    </main>
  );
}

function isProfileFieldMissing(value: unknown, fieldKey: ProfileFieldKey): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return true;
  }

  const profile = normalizeProfileRecord(value as Record<string, unknown>);
  const fieldValue = profile[fieldKey];
  return typeof fieldValue !== 'string' || fieldValue.trim().length === 0;
}

function readGroupTitle(
  block: Extract<ReturnType<typeof buildQuestionRenderBlocks>[number], { type: 'scale_group' | 'multi_select_group' }>,
  locale: 'ko' | 'en',
): string {
  return locale === 'en' && block.groupTitleEn ? block.groupTitleEn : block.groupTitle;
}

function getRenderBlockQuestionIds(block: ReturnType<typeof buildQuestionRenderBlocks>[number]): string[] {
  if (block.type === 'scale_group' || block.type === 'multi_select_group') {
    return block.questions.map((question) => question.id);
  }

  return [block.question.id];
}

function scrollQuestionBlockIntoView(element: HTMLDivElement | undefined): void {
  if (!element || typeof window === 'undefined') {
    return;
  }

  // Defer to the next frame so the validation message and group expansion are
  // laid out before we measure, otherwise the target lands slightly too high.
  const run = () => {
    const header = document.querySelector<HTMLElement>('.survey-section-page > .ui-step-header');
    const headerHeight = header?.getBoundingClientRect().height ?? 0;
    const top = element.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    try {
      window.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    } catch {
      window.scrollTo(0, Math.max(0, top));
    }
  };

  if (typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(run);
  } else {
    run();
  }
}

function scrollElementToTop(element: HTMLElement | null): void {
  if (!element) {
    return;
  }

  if (typeof element.scrollTo === 'function') {
    element.scrollTo({ top: 0, behavior: 'auto' });
  }

  element.scrollTop = 0;
}

function scrollSurveySectionToTop(element: HTMLElement | null): (() => void) | undefined {
  scrollElementToTop(element);
  scrollViewportToTop();

  if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
    return undefined;
  }

  const frameId = window.requestAnimationFrame(() => {
    scrollElementToTop(element);
    scrollViewportToTop();
  });

  return () => window.cancelAnimationFrame(frameId);
}

function scrollViewportToTop(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  } catch {
    // Some test/browser environments expose scrollTo without implementing it.
  }

  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function readOpenFirstQuestionPanelState(state: unknown): boolean {
  return typeof state === 'object' && state !== null && (state as { openFirstQuestionPanel?: unknown }).openFirstQuestionPanel === true;
}
