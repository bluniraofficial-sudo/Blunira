"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  updateQrCodeStatusAction,
  deleteQrCodeAction,
  generateQrCodeBatchAction,
} from "@/app/actions/qrcode";
import {
  QrCode as QrIcon,
  Search,
  Download,
  Trash2,
  Calendar,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  X,
  Layers,
  Loader2,
} from "lucide-react";

interface QrCodesClientProps {
  initialQrCodes: any[];
  campaigns: any[];
}

export function QrCodesClient({ initialQrCodes, campaigns }: QrCodesClientProps) {
  const [qrCodes, setQrCodes] = useState(initialQrCodes);
  const [search, setSearch] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // Generate QR Code Modal state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState(campaigns[0]?.id || "");
  const [qrCount, setQrCount] = useState(1);
  const [bottleBatch, setBottleBatch] = useState("Direct QR Batch");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleGenerateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaignId) {
      Swal.fire({ title: "Select Campaign", text: "Please choose a target campaign.", icon: "warning" });
      return;
    }
    if (qrCount < 1 || qrCount > 5000) {
      Swal.fire({ title: "Invalid Quantity", text: "Quantity must be between 1 and 5,000.", icon: "warning" });
      return;
    }

    setIsGenerating(true);
    try {
      const generated = await generateQrCodeBatchAction(selectedCampaignId, qrCount, bottleBatch);
      const targetCamp = campaigns.find((c) => c.id === selectedCampaignId);
      
      const newItems = generated.map((q: any) => ({
        ...q,
        scanCount: 0,
        lastScan: null,
        campaign: targetCamp || { name: "Campaign", advertiser: { companyName: "Advertiser" }, coupons: [] },
      }));

      setQrCodes([...newItems, ...qrCodes]);
      setShowGenerateModal(false);

      Swal.fire({
        title: "QR Codes Generated! ⚡",
        html: `<div style="text-align: left; font-size: 13px;">
                <p>Successfully created <strong>${generated.length}</strong> QR code(s) without coupons for campaign: <strong>${targetCamp?.name || "Selected Campaign"}</strong>.</p>
                <p style="margin-top: 6px; color: #64748b;">Bottle Batch Tag: <code>${bottleBatch}</code></p>
               </div>`,
        icon: "success",
        background: "var(--bg-elevated)",
        color: "var(--text-primary)",
        customClass: { popup: "border border-cyan-500/20 rounded-3xl" },
      });
    } catch (err: any) {
      Swal.fire({
        title: "Generation Error",
        text: err.message || "Failed to generate QR codes batch",
        icon: "error",
        background: "var(--bg-elevated)",
        color: "var(--text-primary)",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Pagination states
  const [page, setPage] = useState(1);
  const limit = 15;

  // Filter QR Codes
  const filtered = qrCodes.filter(
    (qr) =>
      qr.qrCodeId.toLowerCase().includes(search.toLowerCase()) ||
      qr.campaign.name.toLowerCase().includes(search.toLowerCase()) ||
      qr.campaign.advertiser.companyName.toLowerCase().includes(search.toLowerCase()) ||
      (qr.bottleBatch && qr.bottleBatch.toLowerCase().includes(search.toLowerCase()))
  );

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / limit) || 1;
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateQrCodeStatusAction(id, nextStatus);
      setQrCodes(
        qrCodes.map((q) => (q.id === id ? { ...q, status: nextStatus } : q))
      );
    } catch (err) {
      alert("Failed to toggle QR code status");
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Scans mapping to it will no longer redirect.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#8b5cf6",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete it!",
      background: "#12141c",
      color: "#ffffff",
      customClass: {
        popup: "border border-white/5 rounded-3xl",
      }
    });

    if (!result.isConfirmed) return;

    try {
      await deleteQrCodeAction(id);
      setQrCodes(qrCodes.filter((q) => q.id !== id));
      Swal.fire({
        title: "Deleted!",
        text: "QR Code has been deleted successfully.",
        icon: "success",
        background: "#12141c",
        color: "#ffffff",
        customClass: {
          popup: "border border-white/5 rounded-3xl",
        }
      });
    } catch (err) {
      Swal.fire({
        title: "Error!",
        text: "Failed to delete QR code.",
        icon: "error",
        background: "#12141c",
        color: "#ffffff",
        customClass: {
          popup: "border border-white/5 rounded-3xl",
        }
      });
    }
  };

  const getQrDownloadUrl = (qr: any) => {
    const origin = process.env.NEXT_PUBLIC_QR_BASE_URL || "http://localhost";
    const fullScanUrl = `${origin}${qr.publicUrl}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(fullScanUrl)}`;
  };

  const downloadQrCodePng = (qr: any) => {
    const url = getQrDownloadUrl(qr);
    const proxyUrl = `/api/qrcode/download?code=${encodeURIComponent(qr.qrCodeId)}&batch=${encodeURIComponent(qr.bottleBatch || "code")}&url=${encodeURIComponent(url)}`;
    
    const link = document.createElement("a");
    link.href = proxyUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            <QrIcon className="h-6 w-6 text-cyan-400" />
            <span>QR Codes</span>
          </h1>
          <p className="text-[var(--text-muted)] text-xs mt-1">
            Monitor sequential campaign QR codes, download high-quality prints, and track scan counts.
          </p>
        </div>

        <button
          onClick={() => setShowGenerateModal(true)}
          className="btn-primary flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Generate QR Codes (No Coupon Required)</span>
        </button>
      </div>

      {/* Control Actions Row */}
      <div className="flex bg-[#12141c]/40 border border-white/5 rounded-2xl p-3 max-w-md">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search code ID, campaign or batch..."
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
                <th className="py-3 px-4">Code ID & Visual</th>
                <th className="py-3 px-4">Campaign & Client</th>
                <th className="py-3 px-4">Linked Coupon</th>
                <th className="py-3 px-4">Bottle Batch</th>
                <th className="py-3 px-4">Scan Count</th>
                <th className="py-3 px-4">Last Scan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginated.length > 0 ? (
                paginated.map((qr) => (
                  <tr key={qr.id || qr.qrCodeId} className="hover:bg-white/[0.01] text-gray-300 font-medium">
                    {/* Code ID with Visual Thumbnail */}
                    <td className="py-3.5 px-4 font-mono font-black text-white text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white p-0.5 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-sm relative group overflow-hidden">
                          <img
                            src={getQrDownloadUrl(qr)}
                            alt={qr.qrCodeId}
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-150">
                            <span className="text-[7px] text-cyan-400 font-bold tracking-tight uppercase">Zoom</span>
                          </div>
                        </div>
                        <span className="tracking-tight">{qr.qrCodeId}</span>
                      </div>
                    </td>

                    {/* Campaign Info */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white block">{qr.campaign.name}</span>
                      <span className="text-[10px] text-gray-500 mt-0.5 block">
                        {qr.campaign.advertiser.companyName}
                      </span>
                    </td>

                    {/* Linked Coupon */}
                    <td className="py-3.5 px-4">
                      {qr.campaign.coupons && qr.campaign.coupons.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block font-semibold"></span>
                            {qr.campaign.coupons[0].discount || qr.campaign.coupons[0].title}
                          </span>
                          <span className="text-[9px] text-gray-600 font-mono mt-0.5">{qr.campaign.coupons[0].code}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full inline-block"></span>
                          No Coupon
                        </span>
                      )}
                    </td>

                    {/* Bottle Batch */}
                    <td className="py-3.5 px-4">
                      <span className="bg-white/5 border border-white/5 px-2.5 py-1 rounded-md text-[10px] font-bold text-gray-400">
                        {qr.bottleBatch || "N/A"}
                      </span>
                    </td>

                    {/* Scan Count */}
                    <td className="py-3.5 px-4 font-bold text-white text-sm">
                      {qr.scanCount}
                    </td>

                    {/* Last Scan Date */}
                    <td className="py-3.5 px-4 text-gray-400 text-[10px]">
                      {qr.lastScan ? new Date(qr.lastScan).toLocaleString() : "Never scanned"}
                    </td>

                    {/* Status Toggle Badge */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => toggleStatus(qr.id, qr.status)}
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border cursor-pointer transition-all ${
                          qr.status === "ACTIVE"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25"
                            : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/25"
                        }`}
                      >
                        {qr.status}
                      </button>
                    </td>

                    {/* Actions toolbar */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Launch direct test link */}
                        <a
                          href={qr.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-[#1c1f2a]/80 hover:bg-[#252837] border border-white/5 rounded-xl text-purple-400 hover:text-purple-300 transition-all"
                          title="Simulate / Test scanning"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        {/* Download prints */}
                        <button
                          onClick={() => downloadQrCodePng(qr)}
                          className="p-2 bg-[#1c1f2a]/80 hover:bg-[#252837] border border-white/5 rounded-xl text-blue-400 hover:text-blue-300 transition-all cursor-pointer"
                          title="Download high-quality QR graphic"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        {/* Delete QR */}
                        <button
                          onClick={() => handleDelete(qr.id)}
                          className="p-2 bg-red-950/20 hover:bg-red-900/30 border border-red-950/40 rounded-xl text-red-400 hover:text-red-300 transition-all cursor-pointer"
                          title="Delete QR Code"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr key="no-qrs-found">
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    No QR codes found matching search.
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

      {/* ── Generate QR Codes (No Coupon Required) Modal ──────── */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999999] flex items-start justify-center p-4 pt-16 sm:pt-24 overflow-y-auto">
          <div
            className="w-full max-w-md rounded-3xl p-6 border shadow-2xl relative animate-fade-in"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "var(--card-border)",
            }}
          >
            <button
              type="button"
              onClick={() => setShowGenerateModal(false)}
              className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <QrIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[var(--text-primary)] tracking-tight">
                  Generate QR Codes
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Create direct scan QR codes without requiring a coupon code
                </p>
              </div>
            </div>

            <form onSubmit={handleGenerateBatch} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1">
                  Target Campaign
                </label>
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="input-field cursor-pointer"
                >
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.advertiser.companyName}) {c.coupons && c.coupons.length > 0 ? "• Has Coupon" : "• Direct QR (No Coupon)"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1">
                  Quantity (Number of QR Codes)
                </label>
                <input
                  type="number"
                  min={1}
                  max={5000}
                  value={qrCount}
                  onChange={(e) => setQrCount(parseInt(e.target.value) || 1)}
                  className="input-field font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1">
                  Bottle Batch / Tag Label
                </label>
                <input
                  type="text"
                  value={bottleBatch}
                  onChange={(e) => setBottleBatch(e.target.value)}
                  placeholder="e.g. Batch #2026-A or Direct QR"
                  className="input-field font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-400">
                ✨ <strong>Direct Scanning:</strong> Scans mapping to these generated QR codes will take users straight to the campaign landing page. No coupon or discount offer is required.
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="btn-primary"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isGenerating ? "Generating QR Codes..." : "Generate QR Batch"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
