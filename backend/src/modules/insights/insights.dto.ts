import { z } from 'zod';

export const YearQueryDto = z.object({
  year: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : new Date().getFullYear())),
});

export type YearQueryInput = z.infer<typeof YearQueryDto>;
