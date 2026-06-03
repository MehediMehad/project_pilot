import { UserRole } from "@/lib/auth/auth-utils";

export interface NavItem {
    title: string;
    href: string;
    icon: string; // ✅ Changed from LucideIcon to string
    badge?: string | number;
    description?: string;
    roles: UserRole[];
}

export interface NavSection {
    title?: string;
    items: NavItem[];
}


export interface IPaginationMeta {
    page: number;
    limit: number;
    total: number;
}

export interface IPaginationResponse<T> {
    data: T[];
    meta: IPaginationMeta;
}

export interface INormalizedApiResponse<T> {
    data: T;
}

export interface IApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}