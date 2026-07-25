import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "./sidebar";
import { db } from "@/lib/db";
import Link from "next/link";
import { Zap } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { NotificationBell } from "./notification-bell";

interface DashboardLayoutShellProps {
  children: React.ReactNode;
}

export async function DashboardLayoutShell({ children }: DashboardLayoutShellProps) {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const unreadCount = await db.notification.count({
    where: { userId: session.userId, isRead: false },
  });

  const isAdmin = session.role === "SUPER_ADMIN";

  return (
    <div className="min-h-screen text-[var(--text-primary)] flex flex-col lg:flex-row" style={{ background: "var(--bg-base)" }}>
      
      {/* Ambient background glows — fixed, behind everything */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-cyan-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-blue-600/[0.04] rounded-full blur-[100px]" />
      </div>

      <Sidebar user={session} />

      {/* ── Main content area ──────────────────────────────── */}
      <main className="relative z-10 flex-1 lg:pl-60 min-h-screen flex flex-col">

        {/* ── Top header bar ─────────────────────────────── */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 border-b sticky top-0 z-20 backdrop-blur-xl"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--card-border)"
          }}
        >
          {/* Left: breadcrumb context */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest"
              style={{
                background: isAdmin ? "rgba(6,182,212,0.05)" : "rgba(139,92,246,0.05)",
                borderColor: isAdmin ? "rgba(6,182,212,0.15)" : "rgba(139,92,246,0.15)",
                color: isAdmin ? "var(--cyan-400)" : "#a78bfa",
              }}
            >
              <Zap className="w-3 h-3" />
              <span>{isAdmin ? "Platform Control Console" : "Advertiser Workspace"}</span>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-3">
            {/* System status pill */}
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold"
              style={{ background: "rgba(16,185,129,0.06)", color: "#34d399", border: "1px solid rgba(16,185,129,0.12)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              All systems operational
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Interactive Notification Bell */}
            <NotificationBell initialUnreadCount={unreadCount} />
          </div>
        </header>

        {/* ── Page content ───────────────────────────────── */}
        <div className="flex-1 p-5 lg:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
