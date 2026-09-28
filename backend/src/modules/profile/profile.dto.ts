import { z } from 'zod';

export const SetupProfileDto = z.object({
  name: z.string().min(2).optional(),
  jobRole: z.string().min(1, 'Job role is required'),
  department: z.string().min(1, 'Department is required'),
  reviewYear: z.number().int().min(2000).max(2100).optional(),
  skills: z.array(z.string()).optional().default([]),
  currentProjects: z.array(z.string()).optional().default([]),
  joiningDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  professionalBackground: z.string().optional().default(''),
});

export type SetupProfileInput = z.infer<typeof SetupProfileDto>;

export const UpdateProfileDto = z.object({
  name: z.string().min(2).optional(),
  jobRole: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  reviewYear: z.number().int().min(2000).max(2100).optional(),
  skills: z.array(z.string()).optional(),
  currentProjects: z.array(z.string()).optional(),
  joiningDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  professionalBackground: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileDto>;
