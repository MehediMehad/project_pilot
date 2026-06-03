import { z } from 'zod';

const createProject = z.object({
  body: z.object({
    name: z.string().min(1, 'Project name is required'),
    description: z.string().optional(),
    deadline: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      { message: 'Invalid date format' },
    ),
    status: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD']).optional(),
  }),
});

const updateProject = z.object({
  body: z.object({
    name: z.string().min(1, 'Project name cannot be empty').optional(),
    description: z.string().optional(),
    deadline: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' })
      .optional(),
    status: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD']).optional(),
  }),
});

const addMember = z.object({
  body: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),
});

export const projectValidation = {
  createProject,
  updateProject,
  addMember,
};
