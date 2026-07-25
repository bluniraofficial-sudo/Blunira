"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  MessageSquare,
  Key,
  RefreshCw,
  PlusCircle,
  HelpCircle,
  ShieldCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Globe,
  Sliders,
  Phone,
  Settings,
  Mail,
} from "lucide-react";

interface WhatsappTemplatesClientProps {
  initialSettings: any[];
  advertisers?: any[];
  role?: "SUPER_ADMIN" | "ADVERTISER";
  lockedAdvertiserId?: string;
}

export function WhatsappTemplatesClient({
  initialSettings,
  advertisers,
  role = "SUPER_ADMIN",
  lockedAdvertiserId = "",
}: WhatsappTemplatesClientProps) {
  const [activeTab, setActiveTab] = useState<"config" | "directory" | "create">("config");
  const [selectedAdvertiserId, setSelectedAdvertiserId] = useState<string>(
    role === "ADVERTISER" ? lockedAdvertiserId : ""
  );

  // Credentials State
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [whatsappProvider, setWhatsappProvider] = useState<"META" | "CUSTOM">("CUSTOM");
  const [whatsappApiUrl, setWhatsappApiUrl] = useState("");
  const [whatsappApiToken, setWhatsappApiToken] = useState("");
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState("");
  const [whatsappWabaId, setWhatsappWabaId] = useState("");
  const [whatsappUseTemplate, setWhatsappUseTemplate] = useState(false);
  const [whatsappTemplateCoupon, setWhatsappTemplateCoupon] = useState("coupon_delivery");
  const [whatsappTemplateRegistration, setWhatsappTemplateRegistration] = useState("registration_confirmed");
  const [whatsappTemplateCrm, setWhatsappTemplateCrm] = useState("crm_offer_reminder");
  const [whatsappTemplateLanguage, setWhatsappTemplateLanguage] = useState("en");
  const [whatsappTemplateCouponHasImage, setWhatsappTemplateCouponHasImage] = useState(false);
  const [whatsappTemplateRegistrationHasImage, setWhatsappTemplateRegistrationHasImage] = useState(false);
  const [whatsappTemplateCrmHasImage, setWhatsappTemplateCrmHasImage] = useState(false);

  // Directory State
  const [metaTemplates, setMetaTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  // Creation State
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("UTILITY");
  const [newTemplateLanguage, setNewTemplateLanguage] = useState("en_US");
  const [newTemplateBody, setNewTemplateBody] = useState("");
  const [newTemplateSamples, setNewTemplateSamples] = useState<string[]>([]);
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [includeImageHeader, setIncludeImageHeader] = useState(false);
  const [headerImageUrl, setHeaderImageUrl] = useState("");

  // Fetch credentials for a specific advertiser dynamically
  const fetchAdvertiserSettings = async (advId: string) => {
    try {
      const res = await fetch(`/api/crm/credentials?advertiserId=${advId}`);
      if (res.ok) {
        const data = await res.json();
        setSmtpUser(data.smtpUser || "");
        setSmtpPass(data.smtpPass || "");
        setWhatsappApiUrl(data.whatsappApiUrl || "");
        setWhatsappApiToken(data.whatsappApiToken || "");
        setWhatsappProvider((data.whatsappProvider as "META" | "CUSTOM") || "CUSTOM");
        setWhatsappPhoneNumberId(data.whatsappPhoneNumberId || "");
        setWhatsappWabaId(data.whatsappWabaId || "");
        setWhatsappUseTemplate(data.whatsappUseTemplate === "true" || data.whatsappUseTemplate === true);
        setWhatsappTemplateCoupon(data.whatsappTemplateCoupon || "coupon_delivery");
        setWhatsappTemplateRegistration(data.whatsappTemplateRegistration || "registration_confirmed");
        setWhatsappTemplateCrm(data.whatsappTemplateCrm || "crm_offer_reminder");
        setWhatsappTemplateLanguage(data.whatsappTemplateLanguage || "en");
        setWhatsappTemplateCouponHasImage(data.whatsappTemplateCouponHasImage === "true");
        setWhatsappTemplateRegistrationHasImage(data.whatsappTemplateRegistrationHasImage === "true");
        setWhatsappTemplateCrmHasImage(data.whatsappTemplateCrmHasImage === "true");
      }
    } catch (err) {
      console.error("Failed to load credentials for advertiser:", err);
    }
  };

  // Load Initial Settings or reload when selectedAdvertiserId changes
  useEffect(() => {
    if (selectedAdvertiserId) {
      fetchAdvertiserSettings(selectedAdvertiserId);
    } else {
      const getVal = (key: string, fallback = "") => {
        const found = initialSettings.find((s) => s.key === key);
        return found ? found.value : fallback;
      };

      setSmtpUser(getVal("SMTP_USER"));
      setSmtpPass(getVal("SMTP_PASS"));
      setWhatsappApiUrl(getVal("WHATSAPP_API_URL"));
      setWhatsappApiToken(getVal("WHATSAPP_API_TOKEN"));
      setWhatsappProvider((getVal("WHATSAPP_PROVIDER") as "META" | "CUSTOM") || "CUSTOM");
      setWhatsappPhoneNumberId(getVal("WHATSAPP_PHONE_NUMBER_ID"));
      setWhatsappWabaId(getVal("WHATSAPP_WABA_ID"));
      setWhatsappUseTemplate(getVal("WHATSAPP_USE_TEMPLATE") === "true");
      setWhatsappTemplateCoupon(getVal("WHATSAPP_TEMPLATE_COUPON", "coupon_delivery"));
      setWhatsappTemplateRegistration(getVal("WHATSAPP_TEMPLATE_REGISTRATION", "registration_confirmed"));
      setWhatsappTemplateCrm(getVal("WHATSAPP_TEMPLATE_CRM", "crm_offer_reminder"));
      setWhatsappTemplateLanguage(getVal("WHATSAPP_TEMPLATE_LANGUAGE", "en"));
      setWhatsappTemplateCouponHasImage(getVal("WHATSAPP_TEMPLATE_COUPON_HAS_IMAGE") === "true");
      setWhatsappTemplateRegistrationHasImage(getVal("WHATSAPP_TEMPLATE_REGISTRATION_HAS_IMAGE") === "true");
      setWhatsappTemplateCrmHasImage(getVal("WHATSAPP_TEMPLATE_CRM_HAS_IMAGE") === "true");
    }
  }, [selectedAdvertiserId, initialSettings]);

  // Fetch Meta Templates
  const fetchMetaTemplates = async () => {
    if (!whatsappWabaId || !whatsappApiToken) return;
    setLoadingTemplates(true);
    setTemplatesError(null);
    try {
      const url = selectedAdvertiserId
        ? `/api/crm/whatsapp-templates?advertiserId=${selectedAdvertiserId}`
        : "/api/crm/whatsapp-templates";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMetaTemplates(data);
      } else {
        const data = await res.json();
        setTemplatesError(data.error || "Failed to load templates.");
      }
    } catch (err) {
      setTemplatesError("Network error loading Meta templates.");
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Load templates on switching to directory tab
  useEffect(() => {
    if (activeTab === "directory" && whatsappProvider === "META") {
      fetchMetaTemplates();
    }
  }, [activeTab, whatsappProvider, whatsappWabaId, whatsappApiToken, selectedAdvertiserId]);

  // Handle template body variables parse
  useEffect(() => {
    const matches = newTemplateBody.match(/\{\{\d+\}\}/g);
    if (matches) {
      const indexes = matches.map((m) => parseInt(m.replace(/[^0-9]/g, "")));
      const maxIndex = Math.max(...indexes);
      if (maxIndex > 0) {
        setNewTemplateSamples((prev) => {
          const next = [...prev];
          while (next.length < maxIndex) next.push("");
          return next.slice(0, maxIndex);
        });
        return;
      }
    }
    setNewTemplateSamples([]);
  }, [newTemplateBody]);

  // Save Email Settings
  const handleSaveEmailSettings = async () => {
    if (!smtpUser || !smtpPass) {
      Swal.fire({ title: "Error", text: "Please enter both SMTP Sender Email and Password / App Password.", icon: "error" });
      return;
    }
    setVerifyingEmail(true);
    try {
      const res = await fetch("/api/crm/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "EMAIL",
          smtpUser,
          smtpPass,
          advertiserId: selectedAdvertiserId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          title: "Email Verified! ✉️",
          text: data.message || "SMTP details successfully verified and saved.",
          icon: "success",
          background: "var(--bg-elevated)",
          color: "var(--text-primary)",
          customClass: { popup: "border border-cyan-500/20 rounded-3xl" },
        });
      } else {
        Swal.fire({ title: "Failed to Save", text: data.error || "SMTP Verification failed.", icon: "error" });
      }
    } catch (err) {
      Swal.fire({ title: "Error", text: "Something went wrong validating email credentials.", icon: "error" });
    } finally {
      setVerifyingEmail(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    if (whatsappProvider === "META") {
      if (!whatsappPhoneNumberId || !whatsappApiToken) {
        Swal.fire({ title: "Error", text: "Please enter WhatsApp Phone Number ID and Access Token.", icon: "error" });
        return;
      }
    } else {
      if (!whatsappApiUrl || !whatsappApiToken) {
        Swal.fire({ title: "Error", text: "Please enter WhatsApp Gateway URL and Access Token / Key.", icon: "error" });
        return;
      }
    }

    try {
      const res = await fetch("/api/crm/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "WHATSAPP",
          whatsappApiUrl,
          whatsappApiToken,
          whatsappUseTemplate: whatsappUseTemplate ? "true" : "false",
          whatsappTemplateCoupon,
          whatsappTemplateRegistration,
          whatsappTemplateCrm,
          whatsappTemplateLanguage,
          whatsappProvider,
          whatsappPhoneNumberId,
          whatsappWabaId,
          whatsappTemplateCouponHasImage: whatsappTemplateCouponHasImage ? "true" : "false",
          whatsappTemplateRegistrationHasImage: whatsappTemplateRegistrationHasImage ? "true" : "false",
          whatsappTemplateCrmHasImage: whatsappTemplateCrmHasImage ? "true" : "false",
          advertiserId: selectedAdvertiserId || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        Swal.fire({
          title: "Settings Saved! 🚀",
          text: "WhatsApp configuration has been successfully updated and verified.",
          icon: "success",
          background: "var(--bg-elevated)",
          color: "var(--text-primary)",
          customClass: { popup: "border border-cyan-500/20 rounded-3xl" },
        });
      } else {
        Swal.fire({ title: "Failed to Save", text: data.error || "Verification failed.", icon: "error" });
      }
    } catch (err) {
      Swal.fire({ title: "Error", text: "Something went wrong saving settings.", icon: "error" });
    }
  };

  // Submit Template creation
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName) {
      Swal.fire({ title: "Error", text: "Please enter a template name.", icon: "error" });
      return;
    }
    if (!newTemplateBody) {
      Swal.fire({ title: "Error", text: "Please enter template body content.", icon: "error" });
      return;
    }

    if (includeImageHeader && !headerImageUrl) {
      Swal.fire({ title: "Error", text: "Please provide a valid Header Image URL.", icon: "error" });
      return;
    }

    const variablesCount = newTemplateSamples.length;
    for (let i = 0; i < variablesCount; i++) {
      if (!newTemplateSamples[i]) {
        Swal.fire({ title: "Missing Samples", text: `Please provide a sample value for variable {{${i + 1}}}.`, icon: "error" });
        return;
      }
    }

    setCreatingTemplate(true);
    try {
      const res = await fetch("/api/crm/whatsapp-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTemplateName.toLowerCase().replace(/[^a-z0-9_]/g, ""),
          category: newTemplateCategory,
          language: newTemplateLanguage,
          bodyText: newTemplateBody,
          sampleValues: newTemplateSamples,
          headerImageUrl: includeImageHeader ? headerImageUrl : undefined,
          advertiserId: selectedAdvertiserId || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        Swal.fire({
          title: "Submitted to Meta! 🎉",
          text: "Template has been submitted. Check the status in your Meta Dashboard or refresh the Templates tab.",
          icon: "success",
          background: "var(--bg-elevated)",
          color: "var(--text-primary)",
          customClass: { popup: "border border-cyan-500/20 rounded-3xl" },
        });
        setNewTemplateName("");
        setNewTemplateBody("");
        setNewTemplateSamples([]);
        setIncludeImageHeader(false);
        setHeaderImageUrl("");
        setActiveTab("directory");
      } else {
        Swal.fire({ title: "Submission Failed", text: data.error || "Unable to submit template.", icon: "error" });
      }
    } catch (err) {
      Swal.fire({ title: "Error", text: "Failed to connect to template creation service.", icon: "error" });
    } finally {
      setCreatingTemplate(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 text-[var(--text-primary)]">
          <MessageSquare className="h-6 w-6 text-emerald-400" />
          <span>Meta WhatsApp Cloud API Manager</span>
        </h1>
        <p className="text-[var(--text-muted)] text-xs mt-1">
          Configure API credentials, check template approval directories, and draft/submit custom WhatsApp templates to Meta Developer API.
        </p>
      </div>

      {/* Business Dropdown selector */}
      {advertisers && advertisers.length > 0 && (
        <div className="p-4 rounded-2xl border bg-white/[0.01] border-white/[0.04] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="font-extrabold text-[var(--text-primary)] text-xs block">Active Business Configuration Scope</span>
            <span className="text-[10px] text-[var(--text-muted)]">Select whether to configure the global platform fallback setup or a specific advertiser context.</span>
          </div>
          <div className="flex items-center gap-2 min-w-[240px]">
            <select
              value={selectedAdvertiserId}
              onChange={(e) => setSelectedAdvertiserId(e.target.value)}
              className="input-field text-xs font-bold cursor-pointer w-full bg-[#0b0f19] border-white/10"
            >
              <option value="">Global Platform Defaults</option>
              {advertisers.map((a) => (
                <option key={a.id} value={a.id}>
                  🏢 {a.companyName || a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b text-xs font-semibold gap-1" style={{ borderColor: "var(--card-border)" }}>
        <button
          onClick={() => setActiveTab("config")}
          className={`px-5 py-3 border-b-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "config"
              ? "border-emerald-400 text-emerald-400 bg-emerald-500/10 font-bold"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Settings className="h-3.5 w-3.5" />
          <span>API Credentials Setup</span>
        </button>
        <button
          onClick={() => setActiveTab("directory")}
          className={`px-5 py-3 border-b-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "directory"
              ? "border-emerald-400 text-emerald-400 bg-emerald-500/10 font-bold"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Approval Directory ({metaTemplates.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("create")}
          className={`px-5 py-3 border-b-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "create"
              ? "border-emerald-400 text-emerald-400 bg-emerald-500/10 font-bold"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Create & Approve Template</span>
        </button>
      </div>

      {/* TAB 1: API CONFIGURATION */}
      {activeTab === "config" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in">
          {/* Left panel inputs */}
          <div className="xl:col-span-2 space-y-6">
            <div
              className="p-6 rounded-3xl border space-y-4"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--card-border)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Sliders className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-extrabold text-[var(--text-primary)]">WhatsApp Gateway Configuration</h2>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                  API Provider / Gateway Type
                </label>
                <select
                  value={whatsappProvider}
                  onChange={(e) => {
                    const val = e.target.value as "META" | "CUSTOM";
                    setWhatsappProvider(val);
                    if (val === "META") setWhatsappUseTemplate(true);
                  }}
                  className="input-field text-xs font-bold cursor-pointer w-full"
                >
                  <option value="META">Meta WhatsApp Cloud API (Official)</option>
                  <option value="CUSTOM">Custom Gateway (Ultramsg, Webhook, Twilio)</option>
                </select>
              </div>

              {whatsappProvider === "META" ? (
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                      WhatsApp Phone Number ID
                    </label>
                    <input
                      type="text"
                      value={whatsappPhoneNumberId}
                      onChange={(e) => setWhatsappPhoneNumberId(e.target.value)}
                      placeholder="e.g. 109827364501928"
                      className="input-field font-mono text-[11px]"
                    />
                    <span className="text-[8px] text-[var(--text-muted)] block mt-1">
                      Retrieved from your Meta App Console under WhatsApp &gt; API Setup.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                      Meta System User Access Token
                    </label>
                    <input
                      type="password"
                      value={whatsappApiToken}
                      onChange={(e) => setWhatsappApiToken(e.target.value)}
                      placeholder="EAABw..."
                      className="input-field font-mono"
                    />
                    <span className="text-[8px] text-[var(--text-muted)] block mt-1">
                      A permanent access token created in your Facebook Business Manager settings.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                      WhatsApp Business Account ID (WABA ID)
                    </label>
                    <input
                      type="text"
                      value={whatsappWabaId}
                      onChange={(e) => setWhatsappWabaId(e.target.value)}
                      placeholder="e.g. 129384756102938"
                      className="input-field font-mono text-[11px]"
                    />
                    <span className="text-[8px] text-[var(--text-muted)] block mt-1">
                      WABA ID is required to query template directories and submit templates.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                      WhatsApp Gateway / API URL
                    </label>
                    <input
                      type="text"
                      value={whatsappApiUrl}
                      onChange={(e) => setWhatsappApiUrl(e.target.value)}
                      placeholder="https://api.ultramsg.com/instance12345/messages/chat"
                      className="input-field font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                      WhatsApp API Access Token / Key
                    </label>
                    <input
                      type="password"
                      value={whatsappApiToken}
                      onChange={(e) => setWhatsappApiToken(e.target.value)}
                      placeholder="Enter API Key / Bearer Token"
                      className="input-field font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Template parameters configuration */}
              <div className="pt-4 border-t border-white/5 space-y-4">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={whatsappUseTemplate}
                    onChange={(e) => setWhatsappUseTemplate(e.target.checked)}
                    className="rounded border-white/10 bg-white/5 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Enable Approved Templates Routing
                  </span>
                </label>

                {whatsappUseTemplate && (
                  <div className="pl-4 space-y-4 border-l-2 border-emerald-500/25 py-1">
                    <div>
                      <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                        Template Language Code
                      </label>
                      <input
                        type="text"
                        value={whatsappTemplateLanguage}
                        onChange={(e) => setWhatsappTemplateLanguage(e.target.value)}
                        placeholder="e.g. en or en_US"
                        className="input-field font-mono text-[11px] py-1.5"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1 flex items-center justify-between">
                        <span>Coupon Delivery Template Name</span>
                        <span className="text-[7px] bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded font-mono uppercase">3 variables</span>
                      </label>
                      <input
                        type="text"
                        value={whatsappTemplateCoupon}
                        onChange={(e) => setWhatsappTemplateCoupon(e.target.value)}
                        placeholder="e.g. coupon_delivery"
                        className="input-field font-mono text-[11px] py-1.5"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1 flex items-center justify-between">
                        <span>Registration Template Name</span>
                        <span className="text-[7px] bg-purple-950 text-purple-400 px-1.5 py-0.5 rounded font-mono uppercase">2 variables</span>
                      </label>
                      <input
                        type="text"
                        value={whatsappTemplateRegistration}
                        onChange={(e) => setWhatsappTemplateRegistration(e.target.value)}
                        placeholder="e.g. registration_confirmed"
                        className="input-field font-mono text-[11px] py-1.5"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1 flex items-center justify-between">
                        <span>CRM Offer Reminder Template Name</span>
                        <span className="text-[7px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded font-mono uppercase">6 variables</span>
                      </label>
                      <input
                        type="text"
                        value={whatsappTemplateCrm}
                        onChange={(e) => setWhatsappTemplateCrm(e.target.value)}
                        placeholder="e.g. crm_offer_reminder"
                        className="input-field font-mono text-[11px] py-1.5"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Verify & Save button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-5 py-3 rounded-2xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-950/20"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify & Save Setup</span>
                </button>
              </div>
            </div>

            {/* Email SMTP Configuration */}
            <div
              className="p-6 rounded-3xl border space-y-4"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--card-border)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-5 h-5 text-cyan-400" />
                <h2 className="text-sm font-extrabold text-[var(--text-primary)]">SMTP Email Sender Credentials</h2>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Configure your Gmail or custom SMTP credentials to send HTML coupon and offer email reminders.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                    Sender Gmail / SMTP Email User
                  </label>
                  <input
                    type="email"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="yourbrand@gmail.com"
                    className="input-field font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                    Gmail App Password / SMTP Password
                  </label>
                  <input
                    type="password"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder="•••• •••• •••• ••••"
                    className="input-field font-mono"
                  />
                </div>
              </div>

              {/* Verify & Save button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={verifyingEmail}
                  onClick={handleSaveEmailSettings}
                  className="px-5 py-3 rounded-2xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-950/20"
                >
                  {verifyingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>{verifyingEmail ? "Verifying SMTP..." : "Verify & Save Email SMTP"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right panel guidelines */}
          <div className="xl:col-span-1">
            <div
              className="p-6 rounded-3xl border space-y-4 relative overflow-hidden"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--card-border)" }}
            >
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />

              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                <h3 className="font-extrabold text-[var(--text-primary)]">Quick API Guide</h3>
              </div>

              <div className="space-y-3.5 text-[11px] text-[var(--text-muted)] leading-relaxed">
                <p>
                  To interface with Meta directly, configure your <strong>Phone Number ID</strong> and <strong>Access Token</strong>.
                </p>
                <div className="p-3 bg-[#0a0f1d]/30 border border-white/5 rounded-xl space-y-1">
                  <span className="font-bold text-white block">Auto-Generated Endpoint:</span>
                  <code className="text-[10px] break-all text-cyan-400">
                    https://graph.facebook.com/v20.0/&#123;Phone-ID&#125;/messages
                  </code>
                </div>
                <p>
                  <strong>Note:</strong> Templates must be pre-approved in the Meta Developer Portal before sending messages. Use the <strong>Directory</strong> tab to select or check template validation statuses.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APPROVAL DIRECTORY */}
      {activeTab === "directory" && (
        <div className="p-6 rounded-3xl border space-y-4 animate-fade-in"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--card-border)" }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-extrabold text-[var(--text-primary)]">Meta Business Templates Manager</h2>
            </div>
            <button
              type="button"
              onClick={fetchMetaTemplates}
              disabled={loadingTemplates || !whatsappWabaId || !whatsappApiToken}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              {loadingTemplates ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>Sync Approval Status</span>
            </button>
          </div>

          {!whatsappWabaId || !whatsappApiToken ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-[var(--text-muted)] text-[11px] text-center max-w-sm mx-auto">
              <AlertCircle className="w-8 h-8 text-amber-500" />
              <p>Please enter and save your Meta WABA ID and System Access Token in the Setup tab first to view template statuses.</p>
            </div>
          ) : templatesError ? (
            <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/25 text-red-300">
              <span className="font-bold block mb-1">Failed to fetch templates:</span>
              <p className="font-mono text-[10px] break-all">{templatesError}</p>
            </div>
          ) : loadingTemplates ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-[var(--text-muted)]">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <span>Fetching registered templates from Meta...</span>
            </div>
          ) : metaTemplates.length === 0 ? (
            <p className="text-center py-12 text-[var(--text-muted)] italic">No templates registered on WABA Account {whatsappWabaId}.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {metaTemplates.map((tpl: any) => {
                const status = tpl.status || "UNKNOWN";
                const bodyComponent = tpl.components?.find((c: any) => c.type === "BODY");
                const bodyText = bodyComponent?.text || "No body text";

                let statusBadge = "bg-gray-500/10 text-gray-400 border-gray-500/20";
                if (status === "APPROVED") statusBadge = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                else if (status === "PENDING") statusBadge = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                else if (status === "REJECTED") statusBadge = "bg-rose-500/10 text-rose-400 border-rose-500/20";

                return (
                  <div
                    key={tpl.id || tpl.name}
                    className="p-5 rounded-2xl bg-[#0b0f19]/30 border border-white/[0.04] hover:border-emerald-500/20 hover:bg-[#0b0f19]/50 transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <span className="font-black text-white text-xs break-all leading-tight">{tpl.name}</span>
                        <span className={`px-2 py-0.5 rounded border text-[8px] font-extrabold uppercase shrink-0 ${statusBadge}`}>
                          {status}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 text-[8px]">
                        <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 text-[var(--text-muted)] font-extrabold uppercase rounded">
                          {tpl.category}
                        </span>
                        <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 text-[var(--text-muted)] font-extrabold uppercase rounded">
                          {tpl.language}
                        </span>
                      </div>

                      <p className="p-3 rounded-xl bg-black/25 text-[10px] text-[var(--text-muted)] font-mono leading-relaxed break-words line-clamp-4">
                        {bodyText}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 border-t border-white/[0.04] pt-3">
                      <span className="text-[8px] text-[var(--text-muted)] mr-1 uppercase font-bold tracking-wider">Bind:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const hasImg = tpl.components?.some((c: any) => c.type === "HEADER" && c.format === "IMAGE");
                          setWhatsappTemplateCoupon(tpl.name);
                          setWhatsappTemplateCouponHasImage(hasImg);
                          if (tpl.language) setWhatsappTemplateLanguage(tpl.language);
                          Swal.fire({ title: "Template Applied", text: `Bound template "${tpl.name}" for Coupon Delivery (${hasImg ? "with image" : "text only"}). Save settings to apply.`, icon: "success", timer: 2000, showConfirmButton: false });
                        }}
                        className="px-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-800/30 text-cyan-300 text-[8px] font-extrabold transition-all cursor-pointer uppercase tracking-wider"
                      >
                        Coupon
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const hasImg = tpl.components?.some((c: any) => c.type === "HEADER" && c.format === "IMAGE");
                          setWhatsappTemplateRegistration(tpl.name);
                          setWhatsappTemplateRegistrationHasImage(hasImg);
                          if (tpl.language) setWhatsappTemplateLanguage(tpl.language);
                          Swal.fire({ title: "Template Applied", text: `Bound template "${tpl.name}" for Registration Success (${hasImg ? "with image" : "text only"}). Save settings to apply.`, icon: "success", timer: 2000, showConfirmButton: false });
                        }}
                        className="px-2 py-1 rounded bg-purple-950 hover:bg-purple-900 border border-purple-800/30 text-purple-300 text-[8px] font-extrabold transition-all cursor-pointer uppercase tracking-wider"
                      >
                        Reg
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const hasImg = tpl.components?.some((c: any) => c.type === "HEADER" && c.format === "IMAGE");
                          setWhatsappTemplateCrm(tpl.name);
                          setWhatsappTemplateCrmHasImage(hasImg);
                          if (tpl.language) setWhatsappTemplateLanguage(tpl.language);
                          Swal.fire({ title: "Template Applied", text: `Bound template "${tpl.name}" for CRM Reminders (${hasImg ? "with image" : "text only"}). Save settings to apply.`, icon: "success", timer: 2000, showConfirmButton: false });
                        }}
                        className="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-800/30 text-emerald-300 text-[8px] font-extrabold transition-all cursor-pointer uppercase tracking-wider"
                      >
                        CRM
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CREATE TEMPLATE & GUIDELINES */}
      {activeTab === "create" && (() => {
        // Helper to format real-time preview of body text with variables replaced by samples
        const getPreviewBodyText = () => {
          let text = newTemplateBody || "Hi {{1}}, thank you for scanning our code. Here is your coupon code {{2}} of {{3}} discount!";
          newTemplateSamples.forEach((sample, idx) => {
            const placeholder = `{{${idx + 1}}}`;
            text = text.replaceAll(placeholder, sample || placeholder);
          });
          return text;
        };

        const imagePresets = [
          { name: "🎁 Festive Gift", url: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&h=350&q=80" },
          { name: "💧 Fresh Water", url: "https://images.unsplash.com/photo-1548839134-24a5c474350d?auto=format&fit=crop&w=600&h=350&q=80" },
          { name: "🎟️ Promo Discount", url: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&h=350&q=80" },
        ];

        return (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in">
            {/* Left Panel: Creator Form */}
            <div className="xl:col-span-2 space-y-4">
              <form
                onSubmit={handleCreateTemplate}
                className="p-6 rounded-3xl border space-y-4"
                style={{ background: "var(--bg-elevated)", borderColor: "var(--card-border)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <PlusCircle className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-sm font-extrabold text-[var(--text-primary)]">Draft &amp; Submit Meta Template</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="e.g. promo_coupon_alert"
                      className="input-field font-mono text-[11px]"
                    />
                    <span className="text-[8px] text-[var(--text-muted)] block mt-1">
                      Lowercase letters, numbers, and underscores only.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                      Category (Utility gets approved fast)
                    </label>
                    <select
                      value={newTemplateCategory}
                      onChange={(e) => setNewTemplateCategory(e.target.value)}
                      className="input-field text-xs font-bold cursor-pointer w-full"
                    >
                      <option value="UTILITY">Utility (Transaction / Coupon Claim Updates)</option>
                      <option value="MARKETING">Marketing (Promotional Offers / Alerts)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                      Language Code
                    </label>
                    <input
                      type="text"
                      value={newTemplateLanguage}
                      onChange={(e) => setNewTemplateLanguage(e.target.value)}
                      placeholder="e.g. en_US or es"
                      className="input-field font-mono text-[11px]"
                    />
                  </div>
                </div>

                {/* IMAGE HEADER CONFIGURATION FOR BETTER MARKETING */}
                <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeImageHeader}
                        onChange={(e) => setIncludeImageHeader(e.target.checked)}
                        className="rounded border-white/10 bg-white/5 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-wider">
                        Include Image Header (Highly Recommended for Marketing)
                      </span>
                    </label>
                  </div>

                  {includeImageHeader && (
                    <div className="pl-4 space-y-3 border-l-2 border-emerald-500/25 py-1">
                      <div>
                        <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1 flex items-center justify-between">
                          <span>Sample Image URL</span>
                          <span className="text-[7px] text-emerald-400 font-mono font-bold">Meta-Approved formats: JPEG/PNG</span>
                        </label>
                        <input
                          type="url"
                          value={headerImageUrl}
                          onChange={(e) => setHeaderImageUrl(e.target.value)}
                          placeholder="https://example.com/marketing-banner.jpg"
                          className="input-field font-mono text-[11px] py-1.5"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="block text-[8px] text-[var(--text-muted)] font-bold uppercase tracking-wide">
                          Quick Presets:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {imagePresets.map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => setHeaderImageUrl(preset.url)}
                              className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] text-[var(--text-muted)] hover:text-white hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all font-bold cursor-pointer"
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                    Template Body Content
                  </label>
                  <textarea
                    value={newTemplateBody}
                    onChange={(e) => setNewTemplateBody(e.target.value)}
                    rows={4}
                    placeholder="Hi {{1}}, thank you for scanning our code. Here is your coupon code {{2}} of {{3}} discount!"
                    className="input-field text-xs font-medium py-2.5 leading-relaxed"
                  />
                  <span className="text-[8px] text-[var(--text-muted)] block mt-1 leading-normal">
                    Define variables in order using <code>{"{{1}}"}</code>, <code>{"{{2}}"}</code>, <code>{"{{3}}"}</code>.
                  </span>
                </div>

                {/* Dynamic Sample Values inputs (required by Meta for approval) */}
                {newTemplateSamples.length > 0 && (
                  <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04] space-y-3">
                    <span className="font-bold text-[var(--text-primary)] block text-[10px] uppercase tracking-wide">
                      Variable Sample Values (Required for Immediate Approval)
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {newTemplateSamples.map((sample, idx) => (
                        <div key={idx}>
                          <label className="block text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1">
                            Sample for variable {"{{"}{idx + 1}{"}}"}
                          </label>
                          <input
                            type="text"
                            value={sample}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewTemplateSamples((prev) => {
                                const next = [...prev];
                                next[idx] = val;
                                return next;
                              });
                            }}
                            placeholder={`Sample e.g. ${idx === 0 ? "John Doe" : idx === 1 ? "SAVE10" : "10% OFF"}`}
                            className="input-field text-[11px] py-1.5 font-mono"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={creatingTemplate || !whatsappWabaId || !whatsappApiToken}
                    className="px-5 py-3 rounded-2xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-950/20"
                  >
                    {creatingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                    <span>Submit to Meta</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right Panel: Interactive WhatsApp Mobile Preview */}
            <div className="xl:col-span-1 space-y-4">
              <div
                className="p-6 rounded-3xl border space-y-4 relative overflow-hidden"
                style={{ background: "var(--bg-elevated)", borderColor: "var(--card-border)" }}
              >
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-extrabold text-[var(--text-primary)] text-xs">Live Device Simulator</h3>
                </div>

                {/* Phone Simulator Frame */}
                <div className="border border-white/10 rounded-[36px] p-3.5 bg-[#0b0f19] shadow-2xl relative max-w-[280px] mx-auto overflow-hidden">
                  {/* Speaker and Camera notch */}
                  <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-10 flex items-center justify-center gap-1">
                    <span className="w-8 h-1 bg-white/20 rounded-full" />
                    <span className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                  </div>

                  {/* WhatsApp Simulator Chat Header */}
                  <div className="bg-[#128c7e] text-white p-3 pt-6 rounded-t-2xl flex items-center gap-2 -mx-3.5 -mt-3.5">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-[9px]">
                      H
                    </div>
                    <div>
                      <span className="block text-[9px] font-black leading-none">AquaFlow Customer Care</span>
                      <span className="block text-[7px] text-white/80 mt-0.5 font-semibold">Online</span>
                    </div>
                  </div>

                  {/* Chat Area Background */}
                  <div
                    className="p-3 py-6 min-h-[310px] -mx-3.5 -mb-3.5 flex flex-col justify-end"
                    style={{
                      backgroundColor: "#0d141b",
                      backgroundImage: "radial-gradient(#17222d 1px, transparent 1px)",
                      backgroundSize: "16px 16px"
                    }}
                  >
                    {/* Simulated WhatsApp Bubble */}
                    <div className="bg-[#0b141a] border border-[#202c33] text-[10px] text-white rounded-2xl rounded-tl-none p-2.5 max-w-[90%] shadow-md space-y-2">
                      {/* Image Header if enabled */}
                      {includeImageHeader && (
                        <div className="rounded-xl overflow-hidden bg-white/5 border border-white/10 aspect-video flex items-center justify-center relative">
                          {headerImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={headerImageUrl}
                              alt="Marketing Preview Header"
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="text-center p-4">
                              <span className="block text-[8px] text-[var(--text-muted)] font-bold italic">No image URL specified</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Body Message */}
                      <p className="leading-relaxed whitespace-pre-wrap font-medium">
                        {getPreviewBodyText()}
                      </p>

                      {/* Meta information */}
                      <div className="flex items-center justify-end gap-1 text-[7px] text-[var(--text-muted)] leading-none select-none">
                        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-cyan-400 font-bold">✓✓</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-black text-white">Verification Guidelines</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                    Meta checks image safety and template parameters. When using an image header, make sure your body text variable sample inputs match the expected formatting context.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
