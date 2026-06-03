import { UserRole } from "@/lib/auth/auth-utils";

export type ProjectStatus = "ACTIVE" | "COMPLETED" | "ON_HOLD";

export interface IProject {
  id: string;
  name: string;
  description: string | null;
  deadline: string;
  status: ProjectStatus;
  createdById: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  _count: {
    tasks: number;
    members: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IProjectMember {
  id: string;
  projectId: string;
  userId: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: UserRole;
    status?: string;
  };
}

export interface IProjectDetail extends IProject {
  members: IProjectMember[];
}

export interface IProjectSummary {
  taskStats: {
    total: number;
    todo: number;
    inProgress: number;
    completed: number;
  };
  memberWorkload: {
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
  }[];
}

export interface IProjectQueryParams {
  searchTerm?: string;
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}
