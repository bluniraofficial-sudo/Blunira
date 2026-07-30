"use client";

import { useState } from "react";
import { markNotificationAsReadAction } from "@/app/actions/notification";
import {
  Building,
  User,
  Mail,
  Phone,
  CheckCircle,
  Bell,
  Check,
  Calendar,
  BarChart3,
  TrendingUp,
  QrCode,
  Users,
  Sparkles,
} from "lucide-react";

interface AdvertiserSettingsClientProps {
  advertiser: any;
  notifications: any[];
  analytics: {
    totalScans: number;
    totalLeads: number;
    activeCampaigns: number;
    month: { scans: number; leads: number };
    quarter: { scans: number; leads: number };
    year: { scans: number; leads: number };
  };
}

export function AdvertiserSettingsClient({
  advertiser,
  notifications: initialNotifications,
  analytics,
}: AdvertiserSettingsClientProps) {
const [notifications, setNotifications] = useState(initialNotifications);
  const [activeTab, setActiveTab] = useState<"profile" | "analytics">("profile");

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsReadAction(id);
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Tabs */}
      <div className="flex border-b border-white/5 text-xs font-semibold gap-1">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-5 py-3 border-b-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "profile"
              ? "border-purple-500 text-purple-300 bg-purple-950/10"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <Building className="h-4 w-4" />
          <span>Tenant Profile</span>
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-5 py-3 border-b-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "analytics"
              ? "border-purple-500 text-purple-300 bg-purple-950/10"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Analytics</span>
        </button>
      </div>

      {/* TAB 1: PROFILE & NOTIFICATIONS */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 text-xs animate-fade-in">
          {/* Profile Details (Left) */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-[#12141c]/65 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />

              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-purple-500/10 border border-purple-500/15 text-purple-400 rounded-xl">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-wide">Brand Identity</h2>
                  <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider block mt-0.5">
                    My Workspace Details
                  </span>
                </div>
              </div>

              <div className="space-y-4 border-t border-white/5 pt-4 text-gray-400">
                {/* Company Name */}
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">
                    Company Name
                  </span>
                  <span className="text-sm font-black text-white">{advertiser?.companyName || "N/A"}</span>
                </div>

                {/* Contact Name */}
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">
                    Contact Person
                  </span>
                  <div className="flex items-center gap-2 text-white">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold">{advertiser?.name || "N/A"}</span>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">
                    Billing Email
                  </span>
                  <div className="flex items-center gap-2 text-white">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold">{advertiser?.email || "N/A"}</span>
                  </div>
                </div>

                {/* Phone */}
                {advertiser?.phone && (
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">
                      Contact Phone
                    </span>
                    <div className="flex items-center gap-2 text-white">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold">{advertiser.phone}</span>
                    </div>
                  </div>
                )}

                {/* Status */}
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">
                    Subscription Status
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold uppercase px-3 py-1 rounded-full text-[9px]">
                    <CheckCircle className="h-3 w-3" />
                    <span>Active Sandbox Tenant</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Panel (Right) */}
          <div className="xl:col-span-2">
            <div className="bg-[#12141c]/65 border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col h-[65vh] justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-blue-500/10 border border-blue-500/15 text-blue-400 rounded-xl">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white tracking-wide">Workspace Alerts</h2>
                    <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider block mt-0.5">
                      Recent platform events
                    </span>
                  </div>
                </div>

                {/* Notification list */}
                <div className="space-y-3 overflow-y-auto max-h-[48vh] pr-2">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-4 p-4 border rounded-2xl transition-all ${
                          n.isRead
                            ? "bg-[#161823]/30 border-white/5 opacity-60"
                            : "bg-[#1c1f2f]/60 border-purple-500/20 shadow-md shadow-purple-900/5"
                        }`}
                      >
                        <div className="mt-1 shrink-0">
                          {n.isRead ? (
                            <div className="p-1 bg-white/5 rounded-md text-gray-500">
                              <Check className="h-3.5 w-3.5" />
                            </div>
                          ) : (
                            <div className="p-1 bg-purple-500/10 border border-purple-500/30 rounded-md text-purple-400">
                              <Sparkles className="h-3.5 w-3.5" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-bold text-white text-xs">{n.title}</span>
                            <span className="text-[9px] text-gray-500 font-mono">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-400 text-[11px] leading-relaxed">{n.message}</p>
                        </div>

                        {!n.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(n.id)}
                            className="ml-auto p-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded-lg transition-all cursor-pointer shrink-0 border border-purple-500/20"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 text-gray-500 flex flex-col items-center justify-center gap-2 border border-dashed border-white/5 rounded-2xl">
                      <Bell className="h-8 w-8 text-gray-600 mb-1" />
                      <span>No alerts log recorded.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs animate-fade-in">
          {/* Overview Stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#12141c]/65 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/15 text-blue-400 rounded-xl">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-wide">Performance</h2>
                  <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider block mt-0.5">
                    Scan & Lead Analytics
                  </span>
                </div>
              </div>
              <div className="space-y-4 border-t border-white/5 pt-4">
                <div className="flex items-center justify-between p-3 bg-[#171924]/60 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-cyan-400" />
                    <span className="text-gray-400 text-[11px] font-bold">Total Scans</span>
                  </div>
                  <span className="text-white font-black font-mono">{analytics.totalScans.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#171924]/60 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-400" />
                    <span className="text-gray-400 text-[11px] font-bold">Leads Captured</span>
                  </div>
                  <span className="text-white font-black font-mono">{analytics.totalLeads.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#171924]/60 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-purple-400" />
                    <span className="text-gray-400 text-[11px] font-bold">Active Campaigns</span>
                  </div>
                  <span className="text-white font-black font-mono">{analytics.activeCampaigns}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Period Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#12141c]/65 border border-white/5 rounded-3xl p-6 shadow-xl">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-purple-400" />
                <span>Period Breakdown</span>
              </h2>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: "This Month", period: analytics.month },
                  { label: "This Quarter", period: analytics.quarter },
                  { label: "This Year", period: analytics.year },
                ].map((p) => (
                  <div key={p.label} className="text-center p-4 bg-[#171924]/40 border border-white/5 rounded-2xl">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-2">{p.label}</span>
                    <span className="text-lg font-black text-white block font-mono">{p.period.scans.toLocaleString()}</span>
                    <span className="text-[9px] text-cyan-400 block font-semibold mt-0.5">{p.period.leads} leads</span>
                    <span className="text-[8px] text-gray-500 block mt-1">{p.period.scans} scans</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
