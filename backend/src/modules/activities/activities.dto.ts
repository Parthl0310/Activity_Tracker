import { z } from 'zod';
import { ACTIVITY_CATEGORIES, ACTIVITY_WORK_TYPES } from '../../models/Activity.js';

export const CreateActivityDto = z.object({
  title: z.string().trim().optional(),
  text: z.string().trim().min(1, 'Activity text is required'),
  workDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .refine(
      (date) => {
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        return date <= endOfToday;
      },
      { message: 'Future dates are not allowed' }
    ),
  project: z.string().trim().optional().default(''),
  category: z.enum(ACTIVITY_CATEGORIES).optional(),
  skills: z.array(z.string().trim()).optional().default([]),
  keywords: z.array(z.string().trim()).optional().default([]),
  workType: z.enum(ACTIVITY_WORK_TYPES).optional(),
  aiRefinedText: z.string().trim().optional(),
});

export type CreateActivityInput = z.infer<typeof CreateActivityDto>;

export const EnrichPreviewDto = z.object({
  text: z.string().trim().min(1, 'Activity text is required'),
  project: z.string().trim().optional(),
});

export type EnrichPreviewInput = z.infer<typeof EnrichPreviewDto>;

export const UpdateActivityDto = z.object({
  title: z.string().trim().optional(),
  text: z.string().trim().min(1, 'Activity text cannot be empty').optional(),
  aiRefinedText: z.string().trim().optional(),
  workDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .refine(
      (date) => {
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        return date <= endOfToday;
      },
      { message: 'Future dates are not allowed' }
    )
    .optional(),

  project: z.string().trim().optional(),
  category: z.enum(ACTIVITY_CATEGORIES).optional(),
  skills: z.array(z.string().trim()).optional(),
  keywords: z.array(z.string().trim()).optional(),
  workType: z.enum(ACTIVITY_WORK_TYPES).optional(),
});

export type UpdateActivityInput = z.infer<typeof UpdateActivityDto>;

export const ListActivitiesQueryDto = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  project: z.string().trim().optional(),
  category: z.string().trim().optional(),
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

export type ListActivitiesQuery = z.infer<typeof ListActivitiesQueryDto>;
