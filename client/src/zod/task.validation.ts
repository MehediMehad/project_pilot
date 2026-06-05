import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(100, "Title is too long"),
  description: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required").refine(
    (val) => {
      const parsed = Date.parse(val);
      if (isNaN(parsed)) return false;
      const date = new Date(parsed);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    },
    {
      message: "Please select a valid deadline.",
    }
  ),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]).default("TODO"),
  projectId: z.string().min(1, "Project is required"),
  assignedToId: z.string().nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, "Task title cannot be empty").max(100, "Title is too long").optional(),
  description: z.string().optional().nullable(),
  dueDate: z.string().refine(
    (val) => {
      if (!val) return true;
      const parsed = Date.parse(val);
      if (isNaN(parsed)) return false;
      const date = new Date(parsed);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    },
    {
      message: "Please select a valid deadline.",
    }
  ).optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]).optional(),
  assignedToId: z.string().nullable().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
