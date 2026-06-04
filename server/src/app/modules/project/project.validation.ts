import { z } from 'zod';

const createProject = z.object({
  body: z.object({
    name: z.string().min(1, 'Project name is required'),
    description: z.string().optional(),
    deadline: z.string().refine(
      (val) => {
        const parsed = Date.parse(val);
        if (isNaN(parsed)) return false;
        const date = new Date(parsed);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      },
      { message: 'Please select a valid deadline.' },
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
      .refine(
        (val) => {
          const parsed = Date.parse(val);
          if (isNaN(parsed)) return false;
          const date = new Date(parsed);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return date >= today;
        },
        { message: 'Please select a valid deadline.' },
      )
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
