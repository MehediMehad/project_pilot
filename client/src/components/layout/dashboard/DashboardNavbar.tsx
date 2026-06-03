import { getDefaultDashboardRoute } from "@/lib/auth/auth-utils";
import { getNavItemsByRole } from "@/lib/navigation/nav-items.config";
import { getUserInfo } from "@/services/auth/user-info.service";
import DashboardNavbarContent from "./DashboardNavbarContent";
import { IUser } from "@/types";

const DashboardNavbar = async () => {
  const userInfo = (await getUserInfo()) as IUser;
  const navItems = await getNavItemsByRole(userInfo.role);
  const dashboardHome = getDefaultDashboardRoute(userInfo.role);

  return (
    <DashboardNavbarContent
      userInfo={userInfo}
      navItems={navItems}
      dashboardHome={dashboardHome}
    />
  );
};

export default DashboardNavbar;
