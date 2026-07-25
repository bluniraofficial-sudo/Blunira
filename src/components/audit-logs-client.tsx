"use client";

import { useState } from "react";
import {
  ListTodo,
  Search,
  Calendar,
  Globe,
  User,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface AuditLogsClientProps {
  initialLogs: any[];
}

export function AuditLogsClient({ initialLogs }: AuditLogsClientProps) {
  const [logs, setLogs] = useState(initialLogs);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;

  // Filter logs
  const filtered = logs.filter(
    (log) =>
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(search.toLowerCase())) ||
      (log.user && log.user.name.toLowerCase().includes(search.toLowerCase())) ||
      (log.user && log.user.email.toLowerCase().includes(search.toLowerCase())) ||
      (log.ipAddress && log.ipAddress.includes(search))
  );

  // Pagination
  const totalPages = Math.ceil(filtered.length / limit) || 1;
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  // Color mapper helper based on event type
  const getActionColor = (action: string) => {
    if (action.includes("LOGIN") || action.includes("LOGOUT")) {
      return "bg-blue-500/10 border-blue-500/20 text-blue-400";
    }
    if (action.includes("CREATE") || action.includes("GENERATE")) {
      return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    }
    if (action.includes("UPDATE") || action.includes("EDIT")) {
      return "bg-purple-500/10 border-purple-500/20 text-purple-400";
    }
    if (action.includes("RESET") || action.includes("FORGOT")) {
      return "bg-amber-500/10 border-amber-500/20 text-amber-400";
    }
    if (action.includes("DELETE") || action.includes("SUSPEND")) {
      return "bg-red-500/10 border-red-500/20 text-red-400";
    }
    return "bg-gray-500/10 border-gray-500/20 text-gray-400";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Audit Logs</h1>
        <p className="text-gray-400 text-xs mt-1">
          Historical record of system changes, authentication events, and database actions.
        </p>
      </div>

      {/* Control Actions Row */}
      <div className="flex bg-[#12141c]/40 border border-white/5 rounded-2xl p-3 max-w-md">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search action code, description, user, IP..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-[#171924]/85 border border-white/5 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>
      </div>

      {/* Table view */}
      <div className="bg-[#12141c]/65 border border-white/5 rounded-3xl p-6 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-gray-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Trigger User</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Event Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginated.length > 0 ? (
                paginated.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.01] text-gray-300 font-medium">
                    {/* Event Type */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    {/* Details Description */}
                    <td className="py-3.5 px-4 max-w-sm">
                      <span className="text-white font-semibold leading-normal block">{log.details || "N/A"}</span>
                    </td>

                    {/* Trigger User */}
                    <td className="py-3.5 px-4">
                      {log.user ? (
                        <div>
                          <span className="font-bold text-gray-200 block">{log.user.name}</span>
                          <span className="text-[10px] text-gray-500 block">
                            {log.user.email} ({log.user.role.name === "SUPER_ADMIN" ? "Admin" : "Advertiser"})
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500 italic flex items-center gap-1">
                          <Shield className="h-3 w-3" /> System Account
                        </span>
                      )}
                    </td>

                    {/* IP Address */}
                    <td className="py-3.5 px-4 font-mono text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5 text-gray-600 shrink-0" />
                        <span>{log.ipAddress || "Unknown"}</span>
                      </span>
                    </td>

                    {/* Event Date */}
                    <td className="py-3.5 px-4 text-gray-500 text-[10px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
            <span className="text-[10px] text-gray-500 font-bold">
              Showing page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 bg-[#1c1f2a] border border-white/5 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 bg-[#1c1f2a] border border-white/5 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
