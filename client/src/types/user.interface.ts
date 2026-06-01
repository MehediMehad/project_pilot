import { UserRole } from "@/lib/auth/auth-utils";

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "ACTIVE" | "BLOCKED";
  profilePhoto?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IUserQueryParams {
  searchTerm?: string;
  page?: number;
  limit?: number;
  status?: string;
  role?: string;
}

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export interface IUsersResponse {
  success: boolean;
  message: string;
  data: {
    users: IUser[];
    meta: IPaginationMeta;
  };
}
