import { UserRole } from "@/lib/auth/auth-utils";

export type TaskPriority = "HIGH" | "MEDIUM" | "LOW";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";

export interface ITask {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  projectId: string;
  project?: {
    id: string;
    name: string;
  };
  assignedToId: string | null;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: UserRole;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ITaskQueryParams {
  searchTerm?: string;
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  projectId?: string;
  assignedToId?: string;
  overdue?: string;
  upcoming?: string;
  sortBy?: string;
  sortOrder?: string;
}
