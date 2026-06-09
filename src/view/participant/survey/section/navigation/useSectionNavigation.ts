import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import type { PublicQuestion, PublicSurveySection } from '../../../../../api/participant';

type UseSectionNavigationArgs = {
  publicSlug: string;
  section: PublicSurveySection | undefined;
  answerSections: PublicSurveySection[];
  activeQuestionScreenIndex: number;
  questionScreenCount: number;
  setQuestionScreenIndex: (index: number) => void;
  missingQuestions: PublicQuestion[];
  setMissingQuestionIds: (questionIds: string[]) => void;
  scrollToFirstMissingQuestion: (questionIds: string[]) => void;
  markSectionCompleted: (sectionId: string) => void;
  saveDraft: () => Promise<void>;
};

export function useSectionNavigation(args: UseSectionNavigationArgs) {
  const {
    publicSlug,
    section,
    answerSections,
    activeQuestionScreenIndex,
    questionScreenCount,
    setQuestionScreenIndex,
    missingQuestions,
    setMissingQuestionIds,
    scrollToFirstMissingQuestion,
    markSectionCompleted,
    saveDraft,
  } = args;
  const navigate = useNavigate();
  const sectionIndex = section ? answerSections.findIndex((item) => item.id === section.id) : -1;
  const nextSection = sectionIndex >= 0 ? answerSections[sectionIndex + 1] : undefined;
  const previousSection = sectionIndex >= 0 ? answerSections[sectionIndex - 1] : undefined;
  const hasPreviousQuestionScreen = activeQuestionScreenIndex > 0;
  const hasNextQuestionScreen = activeQuestionScreenIndex < questionScreenCount - 1;

  const goNext = useCallback(async () => {
    if (!section) {
      return;
    }

    if (missingQuestions.length > 0) {
      const missingQuestionIds = missingQuestions.map((question) => question.id);
      setMissingQuestionIds(missingQuestionIds);
      scrollToFirstMissingQuestion(missingQuestionIds);
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
    navigate(nextSection ? `/survey/${publicSlug}/sections/${nextSection.sectionKey}` : `/survey/${publicSlug}/review`, {
      state: nextSection ? { openFirstQuestionPanel: true } : undefined,
    });
  }, [
    activeQuestionScreenIndex,
    hasNextQuestionScreen,
    markSectionCompleted,
    missingQuestions,
    navigate,
    nextSection,
    publicSlug,
    saveDraft,
    scrollToFirstMissingQuestion,
    section,
    setMissingQuestionIds,
    setQuestionScreenIndex,
  ]);

  const goPrevious = useCallback(async () => {
    if (hasPreviousQuestionScreen) {
      setMissingQuestionIds([]);
      await saveDraft();
      setQuestionScreenIndex(activeQuestionScreenIndex - 1);
      return;
    }

    await saveDraft();
    navigate(previousSection ? `/survey/${publicSlug}/sections/${previousSection.sectionKey}` : `/survey/${publicSlug}/intro`);
  }, [
    activeQuestionScreenIndex,
    hasPreviousQuestionScreen,
    navigate,
    previousSection,
    publicSlug,
    saveDraft,
    setMissingQuestionIds,
    setQuestionScreenIndex,
  ]);

  return {
    sectionIndex,
    nextSection,
    previousSection,
    hasPreviousQuestionScreen,
    hasNextQuestionScreen,
    goNext,
    goPrevious,
  };
}
