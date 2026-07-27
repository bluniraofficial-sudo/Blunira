"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  FolderHeart,
  LogOut,
  QrCode,
  Settings,
  ListTodo,
  UserCheck,
  Tag,
  X,
  Menu,
  Droplets,
  ChevronRight,
  Send,
  MessageSquare,
  ShoppingCart,
  Package,
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: "SUPER_ADMIN" | "ADVERTISER";
    advertiserId?: string | null;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isAdmin = user.role === "SUPER_ADMIN";

  const adminLinks = [
    { label: "Overview",       href: "/admin/dashboard",   icon: BarChart3,   group: "Analytics" },
    { label: "Advertisers",    href: "/admin/advertisers", icon: Building2,   group: "Management" },
    { label: "Campaigns",      href: "/admin/campaigns",   icon: FolderHeart, group: "Management" },
    { label: "QR Codes",       href: "/admin/qr-codes",    icon: QrCode,      group: "Management" },
    { label: "Coupons",        href: "/admin/coupons",     icon: Tag,         group: "Management" },
    { label: "Orders",         href: "/admin/orders",      icon: ShoppingCart, group: "Commerce" },
    { label: "Products",       href: "/admin/products",    icon: Package,     group: "Commerce" },
    { label: "CRM Dashboard",   href: "/admin/crm",         icon: Send,        group: "Marketing" },
    { label: "WhatsApp Setup", href: "/admin/whatsapp",    icon: MessageSquare, group: "Marketing" },
    { label: "Leads",          href: "/admin/leads",       icon: UserCheck,   group: "Data" },
    { label: "Audit Logs",     href: "/admin/audit-logs",  icon: ListTodo,    group: "Data" },
    { label: "Settings",       href: "/admin/settings",    icon: Settings,    group: "System" },
  ];

  const advertiserLinks = [
    { label: "Dashboard",      href: "/advertiser/dashboard",  icon: BarChart3,   group: "Analytics" },
    { label: "My Campaigns",   href: "/advertiser/campaigns",  icon: FolderHeart, group: "Marketing" },
    { label: "My Coupons",     href: "/advertiser/coupons",    icon: Tag,         group: "Marketing" },
    { label: "Orders",         href: "/advertiser/orders",     icon: ShoppingCart, group: "Commerce" },
    { label: "CRM Dashboard",   href: "/advertiser/crm",        icon: Send,        group: "Marketing" },
    { label: "WhatsApp Setup",  href: "/advertiser/whatsapp",   icon: MessageSquare, group: "Marketing" },
    { label: "Captured Leads", href: "/advertiser/leads",      icon: UserCheck,   group: "Data" },
    { label: "Settings",       href: "/advertiser/settings",   icon: Settings,    group: "System" },
  ];

  const links = isAdmin ? adminLinks : advertiserLinks;

  // Group links
  const groups = [...new Set(links.map(l => l.group))];

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) window.location.href = "/auth/login";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const initials = user.name
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* ── Brand ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/[0.04]">
        <div className="relative flex-shrink-0">
          <img src="/favicon.png" alt="Blunira" className="w-9 h-9 object-cover rounded-xl border border-white/[0.08]" />
          {/* Live indicator */}
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#050c14] pulse-ring" />
        </div>
        <div>
          <span className="block text-sm font-black text-white tracking-tight leading-none">
            Blunira
          </span>
          <span className="block text-[9px] font-semibold text-cyan-600/80 mt-0.5 uppercase tracking-widest">
            {isAdmin ? "Control Center" : "Brand Portal"}
          </span>
        </div>
      </div>

      {/* ── Navigation ─────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {groups.map(group => (
          <div key={group}>
            <p className="px-3 mb-2 text-[9px] font-extrabold text-[#4a6580] uppercase tracking-[0.12em]">
              {group}
            </p>
            <div className="space-y-0.5">
              {links
                .filter(l => l.group === group)
                .map(link => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`nav-link ${isActive ? "active" : ""}`}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan-400 rounded-r-full" />
                      )}
                      <Icon className="nav-icon" />
                      <span className="flex-1">{link.label}</span>
                      {isActive && <ChevronRight className="w-3 h-3 text-cyan-500/60" />}
                    </Link>
                  );
                })
              }
            </div>
          </div>
        ))}
      </nav>

      {/* ── User Footer ────────────────────────────────────── */}
      <div className="p-3 border-t border-white/[0.04]">
        {/* Role pill */}
        <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-xs font-black text-white flex-shrink-0 shadow-md shadow-cyan-900/30">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-xs font-bold text-white truncate">{user.name}</span>
            <span className="block text-[9px] font-semibold uppercase tracking-wider mt-0.5"
              style={{ color: isAdmin ? "#22d3ee" : "#a78bfa" }}>
              {isAdmin ? "Super Admin" : "Advertiser"}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-[#4a6580] hover:text-rose-400 hover:bg-rose-500/8 border border-transparent hover:border-rose-500/15"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile top bar ───────────────────────────────── */}
      <div 
        className="lg:hidden w-full flex items-center justify-between px-5 py-3.5 border-b z-20 backdrop-blur-sm sticky top-0"
        style={{ background: "var(--bg-surface)", borderColor: "var(--card-border)" }}
      >
        <div className="flex items-center gap-2.5">
          <img src="/favicon.png" alt="Blunira" className="w-7 h-7 object-cover rounded-lg border border-white/[0.08] flex-shrink-0" />
          <span className="text-sm font-black text-[var(--text-primary)] tracking-tight">Blunira</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl border text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
          style={{ borderColor: "var(--card-border)" }}
        >
          {isOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
        </button>
      </div>

      {/* ── Desktop sidebar ──────────────────────────────── */}
      <aside 
        className={`
          fixed inset-y-0 left-0 w-60 z-30 flex flex-col border-r backdrop-blur-xl
          transform transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{ background: "var(--bg-surface)", borderColor: "var(--card-border)" }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile backdrop ──────────────────────────────── */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-20"
        />
      )}
    </>
  );
}
