import { z } from 'zod';

export const VALID_REPORT_SECTIONS = [
  'executiveSummary',
  'majorContributions',
  'technicalWork',
  'skillsDemonstrated',
  'projects',
  'achievedGoals',
  'learningAndDevelopment',
  'overallYearSummary',
] as const;

export const YearParamDto = z.object({
  year: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 2000 && val <= 2100, {
      message: 'Year must be a valid 4-digit year',
    }),
});

export const EditSectionParamsDto = z.object({
  year: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 2000 && val <= 2100, {
      message: 'Year must be a valid 4-digit year',
    }),
  name: z.enum(VALID_REPORT_SECTIONS),
});

export const EditSectionBodyDto = z.object({
  content: z.string().trim().min(1, 'Section content cannot be empty'),
});

export type EditSectionInput = z.infer<typeof EditSectionBodyDto>;
