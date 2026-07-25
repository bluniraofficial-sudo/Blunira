"use client";

import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  QrCode, Users, Percent, RefreshCw, Eye,
  Laptop, Globe, MapPin, TrendingUp, Award, Calendar, Droplets,
  Smartphone, Tablet, Monitor, Clock, ChevronLeft, ChevronRight, Activity,
} from "lucide-react";

interface AdminDashboardClientProps { data: any; }

const CHART_COLORS = ["#06b6d4","#6366f1","#2dd4bf","#f59e0b","#f43f5e","#10b981"];

const tooltipStyle = {
  backgroundColor: "#091220",
  border: "1px solid rgba(6,182,212,0.15)",
  borderRadius: "12px",
  color: "#e2eaf4",
  fontSize: "11px",
  boxShadow: "0 8px 24px -4px rgba(0,0,0,0.5)",
};

export function AdminDashboardClient({ data }: AdminDashboardClientProps) {
  const {
    metrics, dailyGraph, monthlyGraph,
    deviceBreakdown, browserBreakdown, cityBreakdown, campaignComparison,
  } = data;

  const statCards = [
    {
      title: "Total Scans",
      value: metrics.totalScans.toLocaleString(),
      sub: "All-time across all QR codes",
      icon: QrCode,
      accent: "#06b6d4",
      glow: "rgba(6,182,212,0.15)",
    },
    {
      title: "Unique Scans",
      value: metrics.uniqueScans.toLocaleString(),
      sub: "Distinct IP addresses",
      icon: Eye,
      accent: "#6366f1",
      glow: "rgba(99,102,241,0.15)",
    },
    {
      title: "Repeat Scans",
      value: metrics.repeatScans.toLocaleString(),
      sub: "Returning visitors",
      icon: RefreshCw,
      accent: "#f59e0b",
      glow: "rgba(245,158,11,0.12)",
    },
    {
      title: "Leads Captured",
      value: metrics.leads.toLocaleString(),
      sub: "Form submissions",
      icon: Users,
      accent: "#10b981",
      glow: "rgba(16,185,129,0.12)",
    },
    {
      title: "Conversion",
      value: `${metrics.conversionRate}%`,
      sub: "Leads / total scans",
      icon: Percent,
      accent: "#f43f5e",
      glow: "rgba(244,63,94,0.12)",
    },
  ];

  return (
    <div className="space-y-7 animate-fade-in">

      {/* ── Page header ───────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Droplets className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-black text-white tracking-tight">System Overview</h1>
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Real-time scan analytics, lead conversions &amp; device intelligence across all campaigns.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold"
          style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.14)", color: "#22d3ee" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse inline-block" />
          Live data
        </div>
      </div>

      {/* ── KPI stat cards ────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="stat-card p-5 cursor-default"
              style={{ "--accent": card.accent } as any}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}>
                  {card.title}
                </p>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: card.glow, border: `1px solid ${card.accent}22` }}>
                  <Icon className="w-4 h-4" style={{ color: card.accent }} />
                </div>
              </div>
              <p className="text-2xl font-black text-white leading-none tracking-tight">{card.value}</p>
              <p className="text-[10px] mt-1.5" style={{ color: "var(--text-muted)" }}>{card.sub}</p>
              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 h-0.5 w-full rounded-b-xl opacity-60"
                style={{ background: `linear-gradient(90deg, ${card.accent}, transparent)` }} />
            </div>
          );
        })}
      </div>

      {/* ── Area + Bar charts ─────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Daily area chart */}
        <div className="section-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-white">Daily Activity</h2>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>Scans &amp; leads — last 7 days</p>
            </div>
            <div className="p-2 rounded-lg" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.14)" }}>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyGraph} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="gScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="date" stroke="#4a6580" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#4a6580" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "rgba(6,182,212,0.15)", strokeWidth: 1 }} />
                <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "12px" }} />
                <Area type="monotone" dataKey="scans" stroke="#06b6d4" strokeWidth={2} fill="url(#gScans)" name="Scans" dot={false} activeDot={{ r: 4, fill: "#06b6d4" }} />
                <Area type="monotone" dataKey="leads" stroke="#10b981" strokeWidth={2} fill="url(#gLeads)" name="Leads" dot={false} activeDot={{ r: 4, fill: "#10b981" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly bar chart */}
        <div className="section-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-white">Monthly Totals</h2>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>Volume — last 6 months</p>
            </div>
            <div className="p-2 rounded-lg" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.14)" }}>
              <Calendar className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyGraph} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="month" stroke="#4a6580" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#4a6580" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(6,182,212,0.04)" }} />
                <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "12px" }} />
                <Bar dataKey="scans" fill="#06b6d4" radius={[4,4,0,0]} name="Scans" maxBarSize={28} />
                <Bar dataKey="leads" fill="#6366f1" radius={[4,4,0,0]} name="Leads" maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Devices / Browsers / Cities ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Device Pie */}
        <div className="section-card">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-1.5 rounded-lg" style={{ background: "rgba(6,182,212,0.08)" }}>
              <Laptop className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <h2 className="text-sm font-bold text-white">Device Types</h2>
          </div>
          {deviceBreakdown.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deviceBreakdown} cx="50%" cy="50%" innerRadius={52} outerRadius={70} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {deviceBreakdown.map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>No device data yet</p>
            </div>
          )}
        </div>

        {/* Browser bars */}
        <div className="section-card">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-1.5 rounded-lg" style={{ background: "rgba(99,102,241,0.08)" }}>
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <h2 className="text-sm font-bold text-white">Top Browsers</h2>
          </div>
          {browserBreakdown.length > 0 ? (
            <div className="space-y-4 mt-2">
              {[...browserBreakdown]
                .sort((a: any, b: any) => b.value - a.value)
                .slice(0, 4)
                .map((b: any, i: number) => {
                  const total = browserBreakdown.reduce((s: number, x: any) => s + x.value, 0);
                  const pct = total > 0 ? Math.round((b.value / total) * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between mb-1.5 text-xs font-semibold">
                        <span style={{ color: "var(--text-primary)" }}>{b.name}</span>
                        <span style={{ color: "var(--text-muted)" }}>{pct}%</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill-cyan" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>No browser data yet</p>
            </div>
          )}
        </div>

        {/* City bars */}
        <div className="section-card">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-1.5 rounded-lg" style={{ background: "rgba(245,158,11,0.08)" }}>
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <h2 className="text-sm font-bold text-white">Top Cities</h2>
          </div>
          {cityBreakdown.length > 0 ? (
            <div className="space-y-4 mt-2">
              {cityBreakdown.slice(0, 4).map((city: any, i: number) => {
                const total = cityBreakdown.reduce((s: number, x: any) => s + x.value, 0);
                const pct = total > 0 ? Math.round((city.value / total) * 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between mb-1.5 text-xs font-semibold">
                      <span style={{ color: "var(--text-primary)" }}>{city.name}</span>
                      <span style={{ color: "var(--text-muted)" }}>{city.value} scans</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill-amber" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>No location data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Campaign conversion table ──────────────────────── */}
      <div className="section-card">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-1.5 rounded-lg" style={{ background: "rgba(16,185,129,0.08)" }}>
            <Award className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Campaign Conversions</h2>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Performance breakdown per campaign</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Scans</th>
                <th>Leads</th>
                <th>Conversion Rate</th>
              </tr>
            </thead>
            <tbody>
              {campaignComparison.length > 0 ? (
                campaignComparison.map((camp: any, i: number) => (
                  <tr key={i}>
                    <td className="font-semibold" style={{ color: "var(--text-primary)" }}>{camp.name}</td>
                    <td>{camp.scans}</td>
                    <td>{camp.leads}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-400">{camp.conversion}%</span>
                        <div className="flex-1 max-w-20 progress-track">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(camp.conversion, 100)}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-10" style={{ color: "var(--text-muted)" }}>
                    No campaigns yet. Create one from the Campaigns page.
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
