import { z } from 'zod';

export const WeeklyQueryDto = z.object({
  weekStart: z
    .string()
    .min(1, 'weekStart query parameter is required')
    .transform((val) => new Date(val)),
});

export const GenerateWeeklySummaryDto = z.object({
  weekStart: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  weekEnd: z
    .string()
    .or(z.date())
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
});

export const EditWeeklySummaryDto = z.object({
  majorWork: z.array(z.string().trim()).optional(),
  technicalAreas: z.array(z.string().trim()).optional(),
  aiInsight: z.string().trim().optional(),
});

export type EditWeeklySummaryInput = z.infer<typeof EditWeeklySummaryDto>;

export const MonthlyQueryDto = z.object({
  month: z
    .string()
    .or(z.number())
    .transform((val) => (typeof val === 'string' ? parseInt(val, 10) : val))
    .refine((val) => val >= 1 && val <= 12, {
      message: 'Month must be between 1 and 12',
    }),
  year: z
    .string()
    .or(z.number())
    .transform((val) => (typeof val === 'string' ? parseInt(val, 10) : val)),
});

export const GenerateMonthlySummaryDto = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
});

export const EditMonthlySummaryDto = z.object({
  majorWorkAreas: z.array(z.string().trim()).optional(),
  skillsDemonstrated: z.array(z.string().trim()).optional(),
  aiSummary: z.string().trim().optional(),
});

export type EditMonthlySummaryInput = z.infer<typeof EditMonthlySummaryDto>;

export const ListSummariesQueryDto = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10) || 20)) : 20)),
});
