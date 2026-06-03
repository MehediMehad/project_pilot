// LoginPage.tsx
import LoginForm from "@/components/modules/Auth/LoginForm";
import Image from "next/image";
import loginImg from "@/assets/images/login.png";
import { ShieldCheck, UsersRound, Zap, Headset } from "lucide-react";

const LoginPage = async ({
  searchParams,
}: {
  searchParams?: Promise<{ redirect?: string }>;
}) => {
  const params = (await searchParams) || {};

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Left Panel - Image Background */}
      <div className="hidden lg:block w-1/2 relative bg-[#060b26] min-h-screen">
        <Image
          src={loginImg}
          alt="TaskFlow Pro"
          fill
          className="object-cover object-left"
          priority
        />
      </div>

      {/* Right Panel - Login Card */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between items-center p-6 sm:p-10 lg:p-12 min-h-screen">
        {/* Spacer to push card to center */}
        <div className="hidden lg:block h-4" />

        <div className="w-full max-w-[540px] my-auto">
          <LoginForm redirect={params.redirect} />
        </div>

        {/* Footer Features Section */}
        <div className="w-full max-w-[620px] mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-slate-800 leading-none">
                Secure & Safe
              </p>
              <p className="text-[9px] text-slate-500 mt-0.5">
                Your data is protected
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <UsersRound className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-slate-800 leading-none">
                Role Based Access
              </p>
              <p className="text-[9px] text-slate-500 mt-0.5">
                Admin, Manager & Member
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-slate-800 leading-none">
                Real-time Updates
              </p>
              <p className="text-[9px] text-slate-500 mt-0.5">
                Instant notifications
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Headset className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-slate-800 leading-none">
                24/7 Support
              </p>
              <p className="text-[9px] text-slate-500 mt-0.5">
                We're here to help
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
