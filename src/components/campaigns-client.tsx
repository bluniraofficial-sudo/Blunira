"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  createCampaignAction,
  updateCampaignAction,
  deleteCampaignAction,
} from "@/app/actions/campaign";
import {
  FolderHeart,
  Plus,
  Search,
  Trash2,
  Edit2,
  Calendar,
  ExternalLink,
  Phone,
  MessageCircle,
  Video,
  Globe,
  Upload,
  X,
  Eye,
  Settings,
  ShieldAlert,
  Sparkles,
  QrCode,
  Download,
} from "lucide-react";
import Link from "next/link";

// Campaign Form Validation Schema
const campaignFormSchema = z.object({
  name: z.string().min(2, "Campaign name must be at least 2 characters"),
  description: z.string().optional(),
  advertiserId: z.string().uuid("Please select an advertiser"),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  bannerUrl: z.string().optional().or(z.literal("")),
  logoUrl: z.string().optional().or(z.literal("")),
  videoUrl: z.string().optional().or(z.literal("")),
  landingPage: z.object({
    title: z.string().min(2, "Landing page title is required"),
    subtitle: z.string().optional().or(z.literal("")),
    offerText: z.string().optional().or(z.literal("")),
    imageBanner: z.string().optional().or(z.literal("")),
    countdownEnd: z.string().optional().or(z.literal("")),
    leadFormEnabled: z.boolean().optional(),
    whatsappButton: z.boolean().optional(),
    whatsappNumber: z.string().optional().or(z.literal("")),
    callButton: z.boolean().optional(),
    callNumber: z.string().optional().or(z.literal("")),
    websiteButton: z.boolean().optional(),
    websiteUrl: z.string().optional().or(z.literal("")),
    googleMapsUrl: z.string().optional().or(z.literal("")),
    videoUrl: z.string().optional().or(z.literal("")),
    termsText: z.string().optional().or(z.literal("")),
    privacyText: z.string().optional().or(z.literal("")),
  }),
});

type CampaignFormValues = z.infer<typeof campaignFormSchema>;

interface CampaignsClientProps {
  initialCampaigns: any[];
  advertisers?: any[];
  role: "SUPER_ADMIN" | "ADVERTISER";
}

export function CampaignsClient({
  initialCampaigns,
  advertisers = [],
  role,
}: CampaignsClientProps) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingLanding, setIsUploadingLanding] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadedBannerUrl, setUploadedBannerUrl] = useState<string | null>(null);
  const [uploadedLandingBannerUrl, setUploadedLandingBannerUrl] = useState<string | null>(null);
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "landing">("general");

  const isAdmin = role === "SUPER_ADMIN";

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: "",
      description: "",
      advertiserId: "",
      startDate: "",
      endDate: "",
      bannerUrl: "",
      logoUrl: "",
      videoUrl: "",
      landingPage: {
        title: "",
        subtitle: "",
        offerText: "",
        imageBanner: "",
        countdownEnd: "",
        leadFormEnabled: true,
        whatsappButton: false,
        whatsappNumber: "",
        callButton: false,
        callNumber: "",
        websiteButton: false,
        websiteUrl: "",
        googleMapsUrl: "",
        videoUrl: "",
        termsText: "",
        privacyText: "",
      },
    },
  });

  const bannerWatch = watch("bannerUrl");

  // Watch CTA switch triggers to conditionally validate/hide fields
  const watchLeadForm = watch("landingPage.leadFormEnabled");
  const watchWhatsapp = watch("landingPage.whatsappButton");
  const watchCall = watch("landingPage.callButton");
  const watchWebsite = watch("landingPage.websiteButton");

  // Filter campaigns
  const filtered = campaigns.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.advertiser.companyName.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateModal = () => {
    reset({
      name: "",
      description: "",
      advertiserId: advertisers[0]?.id || "",
      startDate: "",
      endDate: "",
      bannerUrl: "",
      logoUrl: "",
      videoUrl: "",
      landingPage: {
        title: "",
        subtitle: "",
        offerText: "",
        imageBanner: "",
        countdownEnd: "",
        leadFormEnabled: true,
        whatsappButton: false,
        whatsappNumber: "",
        callButton: false,
        callNumber: "",
        websiteButton: false,
        websiteUrl: "",
        googleMapsUrl: "",
        videoUrl: "",
        termsText: "",
        privacyText: "",
      },
    });
    setUploadedBannerUrl(null);
    setUploadedLandingBannerUrl(null);
    setUploadedLogoUrl(null);
    setEditingId(null);
    setErrorMsg(null);
    setActiveTab("general");
    setShowModal(true);
  };

  const openEditModal = (campaign: any) => {
    const formattedStartDate = campaign.startDate ? new Date(campaign.startDate).toISOString().split("T")[0] : "";
    const formattedEndDate = campaign.endDate ? new Date(campaign.endDate).toISOString().split("T")[0] : "";
    const formattedCountdown = campaign.landingPage?.countdownEnd
      ? new Date(campaign.landingPage.countdownEnd).toISOString().slice(0, 16)
      : "";

    reset({
      name: campaign.name,
      description: campaign.description || "",
      advertiserId: campaign.advertiserId,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      bannerUrl: campaign.bannerUrl || "",
      logoUrl: campaign.logoUrl || "",
      videoUrl: campaign.videoUrl || "",
      landingPage: {
        title: campaign.landingPage?.title || "",
        subtitle: campaign.landingPage?.subtitle || "",
        offerText: campaign.landingPage?.offerText || "",
        imageBanner: campaign.landingPage?.imageBanner || "",
        countdownEnd: formattedCountdown,
        leadFormEnabled: campaign.landingPage?.leadFormEnabled ?? true,
        whatsappButton: campaign.landingPage?.whatsappButton ?? false,
        whatsappNumber: campaign.landingPage?.whatsappNumber || "",
        callButton: campaign.landingPage?.callButton ?? false,
        callNumber: campaign.landingPage?.callNumber || "",
        websiteButton: campaign.landingPage?.websiteButton ?? false,
        websiteUrl: campaign.landingPage?.websiteUrl || "",
        googleMapsUrl: campaign.landingPage?.googleMapsUrl || "",
        videoUrl: campaign.landingPage?.videoUrl || "",
        termsText: campaign.landingPage?.termsText || "",
        privacyText: campaign.landingPage?.privacyText || "",
      },
    });
    setUploadedBannerUrl(campaign.bannerUrl || null);
    setUploadedLandingBannerUrl(campaign.landingPage?.imageBanner || null);
    setUploadedLogoUrl(campaign.logoUrl || null);
    setEditingId(campaign.id);
    setErrorMsg(null);
    setActiveTab("general");
    setShowModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Upload failed");

      setUploadedBannerUrl(result.url);
      setValue("bannerUrl", result.url);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLandingBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLanding(true);
    setErrorMsg(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Upload failed");
      setUploadedLandingBannerUrl(result.url);
      setValue("landingPage.imageBanner", result.url);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload landing page image");
    } finally {
      setIsUploadingLanding(false);
    }
  };
  
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    setErrorMsg(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Upload failed");
      setUploadedLogoUrl(result.url);
      setValue("logoUrl", result.url);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const onSubmit = async (values: CampaignFormValues) => {
    setIsLoading(true);
    setErrorMsg(null);

    // Sync campaign bannerUrl with the landing page offer image banner
    const imageBanner = values.landingPage.imageBanner || "";
    values.bannerUrl = imageBanner;

    // Format Dates
    const formattedData: any = {
      ...values,
      bannerUrl: imageBanner,
      startDate: values.startDate ? new Date(values.startDate) : undefined,
      endDate: values.endDate ? new Date(values.endDate) : undefined,
      landingPage: {
        ...values.landingPage,
        countdownEnd: values.landingPage.countdownEnd ? new Date(values.landingPage.countdownEnd) : undefined,
      },
    };

    try {
      if (editingId) {
        // Update Action
        await updateCampaignAction(editingId, {
          name: values.name,
          description: values.description,
          startDate: formattedData.startDate,
          endDate: formattedData.endDate,
          bannerUrl: values.bannerUrl || undefined,
          logoUrl: values.logoUrl || null,
          videoUrl: values.videoUrl || undefined,
          landingPage: formattedData.landingPage,
        });

        setCampaigns(
          campaigns.map((c) =>
            c.id === editingId
              ? {
                  ...c,
                  ...values,
                  startDate: formattedData.startDate,
                  endDate: formattedData.endDate,
                  landingPage: { ...c.landingPage, ...values.landingPage },
                }
              : c
          )
        );
      } else {
        // Create Action
        const created = await createCampaignAction(formattedData);
        setCampaigns([created, ...campaigns]);
      }
      setShowModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Operation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCampaignStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateCampaignAction(id, { status: nextStatus });
      setCampaigns(
        campaigns.map((c) => (c.id === id ? { ...c, status: nextStatus } : c))
      );
      // Hard reload page layout lists
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "All generated QR Codes and landing pages will be soft-deleted.",
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
      await deleteCampaignAction(id);
      setCampaigns(campaigns.filter((c) => c.id !== id));
      Swal.fire({
        title: "Deleted!",
        text: "Campaign has been deleted successfully.",
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
        text: "Failed to delete campaign.",
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
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Campaigns</h1>
          <p className="text-gray-400 text-xs mt-1">
            {isAdmin
              ? "Create campaign flows, customize landing pages, and manage sequential QR codes."
              : "Monitor campaign stats and preview active landing page structures."}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-purple-900/10 transition-all flex items-center gap-2 cursor-pointer text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Create Campaign</span>
          </button>
        )}
      </div>

      {/* Control Actions Row */}
      <div className="flex bg-[#12141c]/40 border border-white/5 rounded-2xl p-3 max-w-md">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#171924]/85 border border-white/5 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.length > 0 ? (
          filtered.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-[#12141c]/65 border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-white/10 transition-all overflow-hidden relative"
            >
              <div>
                {/* Banner overlay background */}
                <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-[#1b1e2a]/45 to-transparent pointer-events-none" />

                <div className="flex items-start justify-between gap-3 mb-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-500/10 border border-blue-500/15 text-blue-400 rounded-xl">
                      <FolderHeart className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">{campaign.name}</h3>
                      <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block mt-1">
                        Client: {campaign.advertiser.companyName}
                      </span>
                    </div>
                  </div>

                  <span
                    onClick={() => isAdmin && toggleCampaignStatus(campaign.id, campaign.status)}
                    className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase border transition-all ${
                      campaign.status === "ACTIVE"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-red-500/10 border-red-500/20 text-red-400"
                    } ${isAdmin ? "cursor-pointer hover:bg-emerald-500/25" : ""}`}
                  >
                    {campaign.status}
                  </span>
                </div>

                {/* Details list */}
                <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4 text-xs text-gray-400">
                  <div className="col-span-2 space-y-4">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">Campaign QR Code</span>
                      {campaign.qrCodes && campaign.qrCodes[0] ? (
                        <span className="font-mono font-bold text-cyan-400 text-xs block mt-0.5">
                          {campaign.qrCodes[0].qrCodeId}
                        </span>
                      ) : (
                        <span className="text-gray-600 block mt-0.5 italic">None</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">Captured Leads</span>
                      <span className="font-bold text-white text-sm block mt-0.5">
                        {campaign._count?.leads ?? campaign.leads?.length ?? 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center bg-white p-1 rounded-xl w-20 h-20 border border-white/10 shrink-0 self-center">
                    {campaign.qrCodes && campaign.qrCodes[0] ? (
                      <img
                        src={getQrDownloadUrl(campaign.qrCodes[0])}
                        alt="Campaign QR Code"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">No QR</span>
                    )}
                  </div>
                  <div className="col-span-3 flex items-center gap-1.5 text-gray-500 text-[11px]">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : "No start"} -{" "}
                      {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : "No end"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-6">
                <div className="flex items-center gap-3">
                  {/* Landing page link */}
                  {campaign.landingPage && (
                    <Link
                      href={`/l/${campaign.landingPage.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-purple-400 hover:text-purple-300 transition-colors"
                      title="Preview landing page"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Preview</span>
                    </Link>
                  )}

                  {/* QR Scan Simulation Link */}
                  {campaign.qrCodes && campaign.qrCodes[0] && (
                    <a
                      href={campaign.qrCodes[0].publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-cyan-400 hover:text-cyan-300 transition-colors font-semibold"
                      title="Test scanning campaign QR Code"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      <span>Test Scan</span>
                    </a>
                  )}

                  {/* Download QR Code Button */}
                  {campaign.qrCodes && campaign.qrCodes[0] && (
                    <button
                      onClick={() => downloadQrCodePng(campaign.qrCodes[0])}
                      className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-emerald-400 hover:text-emerald-300 transition-colors bg-transparent border-none cursor-pointer font-semibold"
                      title="Download QR code graphic"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download QR</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <>
                      <button
                        onClick={() => openEditModal(campaign)}
                        className="p-2 bg-[#1c1f2a]/80 hover:bg-[#252837] border border-white/5 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer animate-fade-in"
                        title="Edit campaign settings"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(campaign.id)}
                        className="p-2 bg-red-950/20 hover:bg-red-900/30 border border-red-950/40 rounded-xl text-red-400 hover:text-red-300 transition-all cursor-pointer animate-fade-in"
                        title="Delete campaign"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] text-gray-600 italic">Read-only Portal</span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-[#12141c]/40 border border-white/5 border-dashed rounded-3xl py-16 text-center">
            <FolderHeart className="h-10 w-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No campaigns found.</p>
          </div>
        )}
      </div>

      {/* Editor Modal Overlay */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999999] flex items-start justify-center p-4 pt-16 sm:pt-24 overflow-y-auto">
          <div className="bg-[#12141c] border border-white/5 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 bg-[#1c1f2a] border border-white/5 rounded-xl text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <span>{editingId ? "Modify Campaign Flow" : "Launch Marketing Campaign"}</span>
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              Configure parameters, customize landing layouts, CTAs, countdowns, and lead capture templates.
            </p>

            {/* Modal Tabs */}
            <div className="flex border-b border-white/5 mb-6 text-xs font-semibold gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("general")}
                className={`px-4 py-2 border-b-2 rounded-t-xl transition-all cursor-pointer ${
                  activeTab === "general"
                    ? "border-purple-500 text-purple-300 bg-purple-950/10"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                1. General Settings
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("landing")}
                className={`px-4 py-2 border-b-2 rounded-t-xl transition-all cursor-pointer ${
                  activeTab === "landing"
                    ? "border-purple-500 text-purple-300 bg-purple-950/10"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                2. Landing Page Layout
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 text-xs p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* TAB 1: GENERAL CAMPAIGN CONFIG */}
              {activeTab === "general" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                        Campaign Name
                      </label>
                      <input
                        type="text"
                        {...register("name")}
                        placeholder="e.g. Summer Blitz 2026"
                        className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white placeholder-gray-600 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                      {errors.name && (
                        <p className="mt-1 text-[10px] text-red-400">{errors.name.message}</p>
                      )}
                    </div>

                    {/* Advertiser Dropdown */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                        Advertiser Tenant
                      </label>
                      <select
                        {...register("advertiserId")}
                        disabled={!!editingId}
                        className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
                      >
                        {advertisers.map((adv) => (
                          <option key={adv.id} value={adv.id}>
                            {adv.companyName}
                          </option>
                        ))}
                      </select>
                      {errors.advertiserId && (
                        <p className="mt-1 text-[10px] text-red-400">{errors.advertiserId.message}</p>
                      )}
                    </div>

                    {/* Start Date */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                        Start Date
                      </label>
                      <input
                        type="date"
                        {...register("startDate")}
                        className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                        End Date
                      </label>
                      <input
                        type="date"
                        {...register("endDate")}
                        className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                      Campaign Description (Optional)
                    </label>
                    <textarea
                      {...register("description")}
                      rows={3}
                      placeholder="Enter a brief summary..."
                      className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white placeholder-gray-600 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                    />
                  </div>

                  {/* Business Logo Upload */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                      Business Logo (Optional)
                    </label>
                    <div className="flex items-center gap-4">
                      {uploadedLogoUrl && (
                        <div className="relative flex-shrink-0">
                          <img
                            src={uploadedLogoUrl}
                            className="h-14 w-14 object-cover rounded-xl border border-white/5"
                            alt="Business Logo Preview"
                          />
                          <button
                            type="button"
                            onClick={() => { setUploadedLogoUrl(null); setValue("logoUrl", ""); }}
                            className="absolute -top-1.5 -right-1.5 bg-red-600 rounded-full p-0.5 text-white hover:bg-red-500 transition-colors"
                            title="Remove logo"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      )}
                      <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 hover:border-cyan-500/30 bg-[#171924] py-4 rounded-xl cursor-pointer transition-all">
                        <Upload className="h-5 w-5 text-gray-500 mb-1" />
                        <span className="text-[10px] text-gray-400 font-bold">
                          {isUploadingLogo ? "Uploading..." : uploadedLogoUrl ? "Replace logo" : "Click to upload JPG / PNG"}
                        </span>
                        <span className="text-[9px] text-gray-600 mt-0.5">Displayed in the brand bar on the public landing page</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          disabled={isUploadingLogo}
                        />
                      </label>
                    </div>
                    <input type="hidden" {...register("logoUrl")} />
                  </div>
                </div>
              )}

              {/* TAB 2: LANDING PAGE WRITING */}
              {activeTab === "landing" && (
                <div className="space-y-4 animate-fade-in text-left">

                  {/* Landing Page Offer Image Upload */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                      Landing Page Offer / Hero Image
                    </label>
                    <div className="flex items-center gap-4">
                      {uploadedLandingBannerUrl && (
                        <div className="relative flex-shrink-0">
                          <img
                            src={uploadedLandingBannerUrl}
                            className="h-16 w-28 object-cover rounded-xl border border-white/5"
                            alt="Offer Image Preview"
                          />
                          <button
                            type="button"
                            onClick={() => { setUploadedLandingBannerUrl(null); setValue("landingPage.imageBanner", ""); }}
                            className="absolute -top-1.5 -right-1.5 bg-red-600 rounded-full p-0.5 text-white hover:bg-red-500 transition-colors"
                            title="Remove image"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      )}
                      <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 hover:border-cyan-500/30 bg-[#171924] py-4 rounded-xl cursor-pointer transition-all">
                        <Upload className="h-5 w-5 text-gray-500 mb-1" />
                        <span className="text-[10px] text-gray-400 font-bold">
                          {isUploadingLanding ? "Uploading..." : uploadedLandingBannerUrl ? "Replace image" : "Click to upload JPG / PNG"}
                        </span>
                        <span className="text-[9px] text-gray-600 mt-0.5">Displayed as the hero banner on the scan landing page</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLandingBannerUpload}
                          className="hidden"
                          disabled={isUploadingLanding}
                        />
                      </label>
                    </div>
                    <input type="hidden" {...register("landingPage.imageBanner")} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Landing Page Title */}
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                        Landing Page Main Heading
                      </label>
                      <input
                        type="text"
                        {...register("landingPage.title")}
                        placeholder="e.g. Scan & Claim Your Premium Water Bottle!"
                        className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white placeholder-gray-600 text-xs focus:outline-none"
                      />
                      {errors.landingPage?.title && (
                        <p className="mt-1 text-[10px] text-red-400">{errors.landingPage.title.message}</p>
                      )}
                    </div>

                    {/* Subtitle */}
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                        Subheading Details
                      </label>
                      <input
                        type="text"
                        {...register("landingPage.subtitle")}
                        placeholder="e.g. Enter details and get 20% discount coupon instantly."
                        className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white placeholder-gray-600 text-xs focus:outline-none"
                      />
                    </div>

                    {/* Offer Text */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                        Promo Deal Highlight (e.g. Coupon Reward)
                      </label>
                      <input
                        type="text"
                        {...register("landingPage.offerText")}
                        placeholder="e.g. Instant 20% Off Eco-Bottles"
                        className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white placeholder-gray-600 text-xs focus:outline-none"
                      />
                    </div>

                    {/* Countdown End */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                        Countdown Timer End
                      </label>
                      <input
                        type="datetime-local"
                        {...register("landingPage.countdownEnd")}
                        className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Buttons & Forms Configuration */}
                  <div className="border-t border-white/5 pt-4 space-y-3">
                    <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wide block">
                      Lead Capture & Action Integrations
                    </span>

                    {/* Lead Form Toggle */}
                    <div className="flex items-center justify-between p-3 bg-[#171924] border border-white/5 rounded-xl">
                      <span className="text-xs font-bold text-white">Enable Lead Form capture</span>
                      <input
                        type="checkbox"
                        {...register("landingPage.leadFormEnabled")}
                        className="rounded border-white/10 text-purple-600 h-4 w-4"
                      />
                    </div>

                    {/* WhatsApp CTA toggle */}
                    <div className="p-3 bg-[#171924] border border-white/5 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#4ade80] flex items-center gap-1.5">
                          <MessageCircle className="h-4 w-4" />
                          <span>WhatsApp button link</span>
                        </span>
                        <input
                          type="checkbox"
                          {...register("landingPage.whatsappButton")}
                          className="rounded border-white/10 text-purple-600 h-4 w-4"
                        />
                      </div>
                      {watchWhatsapp && (
                        <input
                          type="text"
                          {...register("landingPage.whatsappNumber")}
                          placeholder="Phone number in international format, e.g. +15551234567"
                          className="w-full px-4 py-2 bg-[#10121a] border border-white/5 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none"
                        />
                      )}
                    </div>

                    {/* Call CTA Toggle */}
                    <div className="p-3 bg-[#171924] border border-white/5 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                          <Phone className="h-4 w-4" />
                          <span>Direct Phone call button</span>
                        </span>
                        <input
                          type="checkbox"
                          {...register("landingPage.callButton")}
                          className="rounded border-white/10 text-purple-600 h-4 w-4"
                        />
                      </div>
                      {watchCall && (
                        <input
                          type="text"
                          {...register("landingPage.callNumber")}
                          placeholder="Phone number, e.g. +15551234567"
                          className="w-full px-4 py-2 bg-[#10121a] border border-white/5 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none"
                        />
                      )}
                    </div>

                    {/* Website CTA Toggle */}
                    <div className="p-3 bg-[#171924] border border-white/5 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                          <Globe className="h-4 w-4" />
                          <span>Redirect Website button link</span>
                        </span>
                        <input
                          type="checkbox"
                          {...register("landingPage.websiteButton")}
                          className="rounded border-white/10 text-purple-600 h-4 w-4"
                        />
                      </div>
                      {watchWebsite && (
                        <input
                          type="text"
                          {...register("landingPage.websiteUrl")}
                          placeholder="e.g. https://yourcompany.com"
                          className="w-full px-4 py-2 bg-[#10121a] border border-white/5 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none"
                        />
                      )}
                    </div>

                    {/* Google Maps Location */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                        Google Maps Location link (Optional)
                      </label>
                      <input
                        type="text"
                        {...register("landingPage.googleMapsUrl")}
                        placeholder="Google Maps URL"
                        className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white placeholder-gray-600 text-xs focus:outline-none"
                      />
                    </div>

                    {/* Embed Video URL */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                        Embed Campaign video player URL (YouTube/Vimeo)
                      </label>
                      <input
                        type="text"
                        {...register("landingPage.videoUrl")}
                        placeholder="https://www.youtube.com/embed/..."
                        className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white placeholder-gray-600 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Terms & Privacy */}
                  <div className="border-t border-white/5 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                        Terms & Conditions
                      </label>
                      <textarea
                        {...register("landingPage.termsText")}
                        rows={2}
                        placeholder="Conditions text..."
                        className="w-full px-4 py-2 bg-[#171924] border border-white/5 rounded-xl text-white placeholder-gray-600 text-xs focus:outline-none resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                        Privacy Policy
                      </label>
                      <textarea
                        {...register("landingPage.privacyText")}
                        rows={2}
                        placeholder="Privacy text..."
                        className="w-full px-4 py-2 bg-[#171924] border border-white/5 rounded-xl text-white placeholder-gray-600 text-xs focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-6 border-t border-white/5 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-3 bg-[#1c1f2a] hover:bg-[#272b38] border border-white/5 rounded-xl text-xs font-bold text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || isUploading || isUploadingLanding || isUploadingLogo}
                  className="w-1/2 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Saving campaign..." : editingId ? "Save Changes" : "Deploy Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
