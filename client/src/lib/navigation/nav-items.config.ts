import { NavSection } from "@/app/(dashboardLayout)/admin/_types/dashboard.type";
import { getDefaultDashboardRoute, UserRole } from "../auth/auth-utils";

export const getCommonNavItems = (role: UserRole): NavSection[] => {
    const defaultDashboard = getDefaultDashboardRoute(role);

    return [
        {
            items: [
                {
                    title: "Home",
                    href: "/",
                    icon: "Home",
                    roles: ["USER", "ADMIN"],
                },
                {
                    title: "Dashboard",
                    href: defaultDashboard,
                    icon: "LayoutDashboard",
                    roles: ["USER", "ADMIN"],
                },
                {
                    title: "User Management",
                    href: "/admin/dashboard/user-management",
                    icon: "UserCog",
                    roles: ["ADMIN"],
                },
                {
                    title: "My Profile",
                    href: `/settings/profile`,
                    icon: "User",
                    roles: ["USER", "ADMIN"],
                },
            ]
        },
        {
            title: "Settings",
            items: [
                {
                    title: "Change Password",
                    href: "/settings/change-password",
                    icon: "Settings",
                    roles: ["USER", "ADMIN"],
                },
            ],
        },
    ]
}

export const getNavItemsByRole = async (role: UserRole): Promise<NavSection[]> => {
    return getCommonNavItems(role);
}
