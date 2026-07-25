"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Lock, QrCode, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      setErrorMsg("Reset token is missing. Please request a new link.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Password reset failed");
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-transparent overflow-hidden px-4 text-xs">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-0.5 bg-[#11131c]/65 border border-white/5 rounded-2xl shadow-xl mb-4 overflow-hidden w-12 h-12">
            <img src="/favicon.png" alt="Blunira" className="w-full h-full object-cover rounded-2xl" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Blunira</h1>
        </div>

        {/* Form Card */}
        <div className="bg-[#11131c]/65 border border-white/5 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          {!token ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center p-3 bg-red-500/10 border border-red-500/20 rounded-2xl mb-4">
                <ShieldAlert className="h-7 w-7 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1.5">Invalid Request</h2>
              <p className="text-gray-400 text-[11px] mb-6 px-4 leading-relaxed">
                The password reset token is missing or invalid. Please check your link or request a new one.
              </p>
              <Link
                href="/auth/forgot-password"
                className="inline-block px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Request Reset Email
              </Link>
            </div>
          ) : !isSuccess ? (
            <>
              <div className="mb-6">
                <span className="text-[10px] text-purple-400 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Credential Update</span>
                </span>
                <h2 className="text-xl font-bold text-white mt-1.5">Reset Password</h2>
                <p className="text-gray-400 text-[11px] mt-1 leading-relaxed">
                  Please enter and confirm your new password below.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-5 flex items-start gap-3 p-4 bg-red-950/30 border border-red-900/40 rounded-2xl text-red-200">
                  <ShieldAlert className="h-5 w-5 shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* New Password */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                      <Lock className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-11 py-3 bg-[#171924] border border-white/5 focus:border-purple-500/50 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-[10px] text-red-400">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                      <Lock className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("confirmPassword")}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-3 bg-[#171924] border border-white/5 focus:border-purple-500/50 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all text-xs"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-[10px] text-red-400">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-purple-950/20 disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-4">
                <ShieldCheck className="h-7 w-7 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1.5">Password Reset!</h2>
              <p className="text-gray-400 text-[11px] mb-2 px-4 leading-relaxed">
                Your password has been successfully updated.
              </p>
              <p className="text-[11px] text-purple-400 font-bold animate-pulse mt-3">
                Redirecting to secure login in 3 seconds...
              </p>
            </div>
          )}

          {/* Footer Back Link */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
