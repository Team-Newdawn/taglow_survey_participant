import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useAssetUrlsQuery, useParticipantSessionQuery, usePublicSurveyQuery } from '../../../api/participant';
import { Button } from '../../../components/Button';
import { Message } from '../../../components/Message';
import { StepHeader } from '../../../components/StepHeader';
import { useParticipantDraftStore } from '../../../store/participantDraftStore';
import { useParticipantLocaleStore } from '../../../store/participantLocaleStore';
import { useParticipantProgressStore } from '../../../store/participantProgressStore';
import { findMissingRequiredQuestions } from '../../../utils/answerNormalizer';
import { formatShortDateTime } from '../../../utils/dateTime';
import { readLocalizedText, resolveSurveyDefaultLocale } from '../../../utils/i18nText';
import { DraftRestoreBanner } from './components/DraftRestoreBanner';
import { MultiSelectQuestionGroup } from './components/MultiSelectQuestionGroup';
import { QuestionRenderer } from './components/QuestionRenderer';
import { ScaleQuestionGroup } from './components/ScaleQuestionGroup';
import { buildQuestionRenderBlocks, getQuestionRenderBlockId } from './components/questionRenderBlocks';
import { findAnswerSectionByKey, getAnswerSections } from './surveySections';
import { getSurveyLocaleCopy } from './surveyLocaleCopy';
import { useDraftAutosave } from './useDraftAutosave';
import { useQuestionScreens } from './useQuestionScreens';
import { useSectionNavigation } from './useSectionNavigation';
import { useSectionSurveyForm } from './useSectionSurveyForm';
import './css/SurveySectionPage.css';

export function SurveySectionPage() {
  const { publicSlug = '', sectionKey = '' } = useParams();
  const bodyRef = useRef<HTMLDivElement | null>(null);
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
    scrollElementToTop(bodyRef.current);
  }, [section?.id]);

  const { visibleQuestions, questionScreens, activeQuestionScreenIndex, currentQuestionScreen, currentScreenAssets } = useQuestionScreens({
    section,
    assets: survey?.assets ?? [],
    values,
    questionScreenIndex,
  });
  const currentScreenAssetUrlsQuery = useAssetUrlsQuery(currentScreenAssets);
  const copy = getSurveyLocaleCopy(displayLocale);
  const visibleRenderBlocks = buildQuestionRenderBlocks(visibleQuestions);
  const currentRenderBlocks = buildQuestionRenderBlocks(currentQuestionScreen);
  const renderBlockNumberById = new Map(visibleRenderBlocks.map((block, index) => [getQuestionRenderBlockId(block), index + 1] as const));
  const missingQuestions = section
    ? findMissingRequiredQuestions(section, form.getValues()).filter((question) =>
        currentQuestionScreen.some((visibleQuestion) => visibleQuestion.id === question.id),
      )
    : [];
  const { sectionIndex, nextSection, hasNextQuestionScreen, goNext, goPrevious } = useSectionNavigation({
    publicSlug,
    section,
    answerSections,
    activeQuestionScreenIndex,
    questionScreenCount: questionScreens.length,
    setQuestionScreenIndex,
    missingQuestions,
    setMissingQuestionIds,
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
            if (block.type === 'scale_group') {
              return (
                <ScaleQuestionGroup
                  key={block.id}
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
            }

            if (block.type === 'multi_select_group') {
              return (
                <MultiSelectQuestionGroup
                  key={block.id}
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
            }

            return (
              <QuestionRenderer
                key={block.question.id}
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
          })}
        </form>
      </div>

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

function readGroupTitle(
  block: Extract<ReturnType<typeof buildQuestionRenderBlocks>[number], { type: 'scale_group' | 'multi_select_group' }>,
  locale: 'ko' | 'en',
): string {
  return locale === 'en' && block.groupTitleEn ? block.groupTitleEn : block.groupTitle;
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
