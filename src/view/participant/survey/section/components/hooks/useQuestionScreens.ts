import { useMemo } from 'react';

import { shouldShowQuestion, type PublicQuestion, type PublicSurveySection, type SurveyAsset } from '../../../../../../api/participant';

type UseQuestionScreensArgs = {
  section: PublicSurveySection | undefined;
  assets: SurveyAsset[];
  values: Record<string, unknown>;
  questionScreenIndex: number;
};

export function useQuestionScreens(args: UseQuestionScreensArgs) {
  const visibleQuestions = useMemo(
    () => args.section?.questions.filter((question) => shouldShowQuestion({ question, values: args.values })) ?? [],
    [args.section?.questions, args.values],
  );
  const questionScreens = useMemo(() => buildQuestionScreens(visibleQuestions), [visibleQuestions]);
  const activeQuestionScreenIndex = Math.min(args.questionScreenIndex, Math.max(questionScreens.length - 1, 0));
  const currentQuestionScreen = questionScreens[activeQuestionScreenIndex] ?? [];
  const currentScreenAssets = useMemo(
    () => resolveQuestionAssets(args.assets, currentQuestionScreen),
    [args.assets, currentQuestionScreen],
  );

  return {
    visibleQuestions,
    questionScreens,
    activeQuestionScreenIndex,
    currentQuestionScreen,
    currentScreenAssets,
  };
}

export function buildQuestionScreens(questions: PublicQuestion[]): PublicQuestion[][] {
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

function resolveQuestionAssets(assets: SurveyAsset[], questions: PublicQuestion[]): SurveyAsset[] {
  const assetById = new Map(assets.map((asset) => [asset.id, asset] as const));
  const resolved = new Map<string, SurveyAsset>();

  for (const question of questions) {
    if (question.questionType !== 'image_tag') {
      continue;
    }

    const configAssetId = typeof question.config.assetId === 'string' ? question.config.assetId : undefined;
    const asset =
      (configAssetId ? assetById.get(configAssetId) : undefined) ??
      assets.find((item) => item.questionId === question.id || item.sectionId === question.sectionId);

    if (asset) {
      resolved.set(asset.id, asset);
    }
  }

  return Array.from(resolved.values());
}
