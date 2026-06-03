import { getDefaultDashboardRoute } from "@/lib/auth/auth-utils";
import { getNavItemsByRole } from "@/lib/navigation/nav-items.config";
import { getUserInfo } from "@/services/auth/user-info.service";
import { NavSection } from "@/types/core.type";
import DashboardSidebarContent from "./DashboardSidebarContent";
import { IUser } from "@/types";

const DashboardSidebar = async () => {
  const userInfo = (await getUserInfo()) as IUser;

  const navItems: NavSection[] = await getNavItemsByRole(userInfo.role);
  const dashboardHome = getDefaultDashboardRoute(userInfo.role);

  return (
    <DashboardSidebarContent
      userInfo={userInfo}
      navItems={navItems}
      dashboardHome={dashboardHome}
    />
  );
};

export default DashboardSidebar;
