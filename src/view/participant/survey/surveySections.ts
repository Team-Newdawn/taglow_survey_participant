import type { PublicSurvey, PublicSurveySection } from '../../../api/participant';

export function getAnswerSections(survey: PublicSurvey | undefined): PublicSurveySection[] {
  return survey?.sections.filter((section) => !isIntroSection(section)) ?? [];
}

export function findAnswerSectionByKey(survey: PublicSurvey | undefined, sectionKey: string): PublicSurveySection | undefined {
  return getAnswerSections(survey).find((section) => section.sectionKey === sectionKey);
}

export function isIntroSection(section: PublicSurveySection): boolean {
  return section.sectionType === 'intro' || section.sectionKey === 'intro';
}
