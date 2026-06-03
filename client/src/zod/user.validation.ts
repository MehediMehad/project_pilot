import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  role: z.enum(["PROJECT_MANAGER", "TEAM_MEMBER"], { message: "Role is required" }),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).optional(),
  status: z.enum(["ACTIVE", "BLOCKED"]).optional(),
});
