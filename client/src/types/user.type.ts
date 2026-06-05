import { UserRole } from "@/lib/auth/auth-utils";

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "ACTIVE" | "BLOCKED";
  image?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IUserQueryParams {
  searchTerm?: string;
  page?: number;
  limit?: number;
  status?: string;
  role?: string;
  sortBy?: string;
  sortOrder?: string;
}




