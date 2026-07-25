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
  CreditCard,
  History,
  TrendingUp,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface AdvertiserSettingsClientProps {
  advertiser: any;
  notifications: any[];
}

export function AdvertiserSettingsClient({
  advertiser,
  notifications: initialNotifications,
}: AdvertiserSettingsClientProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeTab, setActiveTab] = useState<"profile" | "billing">("profile");

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

  const mockInvoices = [
    { id: "INV-0912", date: "July 01, 2026", amount: "$49.00", status: "PAID" },
    { id: "INV-0803", date: "June 01, 2026", amount: "$49.00", status: "PAID" },
    { id: "INV-0711", date: "May 01, 2026", amount: "$49.00", status: "PAID" },
  ];

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
          onClick={() => setActiveTab("billing")}
          className={`px-5 py-3 border-b-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "billing"
              ? "border-purple-500 text-purple-300 bg-purple-950/10"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Billing & Scaffolding</span>
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

      {/* TAB 2: BILLING SYSTEM */}
      {activeTab === "billing" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs animate-fade-in">
          {/* Active Plan Stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#12141c]/65 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />

              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/15 text-blue-400 rounded-xl">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-wide">Active Plan</h2>
                  <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider block mt-0.5">
                    Quotas & Subscription
                  </span>
                </div>
              </div>

              <div className="space-y-5 border-t border-white/5 pt-4 text-gray-400">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">
                    Current Tier
                  </span>
                  <span className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                    Pro Growth ($49/month)
                  </span>
                </div>

                {/* Quotas */}
                <div className="space-y-3">
                  {/* Scans Quota */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold text-[10px]">
                      <span>Monthly QR Scans limit</span>
                      <span className="text-white">128 / 5,000</span>
                    </div>
                    <div className="w-full bg-[#171924] h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full" style={{ width: "2.5%" }} />
                    </div>
                  </div>

                  {/* Campaign Limit */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold text-[10px]">
                      <span>Active Campaigns limit</span>
                      <span className="text-white">1 / 10</span>
                    </div>
                    <div className="w-full bg-[#171924] h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full" style={{ width: "10%" }} />
                    </div>
                  </div>
                </div>

                {/* Payment details */}
                <div className="border-t border-white/5 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-bold">Credit Card</span>
                    <span className="text-white font-mono font-bold flex items-center gap-1">
                      Visa •••• 4242
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-bold">Next Invoice</span>
                    <span className="text-white font-bold">August 01, 2026</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice History & Upgrade scaffolding */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice History */}
            <div className="bg-[#12141c]/65 border border-white/5 rounded-3xl p-6 shadow-xl">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <History className="h-4.5 w-4.5 text-purple-400" />
                <span>Invoice History</span>
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-500 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Invoice ID</th>
                      <th className="py-2.5 px-3">Billing Date</th>
                      <th className="py-2.5 px-3">Total Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    {mockInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-white/[0.01]">
                        <td className="py-3 px-3 font-mono font-bold text-white">{inv.id}</td>
                        <td className="py-3 px-3">{inv.date}</td>
                        <td className="py-3 px-3 font-bold">{inv.amount}</td>
                        <td className="py-3 px-3">
                          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.5 rounded-md text-[9px]">
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Billing upgrades mock screen */}
            <div className="bg-[#12141c]/65 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <span className="absolute top-4 right-4 text-[9px] font-extrabold uppercase bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                SaaS Expansion Scaffolding
              </span>
              <h2 className="text-sm font-bold text-white mb-2">Upgrade Subscriptions</h2>
              <p className="text-gray-400 mb-6 text-[11px] leading-relaxed">
                Platform Billing system integrates with Stripe API hooks. To unlock higher scan rates or remote media CDN distribution upload limits, request a tier upgrade.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-white/5 hover:border-purple-500/20 bg-[#1c1f2b]/40 rounded-2xl p-4 text-center">
                  <span className="block font-bold text-white text-sm">Enterprise VIP</span>
                  <span className="block text-gray-500 text-[10px] mt-1">Unlimited Scans & Media uploads</span>
                  <span className="block font-black text-white text-lg mt-2">$199<span className="text-[10px] font-normal text-gray-500">/mo</span></span>
                  <button className="w-full mt-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl text-[10px]">
                    Upgrade Plan
                  </button>
                </div>
                <div className="border border-white/5 bg-[#1c1f2b]/15 rounded-2xl p-4 text-center opacity-60">
                  <span className="block font-bold text-white text-sm">Scale Plan</span>
                  <span className="block text-gray-500 text-[10px] mt-1">Up to 25,000 Scans / mo</span>
                  <span className="block font-black text-white text-lg mt-2">$99<span className="text-[10px] font-normal text-gray-500">/mo</span></span>
                  <button disabled className="w-full mt-4 py-2 bg-white/5 text-gray-500 font-bold rounded-xl text-[10px] cursor-not-allowed">
                    Current Tier
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
