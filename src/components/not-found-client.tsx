"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Compass, LayoutDashboard, LogIn } from "lucide-react";

interface NotFoundClientProps {
  role?: "SUPER_ADMIN" | "ADVERTISER" | null;
}

export function NotFoundClient({ role }: NotFoundClientProps) {
  const router = useRouter();

  let dashboardUrl = "/auth/login";
  let buttonText = "Back to Login";
  let ButtonIcon = LogIn;

  if (role === "SUPER_ADMIN") {
    dashboardUrl = "/admin/dashboard";
    buttonText = "Admin Dashboard";
    ButtonIcon = LayoutDashboard;
  } else if (role === "ADVERTISER") {
    dashboardUrl = "/advertiser/dashboard";
    buttonText = "Advertiser Dashboard";
    ButtonIcon = LayoutDashboard;
  }

  return (
    <div 
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden px-4"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Dynamic ambient background glows */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/[0.05] rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-600/[0.05] rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Glassmorphic Container Card */}
      <div className="relative z-10 w-full max-w-lg text-center animate-fade-in">
        <div 
          className="p-8 md:p-12 rounded-[32px] border backdrop-blur-xl shadow-2xl flex flex-col items-center gap-6"
          style={{
            background: "rgba(9, 18, 32, 0.65)",
            borderColor: "rgba(6, 182, 212, 0.12)",
            boxShadow: "0 24px 64px -12px rgba(0, 0, 0, 0.7)"
          }}
        >
          {/* Animated Illustration */}
          <div className="relative flex items-center justify-center w-24 h-24 mb-2">
            <div className="absolute inset-0 rounded-full bg-cyan-500/10 border border-cyan-500/20 pulse-ring" />
            <div className="absolute inset-2 rounded-full bg-cyan-500/20 border border-cyan-500/30" />
            <Compass className="relative w-10 h-10 text-cyan-400 float-animation" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <span 
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{
                background: "linear-gradient(90deg, var(--cyan-400), var(--teal-400))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              Error Code 404
            </span>
            <h1 
              className="text-4xl md:text-5xl font-extrabold tracking-tight"
              style={{ 
                fontFamily: "var(--font-display)",
                color: "var(--text-primary)"
              }}
            >
              Lost in Space
            </h1>
          </div>

          {/* Subtext */}
          <p className="text-sm leading-relaxed max-w-md" style={{ color: "var(--text-secondary)" }}>
            The page you are looking for has either been moved, deleted, or never existed in the first place. Let's get you back on track.
          </p>

          {/* Dynamic Interactive Elements / Bubbles inside the card */}
          <div className="absolute bottom-4 left-6 pointer-events-none opacity-40">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 bubble1" />
          </div>
          <div className="absolute top-10 right-10 pointer-events-none opacity-45">
            <div className="w-2 h-2 rounded-full bg-teal-400 bubble2" />
          </div>
          <div className="absolute bottom-16 right-8 pointer-events-none opacity-30">
            <div className="w-1 h-1 rounded-full bg-blue-400 bubble3" />
          </div>

          {/* Navigation Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-4">
            <button
              onClick={() => router.back()}
              className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-bold transition-all border duration-200"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                borderColor: "rgba(255, 255, 255, 0.08)",
                color: "var(--text-primary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>

            <Link
              href={dashboardUrl}
              className="w-full sm:w-1/2 btn-primary flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-bold transition-all duration-200 text-white"
            >
              <ButtonIcon className="w-4 h-4" />
              <span>{buttonText}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
