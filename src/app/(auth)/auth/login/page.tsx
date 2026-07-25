"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const forbidden = searchParams?.get("error") === "forbidden"
    ? "Access denied. You don't have permission to view this page."
    : null;

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Login failed");
      const target = result.user.role === "SUPER_ADMIN" ? "/admin/dashboard" : "/advertiser/dashboard";
      window.location.href = target;
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #020509; }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .fade-up { animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }

        .login-input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          color: #e2eaf4;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          padding: 14px 16px 14px 44px;
        }
        .login-input::placeholder { color: #2e4a62; }
        .login-input:focus {
          border-color: rgba(6,182,212,0.5);
          background: rgba(6,182,212,0.03);
          box-shadow: 0 0 0 3px rgba(6,182,212,0.08);
        }
        .login-input.with-right { padding-right: 44px; }

        .submit-btn {
          width: 100%;
          padding: 15px 24px;
          background: linear-gradient(135deg, #06b6d4 0%, #2563eb 100%);
          border: none;
          border-radius: 14px;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.25s ease;
          box-shadow: 0 4px 24px rgba(6,182,212,0.3);
          letter-spacing: 0.01em;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(6,182,212,0.45);
          filter: brightness(1.08);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .icon-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          color: #2e4a62;
          transition: color 0.2s;
        }
        .icon-btn:hover { color: #8ba3bc; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#020509",
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* ── Background radial glows ── */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          {/* Top-left large glow */}
          <div style={{
            position: "absolute",
            top: "-20%",
            left: "-15%",
            width: "70%",
            height: "70%",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(6,182,212,0.09) 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "glow-pulse 8s ease-in-out infinite",
          }} />
          {/* Bottom-right glow */}
          <div style={{
            position: "absolute",
            bottom: "-20%",
            right: "-10%",
            width: "55%",
            height: "55%",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)",
            filter: "blur(80px)",
            animation: "glow-pulse 10s ease-in-out infinite 2s",
          }} />
          {/* Center subtle glow */}
          <div style={{
            position: "absolute",
            top: "40%",
            left: "40%",
            transform: "translate(-50%,-50%)",
            width: "40%",
            height: "40%",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%)",
            filter: "blur(60px)",
          }} />
          {/* Fine grid */}
          <div style={{
            position: "absolute",
            inset: 0,
            opacity: 0.018,
            backgroundImage: "linear-gradient(rgba(6,182,212,1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,1) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }} />
          {/* Top thin cyan line */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.4) 40%, rgba(6,182,212,0.4) 60%, transparent)",
          }} />
        </div>

        {/* ── Login Card ── */}
        <div className="fade-up" style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: "420px",
        }}>

          {/* Brand Mark */}
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            {/* Logo icon */}
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "20px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 0 1px rgba(6,182,212,0.1), 0 16px 40px rgba(0,0,0,0.4)",
              marginBottom: "16px",
              overflow: "hidden",
            }}>
              <img src="/favicon.png" alt="Blunira" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>

            <h1 style={{
              color: "#ffffff",
              fontSize: "28px",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              margin: "0 0 6px",
            }}>
              Blunira
            </h1>
            <p style={{ color: "#06b6d4", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em" }}>
              QR Hydration Marketing
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: "rgba(9,18,32,0.75)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "24px",
            padding: "36px",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 0.5px rgba(6,182,212,0.08)",
          }}>

            {/* Card header */}
            <div style={{ marginBottom: "28px" }}>
              <h2 style={{
                color: "#e2eaf4",
                fontSize: "19px",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                margin: "0 0 6px",
              }}>
                Welcome back
              </h2>
              <p style={{ color: "#4a6580", fontSize: "13px", lineHeight: 1.5 }}>
                Sign in to your workspace to continue
              </p>
            </div>

            {/* Error alert */}
            {(errorMsg || forbidden) && (
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "12px 14px",
                background: "rgba(239,68,68,0.07)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "12px",
                marginBottom: "20px",
                animation: "slide-in 0.3s ease",
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" style={{ flexShrink: 0, marginTop: "2px" }}>
                  <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>
                </svg>
                <p style={{ color: "#fca5a5", fontSize: "12.5px", lineHeight: 1.5 }}>
                  {errorMsg || forbidden}
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)}>

              {/* Email */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  display: "block",
                  color: "#4a6580",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.09em",
                  marginBottom: "8px",
                }}>
                  Email address
                </label>
                <div style={{ position: "relative" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2e4a62" strokeWidth="2"
                    style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                    <rect width="20" height="16" x="2" y="4" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  <input
                    type="email"
                    {...register("email")}
                    placeholder="admin@qrplatform.com"
                    className="login-input"
                  />
                </div>
                {errors.email && (
                  <p style={{ color: "#f87171", fontSize: "11.5px", marginTop: "6px", display: "flex", alignItems: "center", gap: "5px" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label style={{
                    color: "#4a6580",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.09em",
                  }}>
                    Password
                  </label>
                  <Link href="/auth/forgot-password" style={{
                    color: "#22d3ee",
                    fontSize: "11.5px",
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "opacity 0.2s",
                  }}>
                    Forgot password?
                  </Link>
                </div>
                <div style={{ position: "relative" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2e4a62" strokeWidth="2"
                    style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    placeholder="••••••••••"
                    className="login-input with-right"
                  />
                  <button type="button" className="icon-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && (
                  <p style={{ color: "#f87171", fontSize: "11.5px", marginTop: "6px", display: "flex", alignItems: "center", gap: "5px" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button type="submit" disabled={isLoading} className="submit-btn">
                {isLoading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Authenticating…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0 0" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.05)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2e4a62" strokeWidth="2">
                  <rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span style={{ color: "#2e4a62", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
                  JWT Secured
                </span>
              </div>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.05)" }} />
            </div>
          </div>

          {/* Footer */}
          <p style={{ textAlign: "center", color: "#1e3347", fontSize: "11.5px", marginTop: "20px" }}>
            © 2026 Blunira · Enterprise QR Hydration Marketing
          </p>
        </div>
      </div>
    </>
  );
}
