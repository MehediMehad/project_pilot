import { UserStatus } from '@prisma/client';
import { z } from 'zod';

const registerUser = z.object({
  name: z.string().min(1, { message: 'Name is required!' }),
  email: z.string().email({ message: 'Must be a valid email!' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long!' }),
});

const updateUser = z.object({
  name: z.string().optional(),
});

const updateStatus = z.object({
  body: z.object({
    status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED]),
  }),
});

export const userValidation = {
  registerUser,
  updateUser,
  updateStatus,
};
