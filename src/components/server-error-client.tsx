"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, LayoutDashboard, LogIn, ServerCrash } from "lucide-react";

interface ServerErrorClientProps {
  role?: "SUPER_ADMIN" | "ADVERTISER" | null;
  reset?: () => void;
}

export function ServerErrorClient({ role, reset }: ServerErrorClientProps) {
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
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-rose-500/[0.03] rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-red-600/[0.04] rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1.5s" }} />
      </div>

      {/* Glassmorphic Container Card */}
      <div className="relative z-10 w-full max-w-lg text-center animate-fade-in">
        <div 
          className="p-8 md:p-12 rounded-[32px] border backdrop-blur-xl shadow-2xl flex flex-col items-center gap-6"
          style={{
            background: "rgba(9, 18, 32, 0.65)",
            borderColor: "rgba(244, 63, 94, 0.12)",
            boxShadow: "0 24px 64px -12px rgba(0, 0, 0, 0.7)"
          }}
        >
          {/* Animated Illustration */}
          <div className="relative flex items-center justify-center w-24 h-24 mb-2">
            <div className="absolute inset-0 rounded-full bg-rose-500/10 border border-rose-500/20 pulse-ring" />
            <div className="absolute inset-2 rounded-full bg-rose-500/20 border border-rose-500/30" />
            <ServerCrash className="relative w-10 h-10 text-rose-400 float-animation" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <span 
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{
                background: "linear-gradient(90deg, #f43f5e, #fb7185)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              Error Code 500
            </span>
            <h1 
              className="text-4xl md:text-5xl font-extrabold tracking-tight"
              style={{ 
                fontFamily: "var(--font-display)",
                color: "var(--text-primary)"
              }}
            >
              Server Hiccup
            </h1>
          </div>

          {/* Subtext */}
          <p className="text-sm leading-relaxed max-w-md" style={{ color: "var(--text-secondary)" }}>
            Our server encountered an unexpected error and couldn't process your request. Please try refreshing or return to security.
          </p>

          {/* Dynamic Interactive Elements / Bubbles inside the card */}
          <div className="absolute bottom-4 left-6 pointer-events-none opacity-40">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400 bubble1" />
          </div>
          <div className="absolute top-10 right-10 pointer-events-none opacity-45">
            <div className="w-2 h-2 rounded-full bg-rose-400 bubble2" />
          </div>
          <div className="absolute bottom-16 right-8 pointer-events-none opacity-30">
            <div className="w-1 h-1 rounded-full bg-red-400 bubble3" />
          </div>

          {/* Navigation Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-4">
            <button
              onClick={() => reset ? reset() : window.location.reload()}
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
              <RefreshCw className="w-4 h-4" />
              <span>Retry Request</span>
            </button>

            <Link
              href={dashboardUrl}
              className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-bold transition-all duration-200 text-white"
              style={{
                background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)",
                boxShadow: "0 4px 20px -4px rgba(244,63,94,0.45)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 28px -4px rgba(244,63,94,0.6)";
                e.currentTarget.style.filter = "brightness(1.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 4px 20px -4px rgba(244,63,94,0.45)";
                e.currentTarget.style.filter = "none";
              }}
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
