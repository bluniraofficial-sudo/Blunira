"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  Send,
  Mail,
  MessageSquare,
  Sparkles,
  Users,
  Building2,
  Search,
  CheckSquare,
  Square,
  Loader2,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  BarChart3,
  Zap,
  ArrowRight,
} from "lucide-react";

interface Advertiser {
  id: string;
  name: string;
  companyName: string;
}

interface CrmDashboardClientProps {
  initialLeads: any[];
  advertisers: Advertiser[];
  role: "SUPER_ADMIN" | "ADVERTISER";
}

export function CrmDashboardClient({ initialLeads, advertisers, role }: CrmDashboardClientProps) {
  const isAdmin = role === "SUPER_ADMIN";

  // ── Scope ──────────────────────────────────────────────────────────────
  const [scopeAdvertiserId, setScopeAdvertiserId] = useState<string>("ALL");

  // ── Compose ────────────────────────────────────────────────────────────
  const [channel, setChannel] = useState<"BOTH" | "EMAIL" | "WHATSAPP">("BOTH");
  const [whatsappTemplateType, setWhatsappTemplateType] = useState<"CRM" | "COUPON" | "REGISTRATION">("CRM");
  
  // Dynamic Meta Approved Templates States
  const [approvedTemplates, setApprovedTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplateName, setSelectedTemplateName] = useState("");
  const [templateVariables, setTemplateVariables] = useState<string[]>([]);
  const [hasImageHeader, setHasImageHeader] = useState(false);
  const [templateImageUrl, setTemplateImageUrl] = useState("");
  const [offerTitle, setOfferTitle] = useState("VIP Special Offer");
  const [offerCode, setOfferCode] = useState("FESTIVE25");
  const [offerDiscount, setOfferDiscount] = useState("₹250 OFF");
  const [customMessage, setCustomMessage] = useState(
    "We noticed your visit! Here is an exclusive discount code and QR voucher for your next order."
  );

  // ── Lead targeting ──────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const LIMIT = 8;

  // ── Dispatch ───────────────────────────────────────────────────────────
  const [sending, setSending] = useState(false);
  const [dispatchLog, setDispatchLog] = useState<{ time: string; stats: any; scope: string }[]>([]);

  // ── Filter leads by scope & search ─────────────────────────────────────
  const standardLeads = useMemo(
    () =>
      initialLeads.filter(
        (l) =>
          (l.redemptions && l.redemptions.length > 0) ||
          (l.phone !== "00000000" &&
            (!l.campaign.endDate || new Date(l.campaign.endDate) >= new Date()))
      ),
    [initialLeads]
  );

  const scopedLeads = useMemo(() => {
    if (scopeAdvertiserId === "ALL") return standardLeads;
    return standardLeads.filter(
      (l) =>
        l.campaign?.advertiserId === scopeAdvertiserId ||
        l.advertiserId === scopeAdvertiserId
    );
  }, [standardLeads, scopeAdvertiserId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return scopedLeads;
    const q = search.toLowerCase();
    return scopedLeads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        (l.city && l.city.toLowerCase().includes(q)) ||
        l.campaign?.name?.toLowerCase().includes(q)
    );
  }, [scopedLeads, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT));
  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  useEffect(() => {
    setPage(1);
    setSelectedLeadIds([]);
  }, [scopeAdvertiserId, search]);

  // ── Selection helpers ──────────────────────────────────────────────────
  const toggleLead = (id: string) =>
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const toggleAll = () => {
    const visibleIds = paginated.map((l) => l.id);
    const allSel = visibleIds.every((id) => selectedLeadIds.includes(id));
    if (allSel) {
      setSelectedLeadIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedLeadIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // ── Fetch Meta Approved Templates & Parse Placeholders ───────────────
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoadingTemplates(true);
      setApprovedTemplates([]);
      setSelectedTemplateName("");
      setTemplateVariables([]);
      setHasImageHeader(false);
      setTemplateImageUrl("");
      try {
        const res = await fetch(`/api/crm/whatsapp-templates?advertiserId=${scopeAdvertiserId !== "ALL" ? scopeAdvertiserId : ""}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            // Keep only approved ones
            const approved = data.filter((t: any) => t.status === "APPROVED");
            setApprovedTemplates(approved);
          }
        }
      } catch (err) {
        console.error("Failed to fetch templates in CRM dashboard:", err);
      } finally {
        setLoadingTemplates(false);
      }
    };

    if (channel === "WHATSAPP" || channel === "BOTH") {
      fetchTemplates();
    }
  }, [scopeAdvertiserId, channel]);

  useEffect(() => {
    if (!selectedTemplateName) {
      setTemplateVariables([]);
      setHasImageHeader(false);
      return;
    }
    const tpl = approvedTemplates.find((t) => t.name === selectedTemplateName);
    if (tpl) {
      // Detect image header
      const hasImg = tpl.components?.some((c: any) => c.type === "HEADER" && c.format === "IMAGE");
      setHasImageHeader(hasImg);

      // Detect body variables
      const bodyComp = tpl.components?.find((c: any) => c.type === "BODY");
      if (bodyComp && bodyComp.text) {
        const matches = bodyComp.text.match(/\{\{\d+\}\}/g);
        if (matches) {
          const nums = matches.map((m: string) => parseInt(m.replace(/[^0-9]/g, "")));
          const maxNum = Math.max(...nums);
          // Create an array of size maxNum with default mappings
          const vars = Array.from({ length: maxNum }, (_, idx) => {
            const placeholderNum = idx + 1;
            // Pre-fill smart default values if possible
            if (placeholderNum === 1) return "{{name}}";
            if (placeholderNum === 2) return "{{code}}";
            if (placeholderNum === 3) return "{{discount}}";
            if (placeholderNum === 4) return "{{company}}";
            return "";
          });
          setTemplateVariables(vars);
        } else {
          setTemplateVariables([]);
        }
      } else {
        setTemplateVariables([]);
      }
    }
  }, [selectedTemplateName, approvedTemplates]);

  // ── Dispatch ───────────────────────────────────────────────────────────
  const handleDispatch = async () => {
    const targets = selectedLeadIds.length > 0 ? selectedLeadIds : filtered.map((l) => l.id);
    if (targets.length === 0) {
      Swal.fire({
        title: "No Leads",
        text: "No leads in the current selection to target.",
        icon: "info",
        background: "var(--bg-elevated)",
        color: "var(--text-primary)",
      });
      return;
    }

    // Validate Meta Custom Template parameters mapping
    if ((channel === "WHATSAPP" || channel === "BOTH") && selectedTemplateName) {
      const hasEmptyVariable = templateVariables.some((v) => !v || v.trim() === "");
      if (hasEmptyVariable) {
        Swal.fire({
          title: "Template Setup Incomplete",
          text: "Please make sure to fill in all the template variable mapping inputs before sending.",
          icon: "error",
          background: "var(--bg-elevated)",
          color: "var(--text-primary)",
          customClass: { popup: "border border-red-500/20 rounded-3xl" },
        });
        return;
      }
    }

    const confirm = await Swal.fire({
      title: "Dispatch Offer Reminders?",
      html: `<div style="font-size:13px;text-align:left;">
        <p>Send <strong>${targets.length} reminder(s)</strong> via <strong>${channel === "BOTH" ? "Email + WhatsApp" : channel}</strong>.</p>
        <p style="margin-top:8px;opacity:0.7">${
          selectedTemplateName
            ? `Template: <strong>${selectedTemplateName}</strong>${channel === "BOTH" ? ` &middot; Offer: <strong>${offerTitle}</strong>` : ""}`
            : `Offer: <strong>${offerTitle}</strong> &middot; Code: <strong>${offerCode}</strong>`
        }</p>
      </div>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#06b6d4",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Send Now",
      background: "var(--bg-elevated)",
      color: "var(--text-primary)",
      customClass: { popup: "border border-cyan-500/20 rounded-3xl" },
    });
    if (!confirm.isConfirmed) return;

    setSending(true);
    try {
      const res = await fetch("/api/crm/send-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadIds: targets,
          channel,
          offerTitle,
          offerCode,
          offerDiscount,
          customMessage,
          whatsappTemplateType,
          whatsappTemplateName: selectedTemplateName || undefined,
          whatsappTemplateVariables: selectedTemplateName ? templateVariables : undefined,
          whatsappTemplateHasImage: selectedTemplateName ? hasImageHeader : undefined,
          whatsappTemplateImageUrl: selectedTemplateName ? templateImageUrl : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const scopeLabel =
          scopeAdvertiserId === "ALL"
            ? "All Businesses"
            : advertisers.find((a) => a.id === scopeAdvertiserId)?.companyName || "Business";

        setDispatchLog((prev) => [
          { time: new Date().toLocaleTimeString(), stats: data.stats, scope: scopeLabel },
          ...prev.slice(0, 4),
        ]);
        setSelectedLeadIds([]);

        Swal.fire({
          title: "Dispatched! 🚀",
          html: `<div style="text-align:left;font-size:13px;">
            <p>&#9989; ${data.message}</p>
            <ul style="margin-top:8px;">
              <li>&#128231; Emails Sent: <strong>${data.stats?.emailsSent ?? 0}</strong></li>
              <li>&#128172; WhatsApp: <strong>${data.stats?.whatsappSent ?? 0}</strong></li>
            </ul>
          </div>`,
          icon: "success",
          background: "var(--bg-elevated)",
          color: "var(--text-primary)",
          customClass: { popup: "border border-cyan-500/20 rounded-3xl" },
        });
      } else {
        Swal.fire({
          title: "Dispatch Error",
          text: data.error || "Failed to send reminders",
          icon: "error",
          background: "var(--bg-elevated)",
          color: "var(--text-primary)",
        });
      }
    } catch {
      Swal.fire({ title: "Error", text: "An error occurred.", icon: "error" });
    } finally {
      setSending(false);
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────
  const totalDispatched = dispatchLog.reduce(
    (acc, d) => acc + (d.stats?.emailsSent ?? 0) + (d.stats?.whatsappSent ?? 0),
    0
  );

  const channelOptions = [
    { id: "BOTH" as const,     label: "Email + WhatsApp", icon: Sparkles,      colorClass: "cyan" },
    { id: "EMAIL" as const,    label: "Email Only",        icon: Mail,          colorClass: "blue" },
    { id: "WHATSAPP" as const, label: "WhatsApp Only",     icon: MessageSquare, colorClass: "emerald" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5 text-[var(--text-primary)]">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Send className="h-4 w-4 text-white" />
            </div>
            CRM Dashboard
          </h1>
          <p className="text-[var(--text-muted)] text-xs mt-1.5 max-w-lg">
            Compose and dispatch personalized offer reminders via Email &amp; WhatsApp Business API. Target specific leads or entire business audiences.
          </p>
        </div>
        <Link
          href={isAdmin ? "/admin/whatsapp" : "/advertiser/settings"}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all shrink-0 hover:border-cyan-500/40 hover:text-cyan-400"
          style={{ borderColor: "var(--card-border)", color: "var(--text-muted)", background: "var(--bg-surface)" }}
        >
          <Zap className="h-3.5 w-3.5" />
          <span>Configure API Credentials</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* ── Stats Strip ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { label: "Total Leads",        value: standardLeads.length,               icon: Users,        colorBase: "#22d3ee" },
          { label: "In Scope",           value: scopedLeads.length,                 icon: Filter,       colorBase: "#60a5fa" },
          { label: "Selected",           value: selectedLeadIds.length || "All",    icon: CheckSquare,  colorBase: "#a78bfa" },
          { label: "Sent This Session",  value: totalDispatched,                    icon: BarChart3,    colorBase: "#34d399" },
        ] as const).map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl border p-4 flex items-center gap-3"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--card-border)" }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${stat.colorBase}15`, border: `1px solid ${stat.colorBase}30` }}
              >
                <Icon className="h-4 w-4" style={{ color: stat.colorBase }} />
              </div>
              <div>
                <div className="text-xl font-black text-[var(--text-primary)] leading-none">{stat.value}</div>
                <div className="text-[10px] text-[var(--text-muted)] font-semibold mt-0.5">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main Content Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* LEFT: Compose Panel */}
        <div
          className="rounded-3xl border p-6 space-y-5"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--card-border)" }}
        >
          <div className="flex items-center gap-2.5 pb-4 border-b" style={{ borderColor: "var(--card-border)" }}>
            <div className="w-7 h-7 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Send className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[var(--text-primary)]">Compose Offer</h2>
              <p className="text-[10px] text-[var(--text-muted)]">Build your personalized campaign message</p>
            </div>
          </div>

          {/* Business Scope — Admin only */}
          {isAdmin && (
            <div>
              <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">
                Business Scope
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)] pointer-events-none" />
                <select
                  value={scopeAdvertiserId}
                  onChange={(e) => setScopeAdvertiserId(e.target.value)}
                  className="input-field pl-8 font-bold text-xs cursor-pointer w-full"
                >
                  <option value="ALL">🌐 All Businesses (Global)</option>
                  {advertisers.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.companyName || a.name}
                    </option>
                  ))}
                </select>
              </div>
              {scopeAdvertiserId !== "ALL" && (
                <p className="text-[10px] text-amber-400/80 mt-1.5 font-semibold">
                  ⚡ Using{" "}
                  <span className="text-amber-400">
                    {advertisers.find((a) => a.id === scopeAdvertiserId)?.companyName}
                  </span>
                  &apos;s API credentials
                </p>
              )}
            </div>
          )}

          {/* Channel Selector */}
          <div>
            <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">
              Dispatch Channel
            </label>
            <div className="grid grid-cols-3 gap-2">
              {channelOptions.map(({ id, label, icon: Icon, colorClass }) => {
                const active = channel === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setChannel(id)}
                    className={`p-3 rounded-2xl border text-[11px] font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      active
                        ? colorClass === "cyan"
                          ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400"
                          : colorClass === "blue"
                          ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
                          : "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                        : "bg-white/[0.02] border-white/[0.06] text-[var(--text-muted)] hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-center leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* WhatsApp Template Selector (Only visible when channel sends to WhatsApp) */}
          {(channel === "WHATSAPP" || channel === "BOTH") && (
            <div className="space-y-3.5 p-4 rounded-2xl bg-[#0a0f1d]/30 border border-white/5">
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">
                  Meta WhatsApp Template Selector
                </label>
                {loadingTemplates ? (
                  <div className="flex items-center gap-2 py-2 text-[10px] text-cyan-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Fetching approved templates from Meta WABA account...</span>
                  </div>
                ) : (
                  <select
                    value={selectedTemplateName}
                    onChange={(e) => setSelectedTemplateName(e.target.value)}
                    className="input-field text-xs font-bold cursor-pointer w-full bg-[#0b0f19] border-white/10"
                  >
                    <option value="">⚙️ Use Default CRM Template Settings</option>
                    {approvedTemplates.map((t) => (
                      <option key={t.name} value={t.name}>
                        📝 {t.name} ({t.language})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {!selectedTemplateName && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    Default Automation Mode
                  </label>
                  <select
                    value={whatsappTemplateType}
                    onChange={(e) => setWhatsappTemplateType(e.target.value as any)}
                    className="input-field text-xs font-bold cursor-pointer w-full bg-[#0b0f19] border-white/10"
                  >
                    <option value="CRM">📣 CRM Offer Reminder (Default - 6 variables)</option>
                    <option value="COUPON">🎟️ Coupon Delivery (3 variables)</option>
                    <option value="REGISTRATION">👤 Registration Confirmed (2 variables)</option>
                  </select>
                  <p className="text-[9px] text-[var(--text-muted)] leading-relaxed">
                    Choose which standard automated flow template to use. The variables mapping is automatically completed by the system.
                  </p>
                </div>
              )}

              {selectedTemplateName && (
                <div className="space-y-3.5 pt-2.5 border-t border-white/5">
                  {/* Body Preview */}
                  <div className="p-3 bg-black/35 rounded-xl border border-white/[0.03] space-y-1">
                    <span className="font-bold text-[10px] text-white block uppercase tracking-wider">Template Text Preview:</span>
                    <p className="text-[10px] font-mono text-[var(--text-muted)] leading-relaxed break-words">
                      {approvedTemplates.find((t) => t.name === selectedTemplateName)?.components?.find((c: any) => c.type === "BODY")?.text || "No text"}
                    </p>
                  </div>

                  {/* Variables Fields */}
                  {templateVariables.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Template Parameters Setup</span>
                        <span className="text-[9px] text-[var(--text-muted)]">Placeholders: {"{{name}}"}, {"{{code}}"}, {"{{discount}}"}, {"{{company}}"}, {"{{note}}"}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {templateVariables.map((val, idx) => (
                          <div key={idx} className="space-y-1">
                            <label className="block text-[9px] font-bold text-[var(--text-muted)]">
                              Variable {"{{"}{idx + 1}{"}}"}
                            </label>
                            <input
                              type="text"
                              value={val}
                              onChange={(e) => {
                                const next = [...templateVariables];
                                next[idx] = e.target.value;
                                setTemplateVariables(next);
                              }}
                              placeholder={`Variable ${idx + 1}`}
                              className="input-field text-xs bg-[#0b0f19] border-white/10 py-1.5 px-3"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Header Image URL if hasImageHeader is true */}
                  {hasImageHeader && (
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        Header Image Link (Meta Template Required)
                      </label>
                      <input
                        type="text"
                        value={templateImageUrl}
                        onChange={(e) => setTemplateImageUrl(e.target.value)}
                        placeholder="e.g. https://domain.com/banner.jpg"
                        className="input-field text-xs bg-[#0b0f19] border-white/10 py-1.5 px-3"
                      />
                      <p className="text-[8px] text-cyan-400 font-semibold leading-relaxed">
                        💡 Leave blank to automatically send your Campaign Cover Banner image.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Offer Fields & Custom Reminder Note */}
          {!(channel === "WHATSAPP" && selectedTemplateName) && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">
                    Offer Title
                  </label>
                  <input
                    type="text"
                    value={offerTitle}
                    onChange={(e) => setOfferTitle(e.target.value)}
                    placeholder="e.g. VIP Festive Offer"
                    className="input-field font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">
                    Promo Code
                  </label>
                  <input
                    type="text"
                    value={offerCode}
                    onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                    placeholder="FESTIVE25"
                    className="input-field font-mono uppercase font-bold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">
                  Discount Value
                </label>
                <input
                  type="text"
                  value={offerDiscount}
                  onChange={(e) => setOfferDiscount(e.target.value)}
                  placeholder="e.g. ₹250 OFF or 25% OFF"
                  className="input-field font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">
                  Custom Reminder Note
                </label>
                <textarea
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Personalized offer message..."
                  className="input-field resize-none text-xs w-full"
                />
              </div>
            </>
          )}

          {/* Dispatch Button */}
          <button
            type="button"
            disabled={sending}
            onClick={handleDispatch}
            className="w-full btn-primary justify-center py-3 text-sm"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Dispatching Reminders...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>
                  Send to{" "}
                  {selectedLeadIds.length > 0
                    ? `${selectedLeadIds.length} Selected Lead${selectedLeadIds.length !== 1 ? "s" : ""}`
                    : `All ${filtered.length} in Scope`}
                </span>
              </>
            )}
          </button>

          {/* Recent Activity */}
          {dispatchLog.length > 0 && (
            <div className="border-t pt-4 space-y-2" style={{ borderColor: "var(--card-border)" }}>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                Recent Dispatches
              </p>
              {dispatchLog.map((log, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-xl border text-[10px]"
                  style={{ background: "rgba(52,211,153,0.05)", borderColor: "rgba(52,211,153,0.2)" }}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[var(--text-muted)]">
                      <span className="font-bold text-[var(--text-primary)]">{log.scope}</span> · {log.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-bold">
                    <span className="text-blue-400">📧 {log.stats?.emailsSent ?? 0}</span>
                    <span className="text-emerald-400">💬 {log.stats?.whatsappSent ?? 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Lead Targeting */}
        <div
          className="rounded-3xl border p-6 space-y-4 flex flex-col"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--card-border)" }}
        >
          <div
            className="flex items-center justify-between pb-4 border-b"
            style={{ borderColor: "var(--card-border)" }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Users className="h-3.5 w-3.5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-sm font-black text-[var(--text-primary)]">Target Leads</h2>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {selectedLeadIds.length > 0
                    ? `${selectedLeadIds.length} lead${selectedLeadIds.length !== 1 ? "s" : ""} selected`
                    : `${filtered.length} leads in scope`}
                </p>
              </div>
            </div>
            {selectedLeadIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedLeadIds([])}
                className="text-[10px] text-cyan-400 hover:underline font-bold cursor-pointer"
              >
                Clear Selection
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, phone, campaign..."
              className="input-field pl-9 text-xs w-full"
            />
          </div>

          {/* Lead Table */}
          <div
            className="flex-1 overflow-auto rounded-2xl border"
            style={{ borderColor: "var(--card-border)" }}
          >
            <table className="w-full text-xs">
              <thead>
                <tr
                  className="border-b text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--card-border)" }}
                >
                  <th className="p-3 text-left w-8">
                    <button type="button" onClick={toggleAll} className="cursor-pointer">
                      {paginated.length > 0 && paginated.every((l) => selectedLeadIds.includes(l.id)) ? (
                        <CheckSquare className="h-3.5 w-3.5 text-cyan-400" />
                      ) : (
                        <Square className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                      )}
                    </button>
                  </th>
                  <th className="p-3 text-left">Lead</th>
                  <th className="p-3 text-left">Campaign</th>
                  <th className="p-3 text-left">Channels</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length > 0 ? (
                  paginated.map((l) => {
                    const selected = selectedLeadIds.includes(l.id);
                    const hasEmail = !!l.email && l.email !== "device-scan@anonymous.com";
                    const hasPhone = l.phone !== "00000000";
                    return (
                      <tr
                        key={l.id}
                        onClick={() => toggleLead(l.id)}
                        className="border-b cursor-pointer transition-colors"
                        style={{
                          borderColor: "var(--card-border)",
                          background: selected ? "rgba(34,211,238,0.06)" : "transparent",
                        }}
                      >
                        <td className="p-3">
                          {selected ? (
                            <CheckSquare className="h-3.5 w-3.5 text-cyan-400" />
                          ) : (
                            <Square className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                          )}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-[var(--text-primary)] truncate max-w-[110px]">{l.name}</div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono">{hasPhone ? l.phone : "No phone"}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-[var(--text-secondary)] truncate max-w-[90px] font-semibold">{l.campaign?.name}</div>
                          {isAdmin && (
                            <div className="text-[10px] text-purple-400 font-semibold truncate max-w-[90px]">
                              {l.campaign?.advertiser?.companyName || "—"}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-0.5">
                            {hasEmail && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold w-fit" style={{ background: "rgba(96,165,250,0.1)", borderColor: "rgba(96,165,250,0.25)", color: "#60a5fa" }}>
                                <Mail className="h-2.5 w-2.5" /> Email
                              </span>
                            )}
                            {hasPhone && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold w-fit" style={{ background: "rgba(52,211,153,0.1)", borderColor: "rgba(52,211,153,0.25)", color: "#34d399" }}>
                                <MessageSquare className="h-2.5 w-2.5" /> WA
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p>No leads found in this scope.</p>
                      {scopeAdvertiserId !== "ALL" && isAdmin && (
                        <button
                          type="button"
                          onClick={() => setScopeAdvertiserId("ALL")}
                          className="mt-2 text-cyan-400 hover:underline text-[10px] font-bold cursor-pointer"
                        >
                          Switch to All Businesses
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-[10px] pt-1">
              <span className="font-semibold" style={{ color: "var(--text-muted)" }}>
                Page {page} of {totalPages} · {filtered.length} total
              </span>
              <div className="flex gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="p-1.5 rounded-lg border cursor-pointer disabled:opacity-30"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--card-border)", color: "var(--text-muted)" }}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-1.5 rounded-lg border cursor-pointer disabled:opacity-30"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--card-border)", color: "var(--text-muted)" }}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Quick nav to full leads */}
          <div
            className="rounded-2xl border p-3 flex items-center justify-between"
            style={{ background: "var(--bg-surface)", borderColor: "var(--card-border)" }}
          >
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              Need to export or manage all lead records?
            </p>
            <Link
              href={isAdmin ? "/admin/leads" : "/advertiser/leads"}
              className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-400 hover:underline"
            >
              View All Leads <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── API Config Info Banner ────────────────────────────────── */}
      <div
        className="rounded-2xl border p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--card-border)" }}
      >
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)" }}
          >
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--text-primary)]">API Credentials Required</p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
              Configure SMTP Email and WhatsApp Business API credentials before dispatching.{" "}
              {isAdmin
                ? "Admins can set per-business credentials on the WhatsApp Setup page."
                : "Contact your administrator to configure API credentials for your account."}
            </p>
          </div>
        </div>
        <Link
          href={isAdmin ? "/admin/whatsapp" : "/advertiser/settings"}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shrink-0"
          style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)" }}
        >
          <span>Go to API Setup</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
