import { z } from 'zod';

export const respondentProfileSchema = z.object({
  gender: z.string().optional(),
  semesterGroup: z.string().optional(),
  department: z.string().optional(),
  rc: z.string().optional(),
  dormitory: z.string().optional(),
  roomType: z.string().optional(),
  dormExperience: z.string().optional(),
  extra: z.record(z.string(), z.unknown()).optional(),
});

export const submissionCommandSchema = z.object({
  surveyId: z.string().min(1),
  participantUserId: z.string().min(1),
  participantDeviceId: z.string().min(8).max(128),
  participantEmail: z.string().email(),
  locale: z.union([z.literal('ko'), z.literal('en')]),
  startedAt: z.string().optional(),
  profile: respondentProfileSchema,
  answers: z.array(z.unknown()),
  rawPayload: z.record(z.string(), z.unknown()),
});
