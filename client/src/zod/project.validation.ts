import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  deadline: z.string().min(1, "Deadline is required"),
  status: z.enum(["ACTIVE", "COMPLETED", "ON_HOLD"]).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, "Project name cannot be empty").optional(),
  description: z.string().optional(),
  deadline: z.string().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "ON_HOLD"]).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
