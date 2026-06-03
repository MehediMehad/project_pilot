import MyProfile from "@/components/modules/Common/MyProfile";
import { getUserInfo } from "@/services/auth/user-info.service";

const MyProfilePage = async () => {
  const userInfo = await getUserInfo();
  return <MyProfile userInfo={userInfo} />;
};

export default MyProfilePage;
