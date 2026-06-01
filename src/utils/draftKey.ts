export function buildDraftKey(args: { surveyId: string; participantUserId: string }): string {
  return `taglow-survey-draft:${args.surveyId}:${args.participantUserId}`;
}
