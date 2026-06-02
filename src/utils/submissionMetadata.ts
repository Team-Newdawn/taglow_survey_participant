export type SubmissionRawPayloadMetadata = Readonly<{
  source: 'participant_web';
  answerCount: number;
  imageTagCount: number;
}>;

export function buildSubmissionRawPayloadMetadata(args: {
  answerCount: number;
  imageTagCount: number;
}): SubmissionRawPayloadMetadata {
  return {
    source: 'participant_web',
    answerCount: args.answerCount,
    imageTagCount: args.imageTagCount,
  };
}
