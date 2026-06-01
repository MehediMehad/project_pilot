import { UserRole } from "@/lib/auth/auth-utils";

export interface UserInfo {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    profilePhoto?: string | null;
    status: "ACTIVE" | "BLOCKED";
    createdAt: string;
    updatedAt: string;
}
