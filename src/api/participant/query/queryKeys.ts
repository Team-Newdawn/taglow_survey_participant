export const participantQueryKeys = {
  session: ['participant', 'session'] as const,
  surveyAccess: (publicSlug: string, authScope: string = 'unknown', deviceScope: string = 'unknown-device') =>
    ['participant', 'survey', publicSlug, 'access', authScope, deviceScope] as const,
  publicSurveyLoginPage: (publicSlug: string) => ['participant', 'survey', publicSlug, 'login-page'] as const,
  publicSurvey: (publicSlug: string, authScope: string = 'unknown') =>
    ['participant', 'survey', publicSlug, authScope] as const,
  duplicateSubmission: (surveyId: string, participantUserId: string, participantDeviceId: string = 'unknown-device') =>
    ['participant', 'survey', surveyId, 'duplicate', participantUserId, participantDeviceId] as const,
  assetUrl: (assetId: string) => ['participant', 'assetUrl', assetId] as const,
  assetUrls: (assetIds: readonly string[]) => ['participant', 'assetUrls', [...assetIds].sort()] as const,
};
