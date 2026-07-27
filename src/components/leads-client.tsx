"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { LoadingButton } from "@/components/ui/loading-button";

import {
  UserCheck,
  Search,
  Download,
  Trash2,
  Calendar,
  X,
  Mail,
  Phone,
  MapPin,
  Tag,
  ChevronLeft,
  ChevronRight,
  Laptop,
  Globe,
  Database,
  User,
  MessageSquare,
  QrCode,
  Loader2,
  Lock,
  Building2,
  FolderHeart,
  Filter,
} from "lucide-react";

interface LeadsClientProps {
  initialLeads: any[];
  role: "SUPER_ADMIN" | "ADVERTISER";
}

export function LeadsClient({ initialLeads, role }: LeadsClientProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"standard" | "expired">("standard");

  // Business (Advertiser) & Campaign Filter States
  const [selectedAdvertiser, setSelectedAdvertiser] = useState("ALL");
  const [selectedCampaign, setSelectedCampaign] = useState("ALL");
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // (Credentials are configured on the dedicated WhatsApp Setup page)


  const limit = 15;
  const isAdmin = role === "SUPER_ADMIN";

  const standardLeads = leads.filter(
    (l) =>
      (l.redemptions && l.redemptions.length > 0) ||
      (l.phone !== "00000000" && (!l.campaign.endDate || new Date(l.campaign.endDate) >= new Date()))
  );
  const expiredScans = leads.filter(
    (l) =>
      l.phone === "00000000" ||
      (l.campaign.endDate && new Date(l.campaign.endDate) < new Date())
  );

  const currentList = activeTab === "standard" ? standardLeads : expiredScans;

  // Unique list of businesses (advertisers) for dropdown filter
  const businesses = Array.from(
    new Set(
      leads
        .map((l) => l.campaign?.advertiser?.companyName || l.advertiser?.companyName)
        .filter(Boolean)
    )
  ).sort();

  // Unique list of campaigns for dropdown filter (filtered by business if selected)
  const campaignsList = Array.from(
    new Set(
      leads
        .filter((l) => {
          if (selectedAdvertiser === "ALL") return true;
          const advName = l.campaign?.advertiser?.companyName || l.advertiser?.companyName;
          return advName === selectedAdvertiser;
        })
        .map((l) => l.campaign?.name)
        .filter(Boolean)
    )
  ).sort();

  const filtered = currentList.filter((l) => {
    const advName = l.campaign?.advertiser?.companyName || l.advertiser?.companyName || "";
    const campName = l.campaign?.name || "";

    const matchesAdvertiser =
      selectedAdvertiser === "ALL" || advName === selectedAdvertiser;
    const matchesCampaign =
      selectedCampaign === "ALL" || campName === selectedCampaign;

    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.email && l.email.toLowerCase().includes(search.toLowerCase())) ||
      l.phone.includes(search) ||
      (l.city && l.city.toLowerCase().includes(search.toLowerCase())) ||
      campName.toLowerCase().includes(search.toLowerCase()) ||
      advName.toLowerCase().includes(search.toLowerCase()) ||
      (l.ipAddress && l.ipAddress.includes(search));

    return matchesAdvertiser && matchesCampaign && matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / limit) || 1;
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  // Toggle single lead selection
  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Select/Deselect all visible
  const toggleSelectAll = () => {
    const visibleIds = paginated.map((l) => l.id);
    const allSelected = visibleIds.every((id) => selectedLeadIds.includes(id));
    if (allSelected) {
      setSelectedLeadIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedLeadIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleExportCSV = () => {
    const headers =
      activeTab === "standard"
        ? ["Name", "Phone", "Email", "City", "Campaign Name", "Advertiser", "Unlocked Coupon", "Created Date"]
        : ["Name/Device", "Phone", "Email", "Location", "Campaign Name", "Advertiser", "IP Address", "User Agent", "Captured Date"];

    const rows =
      activeTab === "standard"
        ? filtered.map((l) => [
          l.name,
          l.phone,
          l.email || "N/A",
          l.city || "N/A",
          l.campaign.name,
          l.campaign.advertiser?.companyName || l.advertiser?.companyName || "N/A",
          l.redemptions?.[0]?.coupon?.code || "None",
          new Date(l.createdAt).toLocaleString(),
        ])
        : filtered.map((l) => [
          l.phone !== "00000000" ? l.name : l.name.replace("Device Scan Lead (", "").replace(")", ""),
          l.phone !== "00000000" ? l.phone : "None (Silent Capture)",
          l.email && l.email !== "device-scan@anonymous.com" ? l.email : "N/A",
          l.city || "N/A",
          l.campaign.name,
          l.campaign.advertiser?.companyName || l.advertiser?.companyName || "N/A",
          l.ipAddress || "N/A",
          l.userAgent || "N/A",
          new Date(l.createdAt).toLocaleString(),
        ]);

    const csvContent =
      "\uFEFF" +
      [
        headers.join(","),
        ...rows.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeTab === "standard" ? "customer_leads" : "ended_campaign_scans"
      }_export_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this record!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#06b6d4",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete it!",
      background: "var(--bg-elevated)",
      color: "var(--text-primary)",
      customClass: {
        popup: "border border-cyan-500/20 rounded-3xl",
      },
    });

    if (!result.isConfirmed) return;

    setDeletingId(id);

    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (res.ok) {
        setLeads(leads.filter((l) => l.id !== id));
        Swal.fire({
          title: "Deleted!",
          text: "Record has been deleted successfully.",
          icon: "success",
          background: "var(--bg-elevated)",
          color: "var(--text-primary)",
          customClass: {
            popup: "border border-cyan-500/20 rounded-3xl",
          },
        });
      } else {
        const err = await res.json();
        Swal.fire({
          title: "Error",
          text: err.error || "Failed to delete record",
          icon: "error",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ title: "Error", text: "Something went wrong", icon: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 text-[var(--text-primary)]">
            <Database className="h-6 w-6 text-cyan-400" />
            <span>Captured Records</span>
          </h1>
          <p className="text-[var(--text-muted)] text-xs mt-1">
            Browse customer leads, ended campaign scans, and export records.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer text-xs"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── Segment Tabs ────────────────────────────────────────── */}
      <div className="flex border-b text-xs font-semibold gap-1" style={{ borderColor: "var(--card-border)" }}>
        <button
          type="button"
          onClick={() => {
            setActiveTab("standard");
            setPage(1);
          }}
          className={`px-5 py-3 border-b-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${activeTab === "standard"
              ? "border-cyan-400 text-cyan-400 bg-cyan-500/10 font-bold"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
        >
          <User className="h-3.5 w-3.5" />
          <span>Customer Leads ({standardLeads.length})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("expired");
            setPage(1);
          }}
          className={`px-5 py-3 border-b-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${activeTab === "expired"
              ? "border-cyan-400 text-cyan-400 bg-cyan-500/10 font-bold"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
        >
          <Laptop className="h-3.5 w-3.5" />
          <span>Ended Campaign Scans ({expiredScans.length})</span>
        </button>
      </div>

      {/* ── Filter & Search Toolbar Card ────────────────────────── */}
      <div
        className="p-4 rounded-2xl border transition-all"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--card-border)" }}
      >
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">

          {/* Left Inputs Group: Search, Business Filter, Campaign Filter */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px] max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-400 z-10">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder={
                  activeTab === "standard"
                    ? "Search name, email, phone..."
                    : "Search device, IP, location..."
                }
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="input-field text-xs py-2.5 w-full font-medium"
                style={{ paddingLeft: "2.5rem" }}
              />
            </div>

            {/* Business / Advertiser Filter Dropdown */}
            <div className="relative min-w-[180px] max-w-xs flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-400 z-10">
                <Building2 className="h-4 w-4" />
              </div>
              <select
                value={selectedAdvertiser}
                onChange={(e) => {
                  setSelectedAdvertiser(e.target.value);
                  setSelectedCampaign("ALL"); // Reset campaign filter when business changes
                  setPage(1);
                }}
                className="input-field text-xs py-2.5 font-bold cursor-pointer w-full truncate"
                style={{ paddingLeft: "2.5rem" }}
              >
                <option value="ALL">🏢 All Businesses ({businesses.length})</option>
                {businesses.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Campaign Filter Dropdown */}
            <div className="relative min-w-[180px] max-w-xs flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400 z-10">
                <FolderHeart className="h-4 w-4" />
              </div>
              <select
                value={selectedCampaign}
                onChange={(e) => {
                  setSelectedCampaign(e.target.value);
                  setPage(1);
                }}
                className="input-field text-xs py-2.5 font-bold cursor-pointer w-full truncate"
                style={{ paddingLeft: "2.5rem" }}
              >
                <option value="ALL">🎯 All Campaigns ({campaignsList.length})</option>
                {campaignsList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters Button */}
            {(selectedAdvertiser !== "ALL" || selectedCampaign !== "ALL" || search) && (
              <button
                onClick={() => {
                  setSelectedAdvertiser("ALL");
                  setSelectedCampaign("ALL");
                  setSearch("");
                  setPage(1);
                }}
                className="px-3 py-2.5 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                title="Reset all filters"
              >
                <X className="w-4 h-4" />
                <span>Reset</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Table Section */}
      <div className="section-card overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === "standard" ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer Information</th>
                  <th>Contact Details</th>
                  <th>Campaign &amp; Advertiser</th>
                  <th>Unlocked Reward</th>
                  <th>Captured Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length > 0 ? (
                  paginated.map((l) => {
                    const hasCoupon = l.redemptions && l.redemptions.length > 0;
                    const coupon = hasCoupon ? l.redemptions[0].coupon : null;

                    return (
                      <tr key={l.id}>
                        <td>
                          <div className="font-bold text-[var(--text-primary)]">{l.name}</div>
                          {l.city && (
                            <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-cyan-500" />
                              <span>{l.city}</span>
                            </span>
                          )}
                        </td>

                        <td>
                          <div className="space-y-0.5">
                            <a
                              href={`tel:${l.phone}`}
                              className="text-cyan-400 font-mono hover:underline flex items-center gap-1 font-bold"
                            >
                              <Phone className="h-3 w-3" />
                              <span>{l.phone}</span>
                            </a>
                            {l.email && (
                              <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 truncate max-w-[180px]">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{l.email}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="font-bold text-[var(--text-primary)]">{l.campaign.name}</div>
                          <div className="text-[10px] text-purple-400 font-semibold">
                            {l.campaign.advertiser?.companyName || l.advertiser?.companyName || "N/A"}
                          </div>
                        </td>

                        <td>
                          {coupon ? (
                            <div className="inline-flex flex-col">
                              <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono font-bold rounded-lg text-[10px] flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {coupon.code}
                              </span>
                              {coupon.discount && (
                                <span className="text-[9px] text-emerald-400 font-bold mt-0.5">
                                  {coupon.discount}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-[var(--text-muted)] italic">Registration Only</span>
                          )}
                        </td>

                        <td className="text-[10px] text-[var(--text-muted)]">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{new Date(l.createdAt).toLocaleDateString()}</span>
                          </span>
                        </td>

                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* WhatsApp Direct Link */}
                            <a
                              href={`https://wa.me/${l.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                                `Hi ${l.name}! Exclusive offer from ${l.campaign.advertiser?.companyName || "Blunira"
                                }: Use code FESTIVE25 for instant savings!`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-emerald-400 transition-all"
                              title="Send WhatsApp Direct Chat"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </a>

                            <LoadingButton
                              loading={deletingId === l.id}
                              variant="danger"
                              onClick={() => handleDelete(l.id)}
                              className="p-2 rounded-xl cursor-pointer"
                              title="Delete Lead"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </LoadingButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                      No customer leads found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Device / Capture</th>
                  <th>Location &amp; Info</th>
                  <th>Campaign &amp; Advertiser</th>
                  <th>IP Address</th>
                  <th>Captured Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length > 0 ? (
                  paginated.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <div className="font-bold text-[var(--text-primary)]">
                          {l.phone !== "00000000" ? l.name : "Silent Scan Lead"}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)]">
                          {l.phone !== "00000000" ? l.phone : "No Form Submitted"}
                        </div>
                      </td>

                      <td>
                        <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-cyan-500" />
                          <span>{l.city || "Unknown Location"}</span>
                        </span>
                      </td>

                      <td>
                        <div className="font-bold text-[var(--text-primary)]">{l.campaign.name}</div>
                        {isAdmin && (
                          <div className="text-[10px] text-purple-400 font-bold">
                            {l.campaign.advertiser?.companyName || l.advertiser?.companyName || "N/A"}
                          </div>
                        )}
                      </td>

                      <td className="font-mono font-bold text-[var(--text-secondary)]">
                        {l.ipAddress || "N/A"}
                      </td>

                      <td className="text-[10px] text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{new Date(l.createdAt).toLocaleDateString()}</span>
                        </span>
                      </td>

                      <td className="text-right">
                        <LoadingButton
                          loading={deletingId === l.id}
                          variant="danger"
                          onClick={() => handleDelete(l.id)}
                          className="p-2 rounded-xl cursor-pointer"
                          title="Delete Capture"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </LoadingButton>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                      No ended campaign scans found matching search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-4 mt-4" style={{ borderColor: "var(--card-border)" }}>
            <span className="text-[10px] text-[var(--text-muted)] font-bold">
              Showing page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer"
                style={{ background: "var(--bg-surface)", borderColor: "var(--card-border)" }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer"
                style={{ background: "var(--bg-surface)", borderColor: "var(--card-border)" }}
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
