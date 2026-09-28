import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdValidator = z
  .string()
  .refine((val) => mongoose.isValidObjectId(val), {
    message: 'Invalid ObjectId format',
  });

export const CreateAchievedGoalDto = z.object({
  title: z.string().trim().min(1, 'Goal title is required'),
  description: z.string().trim().optional().default(''),
  project: z.string().trim().optional().default(''),
  category: z.string().trim().optional().default(''),
  impactScore: z.number().optional(),
  keyOutcomes: z.array(z.string().trim()).optional().default([]),
  completedAt: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
  relatedActivityIds: z.array(objectIdValidator).optional().default([]),
});

export type CreateAchievedGoalInput = z.infer<typeof CreateAchievedGoalDto>;

export const UpdateAchievedGoalDto = z.object({
  title: z.string().trim().min(1, 'Goal title cannot be empty').optional(),
  description: z.string().trim().optional(),
  project: z.string().trim().optional(),
  category: z.string().trim().optional(),
  impactScore: z.number().optional(),
  keyOutcomes: z.array(z.string().trim()).optional(),
  completedAt: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
  relatedActivityIds: z.array(objectIdValidator).optional(),
});

export type UpdateAchievedGoalInput = z.infer<typeof UpdateAchievedGoalDto>;

export const LinkActivitiesDto = z.object({
  activityIds: z
    .array(objectIdValidator)
    .min(1, 'At least one activity ID must be provided'),
});

export type LinkActivitiesInput = z.infer<typeof LinkActivitiesDto>;

export const ListAchievedGoalsQueryDto = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().trim().optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10) || 20)) : 20)),
});

export type ListAchievedGoalsQuery = z.infer<typeof ListAchievedGoalsQueryDto>;
