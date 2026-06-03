import { NavSection } from "@/types/core.type";
import { getDefaultDashboardRoute, UserRole } from "../auth/auth-utils";

export const getCommonNavItems = (role: UserRole): NavSection[] => {
    const defaultDashboard = getDefaultDashboardRoute(role);

    // Build the projects path based on role
    const projectsPath = `${defaultDashboard}/projects`;

    return [
        {
            items: [
                {
                    title: "Home",
                    href: "/",
                    icon: "Home",
                    roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"],
                },
                {
                    title: "Dashboard",
                    href: defaultDashboard,
                    icon: "LayoutDashboard",
                    roles: ["PROJECT_MANAGER", "TEAM_MEMBER", "ADMIN"],
                },
                {
                    title: "Projects",
                    href: projectsPath,
                    icon: "FolderKanban",
                    roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"],
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
                    roles: ["PROJECT_MANAGER", "TEAM_MEMBER", "ADMIN"],
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
                    roles: ["PROJECT_MANAGER", "TEAM_MEMBER", "ADMIN"],
                },
            ],
        },
    ]
}

export const getNavItemsByRole = async (role: UserRole): Promise<NavSection[]> => {
    return getCommonNavItems(role);
}
