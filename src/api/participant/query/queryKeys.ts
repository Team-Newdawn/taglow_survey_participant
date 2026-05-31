export const participantQueryKeys = {
  session: ['participant', 'session'] as const,
  surveyAccess: (publicSlug: string, authScope: string = 'unknown') =>
    ['participant', 'survey', publicSlug, 'access', authScope] as const,
  publicSurvey: (publicSlug: string, authScope: string = 'unknown') =>
    ['participant', 'survey', publicSlug, authScope] as const,
  duplicateSubmission: (surveyId: string, participantUserId: string) =>
    ['participant', 'survey', surveyId, 'duplicate', participantUserId] as const,
  assetUrl: (assetId: string) => ['participant', 'assetUrl', assetId] as const,
  assetUrls: (assetIds: readonly string[]) => ['participant', 'assetUrls', [...assetIds].sort()] as const,
};
