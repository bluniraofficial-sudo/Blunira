"use client";

import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Tag,
  Plus,
  Search,
  Trash2,
  Calendar,
  X,
  Building,
  FolderHeart,
  Percent,
  CheckCircle,
  AlertTriangle,
  QrCode,
  Camera,
  Check,
} from "lucide-react";
import {
  createCouponAction,
  deleteCouponAction,
  redeemCouponAction,
} from "@/app/actions/coupon";

// Coupon Validation Schema
const couponSchema = z.object({
  code: z.string().min(3, "Coupon code must be at least 3 characters"),
  title: z.string().min(3, "Coupon title must be at least 3 characters"),
  description: z.string().optional(),
  discount: z.string().min(1, "Discount value is required (e.g. 20% or ₹150)"),
  maxRedemptions: z.number().min(1, "Must be at least 1").optional().or(z.literal("")),
  expiryDate: z.string().optional().or(z.literal("")),
  advertiserId: z.string().uuid("Please select an advertiser"),
  campaignId: z.string().optional().or(z.literal("")),
});

type CouponFormValues = z.infer<typeof couponSchema>;

interface CouponsClientProps {
  initialCoupons: any[];
  advertisers?: any[];
  campaigns?: any[];
  role: "SUPER_ADMIN" | "ADVERTISER";
}

export function CouponsClient({
  initialCoupons,
  advertisers = [],
  campaigns = [],
  role,
}: CouponsClientProps) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Coupon Redemption States
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemSuccessMsg, setRedeemSuccessMsg] = useState<string | null>(null);
  const [redeemErrorMsg, setRedeemErrorMsg] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isScanSuccess, setIsScanSuccess] = useState(false);
  const [scannerTransition, setScannerTransition] = useState<"entering" | "leaving" | "idle">("idle");

  // If the redemption modal is closed, ensure camera/scanning is stopped
  useEffect(() => {
    if (!showRedeemModal) {
      setIsScanning(false);
      setIsScanSuccess(false);
      setScannerTransition("idle");
    }
  }, [showRedeemModal]);

  // Real QR Code Scanner logic using html5-qrcode
  useEffect(() => {
    let html5QrCode: any = null;

    if (isScanning) {
      const startScanner = async () => {
        try {
          // Poll to ensure #qr-reader element exists in the DOM before starting
          let attempts = 0;
          while (!document.getElementById("qr-reader") && attempts < 15) {
            await new Promise(resolve => setTimeout(resolve, 50));
            attempts++;
          }

          if (!document.getElementById("qr-reader")) {
            console.error("qr-reader element not found in DOM");
            setRedeemErrorMsg("Scanner container not ready. Please try again.");
            setIsScanning(false);
            return;
          }

          const { Html5Qrcode } = await import("html5-qrcode");
          html5QrCode = new Html5Qrcode("qr-reader");

          const onSuccess = async (decodedText: string) => {
            // Show success animation before stopping
            setIsScanSuccess(true);
            
            // Stop scanner first to release camera lock immediately
            if (html5QrCode) {
              try {
                await html5QrCode.stop();
              } catch (e) {
                console.error("Error stopping scanner on success:", e);
              }
            }
            
            // Brief delay for success animation to play
            await new Promise(resolve => setTimeout(resolve, 500));

            // Extract code if it's a URL or path, otherwise use it directly
            let finalCode = decodedText;
            try {
              if (decodedText.includes("/q/")) {
                const parts = decodedText.split("/q/");
                finalCode = parts[parts.length - 1];
              } else if (decodedText.startsWith("http")) {
                const urlObj = new URL(decodedText);
                const pathParts = urlObj.pathname.split("/");
                finalCode = pathParts[pathParts.length - 1];
              }
              
              // Strip query params or hash if any exist (e.g. ?qr=QR001 or #hash)
              if (finalCode.includes("?")) {
                finalCode = finalCode.split("?")[0];
              }
              if (finalCode.includes("#")) {
                finalCode = finalCode.split("#")[0];
              }
            } catch (e) {
              console.error("Failed to parse scanned URL:", e);
            }

            setRedeemCode(finalCode.toUpperCase().trim());
            
            // Animate back to form after success
            setScannerTransition("leaving");
            await new Promise(resolve => setTimeout(resolve, 300));
            setIsScanning(false);
            setIsScanSuccess(false);
            setScannerTransition("idle");
          };

          const onVerboseError = (errorMessage: string) => {
            // verbose logs, ignore
          };

          try {
            await html5QrCode.start(
              { facingMode: "environment" },
              {
                fps: 10,
                qrbox: (width: number, height: number) => {
                  const size = Math.min(width, height) * 0.7;
                  return size > 50 ? { width: size, height: size } : { width: 250, height: 250 };
                },
              },
              onSuccess,
              onVerboseError
            );
          } catch (e) {
            console.warn("Failed to start with environment facingMode, trying camera list fallback...", e);
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length > 0) {
              // Try to find a back/rear camera first
              const backCamera = devices.find(device => 
                device.label.toLowerCase().includes("back") || 
                device.label.toLowerCase().includes("environment") ||
                device.label.toLowerCase().includes("rear")
              );
              const cameraId = backCamera ? backCamera.id : devices[0].id;
              
              await html5QrCode.start(
                cameraId,
                {
                  fps: 10,
                  qrbox: (width: number, height: number) => {
                    const size = Math.min(width, height) * 0.7;
                    return size > 50 ? { width: size, height: size } : { width: 250, height: 250 };
                  },
                },
                onSuccess,
                onVerboseError
              );
            } else {
              throw new Error("No cameras found on device.");
            }
          }
        } catch (err: any) {
          console.error("Error starting camera scanner:", err);
          setRedeemErrorMsg("Could not access camera. Please check permissions.");
          setIsScanning(false);
        }
      };

      const timer = setTimeout(() => {
        setScannerTransition("entering");
        startScanner();
      }, 100);
      return () => {
        clearTimeout(timer);
        if (html5QrCode && html5QrCode.isScanning) {
          try {
            html5QrCode.stop().catch((err: any) => {
              // Ignore async stop errors in cleanup
            });
          } catch (err) {
            // Ignore sync stop errors in cleanup
          }
        }
      };
    }
  }, [isScanning]);

  const isAdmin = role === "SUPER_ADMIN";

  // List of coupons awaiting validation scan
  const claimableCoupons = coupons.filter(c => c.maxRedemptions === 1 && c.currentRedemptions === 0);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCode) return;

    setIsRedeeming(true);
    setRedeemErrorMsg(null);
    setRedeemSuccessMsg(null);

    try {
      const result = await redeemCouponAction(redeemCode);
      setRedeemSuccessMsg(result.message);
      
      // Update coupons list locally
      setCoupons(
        coupons.map((c) => 
          c.code === redeemCode.toUpperCase().trim() 
            ? { ...c, currentRedemptions: 1 } 
            : c
        )
      );
      setRedeemCode("");
    } catch (err: any) {
      setRedeemErrorMsg(err.message || "Redemption failed.");
    } finally {
      setIsRedeeming(false);
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
  });

  const selectedAdvertiserId = watch("advertiserId");

  // Filter campaigns list in modal based on selected advertiser
  const filteredCampaigns = campaigns.filter(
    (c) => c.advertiserId === selectedAdvertiserId
  );

  // Filter coupons list
  const filtered = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.advertiser.companyName.toLowerCase().includes(search.toLowerCase()) ||
      (c.campaign && c.campaign.name.toLowerCase().includes(search.toLowerCase()))
  );

  const openCreateModal = () => {
    reset({
      code: "",
      title: "",
      description: "",
      discount: "",
      maxRedemptions: "",
      expiryDate: "",
      advertiserId: advertisers[0]?.id || "",
      campaignId: "",
    });
    setErrorMsg(null);
    setShowModal(true);
  };

  const onSubmit = async (data: CouponFormValues) => {
    setIsLoading(true);
    setErrorMsg(null);

    const formattedData = {
      ...data,
      maxRedemptions: data.maxRedemptions ? Number(data.maxRedemptions) : undefined,
      campaignId: data.campaignId || null,
      expiryDate: data.expiryDate || undefined,
    };

    try {
      const created = await createCouponAction(formattedData);
      setCoupons([created, ...coupons]);
      setShowModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create coupon");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Existing lead redemptions will remain archived.",
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
      await deleteCouponAction(id);
      setCoupons(coupons.filter((c) => c.id !== id));
      Swal.fire({
        title: "Deleted!",
        text: "Coupon has been deleted successfully.",
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
        text: "Failed to delete coupon.",
        icon: "error",
        background: "#12141c",
        color: "#ffffff",
        customClass: {
          popup: "border border-white/5 rounded-3xl",
        }
      });
    }
  };

  const checkExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Discount Coupons</h1>
          <p className="text-gray-400 text-xs mt-1">
            {isAdmin
              ? "Create promotion discount codes, set usage limits, and link them to campaigns."
              : "View active promotion discount codes and redemption numbers."}
          </p>
        </div>
        {isAdmin ? (
          <button
            onClick={openCreateModal}
            className="px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-purple-900/10 transition-all flex items-center gap-2 cursor-pointer text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Create Coupon</span>
          </button>
        ) : (
          <button
            onClick={() => {
              setRedeemErrorMsg(null);
              setRedeemSuccessMsg(null);
              setRedeemCode("");
              setIsScanning(false);
              setShowRedeemModal(true);
            }}
            className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-900/10 transition-all flex items-center gap-2 cursor-pointer text-xs"
          >
            <QrCode className="h-4 w-4" />
            <span>Redeem Coupon</span>
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
            placeholder="Search coupon code, title, client, campaign..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#171924]/85 border border-white/5 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>
      </div>

      {/* Coupons list */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 text-xs">
        {filtered.length > 0 ? (
          filtered.map((c) => {
            const isExpired = checkExpired(c.expiryDate);
            return (
              <div
                key={c.id}
                className="bg-[#12141c]/65 border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-white/10 transition-all relative overflow-hidden"
              >
                {/* Coupon graphic notch */}
                <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 bg-[#0a0c10] rounded-full border-r border-white/5" />
                <div className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 bg-[#0a0c10] rounded-full border-l border-white/5" />

                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-purple-500/10 border border-purple-500/15 text-purple-400 rounded-xl">
                        <Tag className="h-5 w-5 animate-pulse" />
                      </div>
                      <div>
                        <span className="font-mono font-black text-white text-base block tracking-wider uppercase">
                          {c.code}
                        </span>
                        <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">
                          {c.discount} discount
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                        isExpired
                          ? "bg-red-500/10 border-red-500/20 text-red-400"
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {isExpired ? "EXPIRED" : "ACTIVE"}
                    </span>
                  </div>

                  <h3 className="text-white font-bold text-sm mb-1.5">{c.title}</h3>
                  {c.description && <p className="text-gray-400 text-[11px] mb-4 leading-normal">{c.description}</p>}

                  {/* Association details */}
                  <div className="space-y-2 border-t border-dashed border-white/5 pt-4 text-gray-500 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5" />
                      <span>Client: <strong className="text-gray-300">{c.advertiser.companyName}</strong></span>
                    </div>
                    {c.campaign && (
                      <div className="flex items-center gap-1.5">
                        <FolderHeart className="h-3.5 w-3.5" />
                        <span>Campaign: <strong className="text-gray-300">{c.campaign.name}</strong></span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Percent className="h-3.5 w-3.5" />
                      <span>
                        Claimed:{" "}
                        <strong className="text-gray-300">
                          {c.currentRedemptions} {c.maxRedemptions ? `/ ${c.maxRedemptions}` : ""}
                        </strong>
                      </span>
                    </div>
                    {c.expiryDate && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Expires: <strong className="text-gray-300">{new Date(c.expiryDate).toLocaleDateString()}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Admin Toolbar */}
                {isAdmin && (
                  <div className="flex justify-end border-t border-white/5 pt-4 mt-6">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-2 bg-red-950/20 hover:bg-red-900/30 border border-red-950/40 rounded-xl text-red-400 hover:text-red-300 transition-all cursor-pointer"
                      title="Delete Coupon"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full bg-[#12141c]/40 border border-white/5 border-dashed rounded-3xl py-16 text-center">
            <Tag className="h-10 w-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No coupons found.</p>
          </div>
        )}
      </div>

      {/* Coupon Modal Builder */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999999] flex items-start justify-center p-4 pt-16 sm:pt-24 overflow-y-auto">
          <div className="bg-[#12141c] border border-white/5 rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-fade-in text-xs">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 bg-[#1c1f2a] border border-white/5 rounded-xl text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Tag className="h-5 w-5 text-purple-400" />
              <span>Create Coupon Code</span>
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              Generate a unique discount coupon that customers can unlock by scanning QR codes.
            </p>

            {errorMsg && (
              <div className="mb-4 text-xs p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Advertiser Select */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                  Client Advertiser
                </label>
                <select
                  {...register("advertiserId")}
                  className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white text-xs focus:outline-none"
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

              {/* Campaign Select (Conditional) */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                  Link to Campaign (Optional)
                </label>
                <select
                  {...register("campaignId")}
                  className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white text-xs focus:outline-none"
                >
                  <option value="">-- No Link (Global to Advertiser) --</option>
                  {filteredCampaigns.map((camp) => (
                    <option key={camp.id} value={camp.id}>
                      {camp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Coupon Code */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    {...register("code")}
                    placeholder="e.g. SUMMER20"
                    className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white placeholder-gray-600 text-xs focus:outline-none"
                  />
                  {errors.code && (
                    <p className="mt-1 text-[10px] text-red-400">{errors.code.message}</p>
                  )}
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                    Discount Value
                  </label>
                  <input
                    type="text"
                    {...register("discount")}
                    placeholder={role === "SUPER_ADMIN" ? "e.g. 20% or ₹150" : "e.g. 20% or $15"}
                    className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white placeholder-gray-600 text-xs focus:outline-none"
                  />
                  {errors.discount && (
                    <p className="mt-1 text-[10px] text-red-400">{errors.discount.message}</p>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                  Coupon Title
                </label>
                <input
                  type="text"
                  {...register("title")}
                  placeholder="e.g. 20% Off Next Purchase"
                  className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white placeholder-gray-600 text-xs focus:outline-none"
                />
                {errors.title && (
                  <p className="mt-1 text-[10px] text-red-400">{errors.title.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                  Description Details (Optional)
                </label>
                <input
                  type="text"
                  {...register("description")}
                  placeholder="e.g. Apply code during checkout..."
                  className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white placeholder-gray-600 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Max claim redemptions */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                    Claim Limit (Optional)
                  </label>
                  <input
                    type="number"
                    {...register("maxRedemptions", { valueAsNumber: true })}
                    placeholder="e.g. 100"
                    className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white placeholder-gray-600 text-xs focus:outline-none"
                  />
                </div>

                {/* Expiry date */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    {...register("expiryDate")}
                    className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-2.5 bg-[#1c1f2a] hover:bg-[#272b38] border border-white/5 rounded-xl text-xs font-bold text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-1/2 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  {isLoading ? "Creating..." : "Save Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupon Redemption Modal */}
      {showRedeemModal && !isAdmin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999999] flex items-start justify-center p-4 pt-16 sm:pt-24 overflow-y-auto">
          <div className="bg-[#12141c] border border-white/5 rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-fade-in text-xs text-left">
            <button
              onClick={() => setShowRedeemModal(false)}
              className="absolute top-4 right-4 p-2 bg-[#1c1f2a] border border-white/5 rounded-xl text-gray-400 hover:text-white cursor-pointer animate-fade-in"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <QrCode className="h-5 w-5 text-emerald-400 animate-pulse" />
              <span>Redeem Customer Coupon</span>
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              Enter the unique customer coupon code or simulate scanning the QR code to validate and redeem the discount.
            </p>

            {redeemErrorMsg && (
              <div className="mb-4 text-xs p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-200 flex gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{redeemErrorMsg}</span>
              </div>
            )}

            {redeemSuccessMsg && (
              <div className="mb-4 text-xs p-3 bg-emerald-950/40 border border-emerald-900/50 rounded-xl text-emerald-200 flex gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{redeemSuccessMsg}</span>
              </div>
            )}

            {isScanning ? (
              /* Mobile-friendly QR Scanner with animations */
              <div className={`space-y-4 text-left ${scannerTransition === "leaving" ? "animate-scan-fade-down" : "animate-scan-fade-up"}`}>
                {/* Scanner container — full-width with scan overlay */}
                <div className="relative w-full aspect-square max-h-[340px] sm:max-h-[300px] rounded-2xl overflow-hidden bg-black/80 border-2 border-emerald-500/30 animate-scanner-glow">
                  <div id="qr-reader" className="w-full h-full" />
                  
                  {/* Scan frame corners */}
                  <div className="absolute inset-0 pointer-events-none z-10">
                    {/* Corner brackets */}
                    <div className="absolute top-3 left-3 w-8 h-8 border-t-3 border-l-3 border-emerald-400 rounded-tl-lg animate-scan-corner" style={{ borderTopWidth: 3, borderLeftWidth: 3 }} />
                    <div className="absolute top-3 right-3 w-8 h-8 border-t-3 border-r-3 border-emerald-400 rounded-tr-lg animate-scan-corner" style={{ borderTopWidth: 3, borderRightWidth: 3, animationDelay: '0.3s' }} />
                    <div className="absolute bottom-3 left-3 w-8 h-8 border-b-3 border-l-3 border-emerald-400 rounded-bl-lg animate-scan-corner" style={{ borderBottomWidth: 3, borderLeftWidth: 3, animationDelay: '0.6s' }} />
                    <div className="absolute bottom-3 right-3 w-8 h-8 border-b-3 border-r-3 border-emerald-400 rounded-br-lg animate-scan-corner" style={{ borderBottomWidth: 3, borderRightWidth: 3, animationDelay: '0.9s' }} />
                    
                    {/* Scanning line animation */}
                    <div className="absolute left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan-line z-10 shadow-[0_0_12px_rgba(52,211,153,0.6)]" style={{ filter: 'blur(0.5px)' }} />
                    
                    {/* Overlay gradient for focus effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/40" />
                  </div>
                  
                  {/* Success overlay */}
                  {isScanSuccess && (
                    <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center z-20 animate-scan-fade-up">
                      <div className="bg-emerald-500 rounded-full p-4 animate-scan-success">
                        <Check className="h-10 w-10 text-white" />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Scanner helper text animated */}
                <div className="flex items-center justify-center gap-2 animate-scan-fade-up">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-camera-pulse" />
                  <p className="text-xs text-center text-gray-400 font-medium">
                    {isScanSuccess ? "Code detected!" : "Align the customer's QR code within the frame"}
                  </p>
                </div>

                {/* Fallback select for claimable coupons */}
                {claimableCoupons.length > 0 && !isScanSuccess && (
                  <div className="border-t border-white/5 pt-4 mt-2 animate-scan-fade-up">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                      Or select a pending coupon
                    </label>
                    <div className="relative">
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            setScannerTransition("leaving");
                            setTimeout(() => {
                              setIsScanning(false);
                              setRedeemCode(val);
                              setScannerTransition("idle");
                            }, 300);
                          }
                        }}
                        className="w-full px-4 py-3 bg-[#171924] border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer"
                      >
                        <option value="">-- Choose Coupon --</option>
                        {claimableCoupons.map((c) => (
                          <option key={c.id} value={c.code}>
                            {c.code} — {c.redemptions?.[0]?.lead?.name || "No Name"}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                {claimableCoupons.length === 0 && !isScanSuccess && (
                  <p className="text-[10px] text-gray-500 text-center py-1 animate-scan-fade-up">
                    No pending customer coupons found to scan.
                  </p>
                )}

                {/* Bottom actions */}
                <div className="flex gap-3 pt-2 animate-scan-fade-up">
                  <button
                    type="button"
                    onClick={() => {
                      setScannerTransition("leaving");
                      setTimeout(() => {
                        setIsScanning(false);
                        setIsScanSuccess(false);
                        setScannerTransition("idle");
                      }, 200);
                    }}
                    className="flex-1 py-3 bg-[#1c1f2a] hover:bg-[#272b38] border border-white/5 rounded-xl text-sm font-bold text-gray-300 transition-all cursor-pointer active:scale-[0.98]"
                  >
                    Cancel Scanner
                  </button>
                </div>
              </div>
            ) : (
              /* Manual Input Form */
              <form onSubmit={handleRedeem} className="space-y-4 animate-scan-fade-up">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                    Customer Coupon Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={redeemCode}
                      onChange={(e) => setRedeemCode(e.target.value)}
                      placeholder="e.g. BOTTLE20-F8E3"
                      className="flex-1 px-4 py-3 bg-[#171924] border border-white/5 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-w-0"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsScanning(true);
                        setIsScanSuccess(false);
                      }}
                      className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25 rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95 animate-camera-pulse shrink-0"
                      title="Open QR scanner"
                    >
                      <Camera className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRedeemModal(false)}
                    className="flex-1 py-3 bg-[#1c1f2a] hover:bg-[#272b38] border border-white/5 rounded-xl text-sm font-bold text-gray-300 transition-all active:scale-[0.98]"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isRedeeming || !redeemCode}
                    className="w-1/2 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50"
                  >
                    {isRedeeming ? "Verifying..." : "Redeem Coupon"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
