"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  QrCode,
  Users,
  Percent,
  RefreshCw,
  Eye,
  Laptop,
  Globe,
  MapPin,
  TrendingUp,
  Award,
  Smartphone,
  Tablet,
  Monitor,
  Clock,
  ChevronLeft,
  ChevronRight,
  Activity,
} from "lucide-react";

interface AdvertiserDashboardClientProps {
  data: any;
}

const COLORS = ["#3b82f6", "#06b6d4", "#a855f7", "#fbbf24", "#ef4444", "#10b981"];

export function AdvertiserDashboardClient({ data }: AdvertiserDashboardClientProps) {
  const {
    metrics,
    dailyGraph,
    monthlyGraph,
    deviceBreakdown,
    osBreakdown,
    browserBreakdown,
    cityBreakdown,
    campaignComparison,
  } = data;

  const statCards = [
    {
      title: "My Total Scans",
      value: metrics.totalScans,
      change: "Scans across all my QR Codes",
      icon: QrCode,
      color: "from-blue-600/20 to-cyan-600/10",
      iconColor: "text-blue-400",
    },
    {
      title: "Unique Scans",
      value: metrics.uniqueScans,
      change: "Unique IP scans",
      icon: Eye,
      color: "from-purple-600/20 to-indigo-600/10",
      iconColor: "text-purple-400",
    },
    {
      title: "Repeat Scans",
      value: metrics.repeatScans,
      change: "Returning visitor counts",
      icon: RefreshCw,
      color: "from-amber-600/20 to-yellow-600/10",
      iconColor: "text-amber-400",
    },
    {
      title: "My Captured Leads",
      value: metrics.leads,
      change: "Submissions captured",
      icon: Users,
      color: "from-emerald-600/20 to-teal-600/10",
      iconColor: "text-emerald-400",
    },
    {
      title: "Conversion Rate",
      value: `${metrics.conversionRate}%`,
      change: "Average conversion",
      icon: Percent,
      color: "from-pink-600/20 to-rose-600/10",
      iconColor: "text-pink-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Campaign Performance</h1>
        <p className="text-gray-400 text-xs mt-1">
          Monitor QR code scans, landing page engagement, and capture rates for your active campaigns.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className={`bg-gradient-to-br ${card.color} border border-white/5 rounded-3xl p-5 hover:border-white/10 transition-all shadow-xl`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2 bg-black/30 rounded-xl ${card.iconColor}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-white tracking-tight">
                  {card.value}
                </span>
                <span className="block text-[10px] text-gray-500 font-semibold mt-1">
                  {card.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Daily scans chart */}
        <div className="bg-[#12141c]/65 border border-white/5 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Daily Activity</h2>
              <span className="text-[10px] text-gray-500 font-semibold">Total scans vs leads generated</span>
            </div>
            <TrendingUp className="h-5 w-5 text-purple-400" />
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyGraph} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scansColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="leadsColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="date" stroke="#4b5563" fontSize={10} tickLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#161925",
                    borderColor: "rgba(255,255,255,0.05)",
                    borderRadius: "14px",
                    color: "#f3f4f6",
                    fontSize: "11px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
                <Area
                  type="monotone"
                  dataKey="scans"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#scansColor)"
                  name="QR Scans"
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#leadsColor)"
                  name="Leads"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly scans chart */}
        <div className="bg-[#12141c]/65 border border-white/5 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Monthly Summary</h2>
              <span className="text-[10px] text-gray-500 font-semibold">Monthly performance charts</span>
            </div>
            <Eye className="h-5 w-5 text-blue-400" />
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyGraph} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="month" stroke="#4b5563" fontSize={10} tickLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#161925",
                    borderColor: "rgba(255,255,255,0.05)",
                    borderRadius: "14px",
                    color: "#f3f4f6",
                    fontSize: "11px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
                <Bar dataKey="scans" fill="#3b82f6" radius={[4, 4, 0, 0]} name="QR Scans" />
                <Bar dataKey="leads" fill="#10b981" radius={[4, 4, 0, 0]} name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Devices & Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device breakdown */}
        <div className="bg-[#12141c]/65 border border-white/5 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <Laptop className="h-4.5 w-4.5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">User Devices</h2>
          </div>
          <div className="h-56 w-full flex items-center justify-center">
            {deviceBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {deviceBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#161925",
                      borderColor: "rgba(255,255,255,0.05)",
                      borderRadius: "10px",
                      fontSize: "10px",
                      color: "#fff",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px", bottom: 0 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-gray-500">No device data available</span>
            )}
          </div>
        </div>

        {/* Operating Systems */}
        <div className="bg-[#12141c]/65 border border-white/5 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="h-4.5 w-4.5 text-purple-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">Top Browsers</h2>
          </div>
          <div className="space-y-4">
            {browserBreakdown.length > 0 ? (
              browserBreakdown
                .sort((a: any, b: any) => b.value - a.value)
                .slice(0, 4)
                .map((b: any, idx: number) => {
                  const total = browserBreakdown.reduce((sum: number, item: any) => sum + item.value, 0);
                  const percent = total > 0 ? ((b.value / total) * 100).toFixed(0) : "0";
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-300">{b.name}</span>
                        <span className="text-gray-400">{percent}% ({b.value})</span>
                      </div>
                      <div className="w-full bg-[#1b1e2a] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
            ) : (
              <span className="text-xs text-gray-500 block text-center py-10">No browser data</span>
            )}
          </div>
        </div>

        {/* Geolocation */}
        <div className="bg-[#12141c]/65 border border-white/5 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="h-4.5 w-4.5 text-amber-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">Top Locations</h2>
          </div>
          <div className="space-y-4">
            {cityBreakdown.length > 0 ? (
              cityBreakdown.map((city: any, idx: number) => {
                const total = cityBreakdown.reduce((sum: number, item: any) => sum + item.value, 0);
                const percent = total > 0 ? ((city.value / total) * 100).toFixed(0) : "0";
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-300">{city.name}</span>
                      <span className="text-gray-400">{city.value} scans</span>
                    </div>
                    <div className="w-full bg-[#1b1e2a] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <span className="text-xs text-gray-500 block text-center py-10">No scans logged</span>
            )}
          </div>
        </div>
      </div>

      {/* Campaigns Comparison */}
      <div className="bg-[#12141c]/65 border border-white/5 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <Award className="h-4.5 w-4.5 text-emerald-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">My Active Campaigns Conversion</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-gray-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Campaign Name</th>
                <th className="py-3 px-4">Total Scans</th>
                <th className="py-3 px-4">Leads Captured</th>
                <th className="py-3 px-4">Conversion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {campaignComparison.length > 0 ? (
                campaignComparison.map((camp: any, idx: number) => (
                  <tr key={idx} className="hover:bg-white/[0.02] text-gray-300 font-medium">
                    <td className="py-3.5 px-4 font-bold text-white">{camp.name}</td>
                    <td className="py-3.5 px-4">{camp.scans}</td>
                    <td className="py-3.5 px-4">{camp.leads}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-bold">{camp.conversion}%</span>
                        <div className="w-16 bg-[#1b1e2a] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${Math.min(camp.conversion, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    No campaigns created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
