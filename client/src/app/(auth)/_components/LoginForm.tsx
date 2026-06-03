"use client";

import { loginUser } from "@/app/(auth)/_services/login-user.service";
import InputFieldError from "@/components/common/InputFieldError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  LockKeyhole,
  Mail,
  ShieldAlert,
  User,
} from "lucide-react";

type DemoRole = "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER";

const DEMO_ACCOUNTS: Record<DemoRole, { email: string; name: string }> = {
  ADMIN: {
    email: "admin@gmail.com",
    name: "Admin",
  },
  PROJECT_MANAGER: {
    email: "project.manager.demo@gmail.com",
    name: "Project Manager",
  },
  TEAM_MEMBER: {
    email: "team.member.demo@gmail.com",
    name: "Team Member",
  },
};

const LoginForm = ({ redirect }: { redirect?: string }) => {
  const [state, formAction, isPending] = useActionState(loginUser, null);
  const [showPassword, setShowPassword] = useState(false);

  // Controlled fields to support demo logins
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeDemoRole, setActiveDemoRole] = useState<DemoRole | null>(null);

  useEffect(() => {
    if (state && !state.success && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  const handleSelectDemoRole = (role: DemoRole) => {
    setActiveDemoRole(role);
    setEmail(DEMO_ACCOUNTS[role].email);
    setPassword("123456");
  };

  return (
    <div className="w-full rounded-2xl border border-slate-100 bg-white p-8 text-slate-800 shadow-xl shadow-slate-100/50">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <LockKeyhole className="h-6 w-6" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back!</h1>
        <p className="mt-1.5 text-xs text-slate-400 font-medium">
          Sign in to continue to your account
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        {redirect && <input type="hidden" name="redirect" value={redirect} />}

        {/* Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-xs font-bold text-slate-700"
          >
            Email Address
          </label>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="h-11 rounded-lg border-slate-200 bg-white pl-11 text-slate-800 focus-visible:ring-primary/20 placeholder:text-slate-400"
            />
          </div>

          <InputFieldError field="email" state={state} />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="text-xs font-bold text-slate-700"
          >
            Password
          </label>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="h-11 rounded-lg border-slate-200 bg-white px-11 text-slate-800 focus-visible:ring-primary/20 placeholder:text-slate-400"
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
            >
              {showPassword ? (
                <EyeOff className="h-4.5 w-4.5" />
              ) : (
                <Eye className="h-4.5 w-4.5" />
              )}
            </button>
          </div>

          <InputFieldError field="password" state={state} />
        </div>

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 font-medium text-slate-500 cursor-pointer">
            <input
              type="checkbox"
              name="remember"
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20"
            />
            Remember me
          </label>

          <a
            href="/forgot-password"
            className="font-semibold text-primary hover:underline"
          >
            Forgot Password?
          </a>
        </div>

        {/* Login Button */}
        <Button
          type="submit"
          disabled={isPending}
          className="h-11 w-full rounded-lg bg-primary font-bold text-white hover:bg-primary/90 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/20 transition-all"
        >
          {isPending ? "Signing In..." : "Sign In"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 py-4">
        <div className="h-px flex-1 bg-slate-100" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or</span>
        <div className="h-px flex-1 bg-slate-100" />
      </div>

      {/* Try Demo Login Section */}
      <div className="rounded-xl bg-slate-50/60 p-5 border border-slate-100">
        <div className="flex items-start gap-2.5 mb-4">
          <ShieldAlert className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold text-slate-800 leading-none">Try Demo Login</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Experience the system with demo account</p>
          </div>
        </div>

        {/* Selector Tabs */}
        <div className="grid grid-cols-3 gap-2">
          {(["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"] as DemoRole[]).map((role) => (
            <Button
              key={role}
              type="button"
              variant={activeDemoRole === role ? "default" : "outline"}
              onClick={() => handleSelectDemoRole(role)}
              className={`rounded-xl py-3 px-1 text-[10px] font-bold uppercase tracking-wider transition-all min-h-[42px] cursor-pointer ${activeDemoRole === role
                  ? "bg-primary border-primary text-white shadow-md shadow-primary/25 hover:bg-primary/95"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
            >
              {role.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      {/* Register Link */}
      <p className="mt-5 text-center text-xs text-slate-400 font-medium">
        Don&apos;t have an account?{" "}
        <a
          href="/register"
          className="font-bold text-primary hover:underline"
        >
          Register here
        </a>
      </p>
    </div>
  );
};

export default LoginForm;
