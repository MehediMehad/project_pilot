// import { cookies } from "next/headers";
// import { redirect } from "next/navigation";
// import jwt, { JwtPayload } from "jsonwebtoken";
// import { getDefaultDashboardRoute, UserRole } from "@/lib/auth/auth-utils";

// export const dynamic = "force-dynamic";

// export default async function RootPage() {
//   const cookieStore = await cookies();
//   const accessToken = cookieStore.get("accessToken")?.value || null;

//   if (!accessToken) {
//     redirect("/login");
//   }

//   try {
//     const verifiedToken = jwt.verify(
//       accessToken,
//       process.env.JWT_SECRET as string
//     ) as JwtPayload;

//     const userRole = verifiedToken.role as UserRole;
//     redirect(getDefaultDashboardRoute(userRole));
//   } catch (error) {
//     console.error("Error verifying token in root page redirect:", error);
//     redirect("/login");
//   }

//   return null;
// }

const page = () => {
  return (
    <div>
      <h1>This is page component</h1>
    </div>
  );
};

export default page;
