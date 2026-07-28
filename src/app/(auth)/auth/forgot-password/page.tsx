"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft, Mail, QrCode, ShieldCheck, Sparkles } from "lucide-react";
import { LoadingButton } from "@/components/ui/loading-button";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setDevToken(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Request failed");
      }

      setIsSubmitted(true);
      if (result.token) {
        setDevToken(result.token);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
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
          {!isSubmitted ? (
            <>
              <div className="mb-6">
                <span className="text-[10px] text-purple-400 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Password Recovery</span>
                </span>
                <h2 className="text-xl font-bold text-white mt-1.5">Forgot Password</h2>
                <p className="text-gray-400 text-[11px] mt-1 leading-relaxed">
                  Enter your email address and we'll send you instructions to reset your account credentials.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-5 flex items-start gap-3 p-4 bg-red-950/30 border border-red-900/40 rounded-2xl text-red-200">
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                      <Mail className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type="email"
                      {...register("email")}
                      placeholder="name@company.com"
                      className="w-full pl-11 pr-4 py-3 bg-[#171924] border border-white/5 focus:border-purple-500/50 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all text-xs"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 text-[10px] text-red-400">{errors.email.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <LoadingButton loading={isSubmitting} variant="primary" type="submit" className="!w-full !py-3.5">
                  Send Instructions
                </LoadingButton>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-4">
                <ShieldCheck className="h-7 w-7 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1.5">Check your inbox</h2>
              <p className="text-gray-400 text-[11px] mb-6 leading-relaxed">
                If that email matches an account in our system, we've sent reset links and instructions.
              </p>

              {/* Developer Assist Box */}
              {devToken && (
                <div className="mt-6 p-5 bg-purple-950/20 border border-purple-900/40 rounded-2xl text-left">
                  <span className="inline-block text-[9px] uppercase font-bold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded-full mb-3">
                    Development helper
                  </span>
                  <p className="text-[11px] text-gray-300 leading-relaxed mb-4">
                    Since this local sandbox is not hooked to a live SMTP mail server, click the button below to directly complete the test workflow:
                  </p>
                  <Link
                    href={`/auth/reset-password?token=${devToken}`}
                    className="block text-center py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/20 text-xs font-semibold rounded-xl transition-all"
                  >
                    Direct Password Reset URL
                  </Link>
                  <span className="block mt-2.5 text-[8px] text-gray-500 break-all text-center">
                    Token: {devToken}
                  </span>
                </div>
              )}
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
