import { z } from 'zod';

const createTask = z.object({
  body: z.object({
    title: z.string().min(1, 'Task title is required'),
    description: z.string().optional(),
    dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format for dueDate',
    }),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).optional(),
    projectId: z.string().min(1, 'Project ID is required'),
    assignedToId: z.string().optional().nullable(),
  }),
});

const updateTask = z.object({
  body: z.object({
    title: z.string().min(1, 'Task title cannot be empty').optional(),
    description: z.string().optional().nullable(),
    dueDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format for dueDate',
      })
      .optional(),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).optional(),
    assignedToId: z.string().optional().nullable(),
  }),
});

const changeStatus = z.object({
  body: z.object({
    status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']),
  }),
});

const assignTask = z.object({
  body: z.object({
    assignedToId: z.string().optional().nullable(),
  }),
});

const createComment = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment content cannot be empty'),
  }),
});

const updateComment = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment content cannot be empty'),
  }),
});

export const taskValidation = {
  createTask,
  updateTask,
  changeStatus,
  assignTask,
  createComment,
  updateComment,
};
