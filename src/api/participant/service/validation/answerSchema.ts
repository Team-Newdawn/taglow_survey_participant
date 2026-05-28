import { z } from 'zod';

export const tagPositionSchema = z.object({
  xRatio: z.number().min(0).max(1),
  yRatio: z.number().min(0).max(1),
});

export const profileAnswerSchema = z.object({
  answerType: z.literal('profile'),
  valueJson: z.record(z.string(), z.unknown()),
});

export const experienceAnswerSchema = z.object({
  answerType: z.literal('experience'),
  valueJson: z.object({
    experienceStatus: z.string().min(1),
    noExperienceReason: z.string().optional().nullable(),
  }),
});

export const scaleAnswerSchema = z.object({
  answerType: z.literal('scale'),
  scoreValue: z.number().int().min(1).max(5),
});

export const singleChoiceAnswerSchema = z.object({
  answerType: z.literal('single_choice'),
  choiceValue: z.string().min(1),
});

export const multiSelectAnswerSchema = z.object({
  answerType: z.literal('multi_select'),
  valueJson: z.object({
    selectedOptions: z.array(z.string()).min(1),
    otherText: z.string().optional().nullable(),
  }),
});

export const rankingAnswerSchema = z.object({
  answerType: z.literal('ranking'),
  valueJson: z.object({
    rankedOptions: z.array(
      z.object({
        rank: z.number().int().min(1),
        optionValue: z.string().min(1),
      }),
    ),
  }),
});

export const textAnswerSchema = z.object({
  answerType: z.literal('text'),
  textValue: z.string().trim().min(1),
  severity: z.number().int().optional(),
});

export const imageTagAnswerSchema = z.object({
  answerType: z.literal('image_tag'),
  assetId: z.string().min(1),
  tagPosition: tagPositionSchema,
  tagType: z.string().min(1),
  severity: z.number().int().optional(),
  textValue: z.string().trim().min(1),
});

export const participantImageTagAnswerSchema = z.object({
  answerType: z.literal('participant_image_tag'),
  tagPosition: tagPositionSchema,
  tagType: z.string().min(1),
  severity: z.number().int().optional(),
  textValue: z.string().trim().optional(),
  valueJson: z
    .object({
      participantImage: z
        .object({
          storageBucket: z.string().min(1),
          storagePath: z.string().min(1),
        })
        .passthrough(),
      tagIndex: z.number().int().min(1).optional(),
    })
    .passthrough(),
});

export const attentionCheckAnswerSchema = z.object({
  answerType: z.literal('attention_check'),
  choiceValue: z.string().optional(),
  scoreValue: z.number().int().optional(),
});

export const answerInputSchema = z.discriminatedUnion('answerType', [
  profileAnswerSchema,
  experienceAnswerSchema,
  scaleAnswerSchema,
  singleChoiceAnswerSchema,
  multiSelectAnswerSchema,
  rankingAnswerSchema,
  textAnswerSchema,
  imageTagAnswerSchema,
  participantImageTagAnswerSchema,
  attentionCheckAnswerSchema,
]);
