"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CheckCircle,
  Copy,
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
  Play,
  Shield,
  Globe,
  Timer,
  Gift,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { LoadingButton } from "@/components/ui/loading-button";

// Form Schema
const leadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(8, "Please enter a valid phone number"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  city: z.string().min(2, "City name must be at least 2 characters").optional().or(z.literal("")),
  consentCheck: z.boolean().refine((val) => val === true, {
    message: "Consent is required to submit the form.",
  }),
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface LandingPageClientProps {
  landingPage: any;
  qrCode?: string;
  preClaimedCode?: string | null;
  preClaimedDiscount?: string | null;
  isOfferEnded?: boolean;
  hasSubmitted?: boolean;
  isRedeemed?: boolean;
  couponPeriodConcluded?: boolean;
  serverCity?: string | null;
  serverCountry?: string | null;
  serverDevice?: string | null;
  serverIp?: string | null;
}

export function LandingPageClient({ 
  landingPage, 
  qrCode, 
  preClaimedCode = null, 
  preClaimedDiscount = null,
  isOfferEnded = false,
  hasSubmitted = false,
  isRedeemed = false,
  couponPeriodConcluded = false,
  serverCity = null,
  serverCountry = null,
  serverDevice = null,
  serverIp = null
}: LandingPageClientProps) {
  const isLeadOnly = !landingPage.campaign.coupons || landingPage.campaign.coupons.length === 0;
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(hasSubmitted);
  const [couponCode, setCouponCode] = useState<string | null>(preClaimedCode);
  const [couponDiscount, setCouponDiscount] = useState<string | null>(preClaimedDiscount);
  const [isRedeemedState, setIsRedeemedState] = useState(isRedeemed);
  const [isCopied, setIsCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [detectedLoc, setDetectedLoc] = useState<{ city: string; country: string; device: string } | null>(
    serverCity || serverCountry ? {
      city: serverCity || "",
      country: serverCountry || "",
      device: serverDevice || "Desktop"
    } : null
  );

  // Custom Toastify and SweetAlert States
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [sweetAlert, setSweetAlert] = useState<{ title: string; text: string; type: "success" | "error" } | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: { name: "", phone: "", email: "", city: "", consentCheck: false },
  });

  // Clean native HTML GET parameters if they exist in URL to prevent native form page reload artifacts
  useEffect(() => {
    setMounted(true);

    // Read cookies to fetch scan metadata
    const getCookie = (name: string) => {
      if (typeof document === "undefined") return "";
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(";").shift() || "");
      return "";
    };

    // Prefill form from localStorage or cookies if available
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("lead_name") || getCookie("lead_name");
      const savedPhone = localStorage.getItem("lead_phone") || getCookie("lead_phone");
      const savedEmail = localStorage.getItem("lead_email") || getCookie("lead_email");
      if (savedName) setValue("name", savedName);
      if (savedPhone) setValue("phone", savedPhone);
      if (savedEmail) setValue("email", savedEmail);
    }

    const getDeviceType = () => {
      if (typeof window === "undefined") return "Desktop";
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes("tablet") || ua.includes("ipad")) return "Tablet";
      if (ua.includes("mobile") || ua.includes("iphone") || ua.includes("android")) return "Mobile";
      return "Desktop";
    };

    const getBrowserAndOS = () => {
      if (typeof window === "undefined") return { browser: "Unknown", os: "Unknown" };
      const ua = navigator.userAgent;
      let browser = "Unknown";
      let os = "Unknown";

      if (ua.includes("Firefox")) browser = "Firefox";
      else if (ua.includes("Chrome")) browser = "Chrome";
      else if (ua.includes("Safari")) browser = "Safari";
      else if (ua.includes("Edge")) browser = "Edge";

      if (ua.includes("Windows")) os = "Windows";
      else if (ua.includes("Mac")) os = "MacOS";
      else if (ua.includes("Linux")) os = "Linux";
      else if (ua.includes("Android")) os = "Android";
      else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

      return { browser, os };
    };

    const cookieCity = getCookie("last_scan_city");
    const cookieCountry = getCookie("last_scan_country");
    const cookieDevice = getCookie("last_scan_device");

    // Initialize with server/cookie details first as fallback
    const initialCity = serverCity || cookieCity || "";
    const initialCountry = serverCountry || cookieCountry || "";
    const initialDevice = serverDevice || cookieDevice || getDeviceType();

    setDetectedLoc({
      city: initialCity,
      country: initialCountry,
      device: initialDevice,
    });
    if (initialCity) {
      setValue("city", initialCity);
    }

    // Request precise browser geolocation
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            if (res.ok) {
              const data = await res.json();
              const detectedCity = data.city || data.locality || data.principalSubdivision || "";
              const detectedCountry = data.countryName || "";
              if (detectedCity) {
                setDetectedLoc({
                  city: detectedCity,
                  country: detectedCountry,
                  device: initialDevice,
                });
                setValue("city", detectedCity);
              }
            }
          } catch (err) {
            console.error("Reverse geocoding failed:", err);
          }
        },
        (error) => {
          console.warn("Geolocation permission denied or error:", error);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }

    // Check if this device has already claimed the reward
    const claimedCookie = getCookie(`claimed_campaign_${landingPage.campaignId}`);
    if (claimedCookie === "true") {
      setIsSubmitted(true);
      const code = getCookie(`claimed_code_${landingPage.campaignId}`);
      const discount = getCookie(`claimed_discount_${landingPage.campaignId}`);
      if (code) setCouponCode(code);
      if (discount) setCouponDiscount(discount);
    } else if (hasSubmitted) {
      setIsSubmitted(true);
    }

    const fetchActualData = async () => {
      try {
        let actualCity = serverCity || "";
        let actualCountry = serverCountry || "";
        let actualIp = serverIp || "127.0.0.1";
        const clientDevice = serverDevice || getDeviceType();
        const { browser, os } = getBrowserAndOS();

        if (!serverCity && !serverCountry) {
          const res = await fetch("https://ipapi.co/json/");
          if (res.ok) {
            const geo = await res.json();
            if (geo && !geo.error) {
              actualCity = geo.city || "";
              actualCountry = geo.country_name || "";
              actualIp = geo.ip || "";
            }
          }
        }

        // Set state
        setDetectedLoc({
          city: actualCity,
          country: actualCountry,
          device: clientDevice,
        });

        // Set cookies client-side (1 day)
        document.cookie = `last_scan_city=${encodeURIComponent(actualCity)}; path=/; max-age=86400`;
        document.cookie = `last_scan_country=${encodeURIComponent(actualCountry)}; path=/; max-age=86400`;
        document.cookie = `last_scan_ip=${encodeURIComponent(actualIp)}; path=/; max-age=86400`;
        document.cookie = `last_scan_device=${encodeURIComponent(clientDevice)}; path=/; max-age=86400`;

        // Prefill Form City
        if (actualCity) {
          setValue("city", actualCity);
        }

        // Call scans update API
        const activeQr = qrCode || getCookie("last_scan_qr");
        if (activeQr) {
          await fetch("/api/scans/update", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Bypass-Tunnel-Reminder": "true"
            },
            body: JSON.stringify({
              qrCodeId: activeQr,
              ipAddress: actualIp,
              city: actualCity,
              country: actualCountry,
              deviceType: clientDevice,
              browser,
              os,
            }),
          });
        }
      } catch (err) {
        console.error("Error fetching actual client data:", err);
      }
    };

    fetchActualData();

    if (typeof window !== "undefined" && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      if (params.get("success") === "true") {
        setIsSubmitted(true);
        const code = params.get("couponCode");
        const disc = params.get("discount");
        if (code) setCouponCode(code);
        if (disc) setCouponDiscount(disc);

        setSweetAlert({
          title: isLeadOnly ? "Enquiry Submitted!" : "Claimed Successfully!",
          text: isLeadOnly 
            ? "Your details have been registered. Thank you!" 
            : "Your reward has been unlocked and verified. Check the details below!",
          type: "success"
        });
        setToast({ 
          message: isLeadOnly ? "Enquiry successfully submitted!" : "Reward coupon successfully claimed!", 
          type: "success" 
        });
      }

      const errorMsgFromUrl = params.get("error");
      if (errorMsgFromUrl) {
        setErrorMsg(errorMsgFromUrl);
        setSweetAlert({
          title: isLeadOnly ? "Submission Error!" : "Action Required!",
          text: errorMsgFromUrl,
          type: "error"
        });
        setToast({ 
          message: isLeadOnly ? "Failed to submit enquiry." : "Failed to claim reward coupon.", 
          type: "error" 
        });
      }

      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [setValue, serverCity, serverCountry, serverDevice, serverIp, qrCode, landingPage.campaignId, hasSubmitted]);

  // Automatically clear Toast after 3 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Countdown timer logic
  useEffect(() => {
    if (!landingPage.countdownEnd) return;
    const targetDate = new Date(landingPage.countdownEnd).getTime();
    const updateTimer = () => {
      const difference = targetDate - Date.now();
      if (difference <= 0) { setTimeLeft(null); return; }
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [landingPage.countdownEnd]);

  const onSubmit = async (data: LeadFormValues) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch(`/api/landing-pages/${landingPage.id}/lead`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Bypass-Tunnel-Reminder": "true"
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Submission failed");
      
      // Save form fields to localStorage & cookies for future scans/autofill
      if (typeof window !== "undefined") {
        localStorage.setItem("lead_name", data.name);
        localStorage.setItem("lead_phone", data.phone);
        
        document.cookie = `lead_name=${encodeURIComponent(data.name)}; path=/; max-age=31536000`; // 1 year
        document.cookie = `lead_phone=${encodeURIComponent(data.phone)}; path=/; max-age=31536000`;
        
        if (data.email) {
          localStorage.setItem("lead_email", data.email);
          document.cookie = `lead_email=${encodeURIComponent(data.email)}; path=/; max-age=31536000`;
        } else {
          localStorage.removeItem("lead_email");
          document.cookie = `lead_email=; path=/; max-age=0`;
        }
      }

      setIsSubmitted(true);
      if (result.couponCode) {
        setCouponCode(result.couponCode);
        setCouponDiscount(result.discount);
      }

      // Trigger custom SweetAlert Success
      setSweetAlert({
        title: isLeadOnly ? "Enquiry Submitted!" : "Claimed Successfully!",
        text: isLeadOnly 
          ? "Your details have been registered. Thank you!" 
          : "Your reward has been unlocked and verified. Check the details below!",
        type: "success"
      });
      setToast({ 
        message: isLeadOnly ? "Enquiry successfully submitted!" : "Reward coupon successfully claimed!", 
        type: "success" 
      });
    } catch (err: any) {
      const errMsg = err.message || "An unexpected error occurred. Please try again.";
      setErrorMsg(errMsg);

      // Trigger custom SweetAlert Error
      setSweetAlert({
        title: isLeadOnly ? "Submission Error!" : "Action Required!",
        text: errMsg,
        type: "error"
      });
      setToast({ 
        message: isLeadOnly ? "Failed to submit enquiry." : "Failed to claim reward coupon.", 
        type: "error" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onInvalid = (errors: any) => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const firstErrorKey = errorKeys[0];
      const errMsg = errors[firstErrorKey].message || "Please fill all required fields correctly.";
      setSweetAlert({
        title: "Validation Error!",
        text: errMsg,
        type: "error"
      });
      setToast({ message: errMsg, type: "error" });
    }
  };

  const handleCopy = () => {
    if (!couponCode) return;
    navigator.clipboard.writeText(couponCode);
    setIsCopied(true);
    
    // Trigger custom Toastify Feedback
    setToast({
      message: "Reward code copied to clipboard!",
      type: "success"
    });
    
    setTimeout(() => setIsCopied(false), 2000);
  };

  const bannerSrc = landingPage.imageBanner || null;
  const hasCtas = (landingPage.whatsappButton && landingPage.whatsappNumber) ||
    (landingPage.callButton && landingPage.callNumber) ||
    (landingPage.websiteButton && landingPage.websiteUrl) ||
    landingPage.googleMapsUrl;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #020509; font-family: 'Inter', system-ui, sans-serif; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes ping {
          0%   { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-4px); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .fade-up { animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .fade-up-delay-1 { animation-delay: 0.07s; }
        .fade-up-delay-2 { animation-delay: 0.14s; }
        .fade-up-delay-3 { animation-delay: 0.21s; }
        .fade-up-delay-4 { animation-delay: 0.28s; }

        .shimmer-text {
          background: linear-gradient(90deg, #22d3ee 0%, #a78bfa 40%, #22d3ee 80%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }

        .glass-card {
          background: rgba(9,18,32,0.85);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }

        .cta-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 16px;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          cursor: pointer;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .cta-btn:active { transform: scale(0.97); }

        .form-input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(0,0,0,0.35);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          color: #e2eaf4;
          font-size: 14px;
          font-family: 'Inter', system-ui, sans-serif;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-input::placeholder { color: #2e4a62; }
        .form-input:focus {
          border-color: rgba(6,182,212,0.5);
          box-shadow: 0 0 0 3px rgba(6,182,212,0.08);
        }

        .submit-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #06b6d4, #2563eb);
          border: none;
          border-radius: 16px;
          color: white;
          font-size: 15px;
          font-weight: 800;
          font-family: 'Inter', system-ui, sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 8px 32px rgba(6,182,212,0.3);
          transition: all 0.25s ease;
          letter-spacing: -0.01em;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(6,182,212,0.45);
          filter: brightness(1.08);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Custom SweetAlert CSS ── */
        .swal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(2,5,9,0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          animation: fadeIn 0.2s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .swal-modal {
          background: #091220;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 28px;
          padding: 32px 24px;
          width: 90%;
          max-width: 380px;
          text-align: center;
          box-shadow: 0 24px 64px rgba(0,0,0,0.6);
          animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        .swal-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .swal-icon-success {
          background: rgba(16,185,129,0.1);
          border: 2.5px solid #10b981;
          color: #10b981;
        }
        .swal-icon-error {
          background: rgba(239,68,68,0.1);
          border: 2.5px solid #ef4444;
          color: #ef4444;
        }
        .swal-title {
          font-size: 18px;
          font-weight: 900;
          color: #fff;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }
        .swal-text {
          font-size: 13px;
          color: #8ba3bc;
          line-height: 1.6;
        }
        .swal-btn {
          margin-top: 24px;
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #06b6d4, #2563eb);
          border: none;
          border-radius: 14px;
          color: white;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(6,182,212,0.2);
        }
        .swal-btn:hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }
        .swal-btn:active {
          transform: translateY(0);
        }

        /* ── Custom Toastify CSS ── */
        .toast-container {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100000;
          width: 90%;
          max-width: 350px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
        }
        .toast-item {
          background: rgba(9,18,32,0.95);
          border: 1px solid rgba(255,255,255,0.08);
          border-left: 4px solid #06b6d4;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 14px;
          padding: 14px 18px;
          color: #e2eaf4;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 16px 32px rgba(0,0,0,0.4);
          animation: slideDown 0.35s cubic-bezier(0.16,1,0.3,1);
          pointer-events: auto;
        }
        .toast-item-success { border-left-color: #10b981; }
        .toast-item-error { border-left-color: #ef4444; }
        @keyframes slideDown {
          from { transform: translateY(-24px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#020509", color: "#e2eaf4", fontFamily: "'Inter', system-ui, sans-serif" }}>

        {/* ── Hero Banner ── */}
        <div style={{ position: "relative", width: "100%", maxWidth: "480px", margin: "0 auto", aspectRatio: "16/9", overflow: "hidden", background: "#091220" }}>
          {bannerSrc && !imgError ? (
            <img
              src={bannerSrc}
              alt={landingPage.title}
              onError={() => setImgError(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #091220 0%, #0c1e36 50%, #091220 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "10px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "18px", background: "linear-gradient(135deg, #22d3ee 0%, #2563eb 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(6,182,212,0.25)" }}>
                <Sparkles size={24} color="white" />
              </div>
              <span style={{ color: "#2e4a62", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                {isLeadOnly ? "Campaign Info" : "Campaign Offer"}
              </span>
            </div>
          )}
          {/* Gradient overlay */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(2,5,9,0.9) 100%)" }} />
          {/* QR tag */}
          {qrCode && (
            <div style={{ position: "absolute", top: "12px", right: "12px", padding: "4px 10px", borderRadius: "8px", background: "rgba(9,18,32,0.85)", border: "1px solid rgba(6,182,212,0.2)", backdropFilter: "blur(8px)", color: "#22d3ee", fontSize: "10px", fontWeight: 800, fontFamily: "monospace", letterSpacing: "0.05em" }}>
              #{qrCode}
            </div>
          )}
        </div>

        {/* ── Main Content Container ── */}
        <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 16px 80px" }}>

          {/* Brand bar */}
          <div className="fade-up glass-card" style={{ borderRadius: "20px", padding: "14px 18px", marginTop: "-24px", position: "relative", zIndex: 10, display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
            {landingPage.campaign.logoUrl ? (
              <img
                src={landingPage.campaign.logoUrl}
                alt={landingPage.campaign.advertiser.companyName}
                style={{ width: "38px", height: "38px", borderRadius: "12px", objectFit: "cover", flexShrink: 0, boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}
              />
            ) : (
              <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: "linear-gradient(135deg, #22d3ee, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 16px rgba(6,182,212,0.3)" }}>
                <Sparkles size={16} color="white" />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: "13px", letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {landingPage.campaign.advertiser.companyName}
              </div>
              <div style={{ color: "#22d3ee", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "2px" }}>
                Verified Campaign
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "8px", padding: "4px 8px" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#10b981", display: "inline-block", boxShadow: "0 0 0 0 rgba(16,185,129,0.4)", animation: "ping 2s ease-out infinite" }} />
              <span style={{ color: "#34d399", fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>Live</span>
            </div>
          </div>

          {/* Headline */}
          <div className="fade-up fade-up-delay-1" style={{ marginBottom: "20px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.2, color: "#ffffff" }}>
              {landingPage.title}
            </h1>
            {landingPage.subtitle && (
              <p style={{ color: "#4a6580", fontSize: "13px", lineHeight: 1.6, marginTop: "8px" }}>
                {landingPage.subtitle}
              </p>
            )}
          </div>

          {/* Offer Banner */}
          {landingPage.offerText && (
            <div className="fade-up fade-up-delay-2" style={{ marginBottom: "20px", position: "relative", borderRadius: "20px", overflow: "hidden", padding: "20px", border: "1px solid rgba(6,182,212,0.15)", background: "rgba(6,182,212,0.04)" }}>
              {/* Glow */}
              <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "120px", height: "120px", borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.15), transparent 70%)", pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                {isLeadOnly ? <Sparkles size={14} color="#22d3ee" /> : <Gift size={14} color="#22d3ee" />}
                <span style={{ color: "#22d3ee", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {isLeadOnly ? "Campaign Details" : "Exclusive Offer"}
                </span>
              </div>
              <p className="shimmer-text" style={{ fontSize: "18px", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.3 }}>
                {landingPage.offerText}
              </p>
            </div>
          )}

          {/* Countdown */}
          {timeLeft && (
            <div className="fade-up fade-up-delay-2" style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "12px" }}>
                <Timer size={13} color="#4a6580" />
                <span style={{ color: "#4a6580", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Offer expires in</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                {[
                  { label: "Days", val: timeLeft.days },
                  { label: "Hours", val: timeLeft.hours },
                  { label: "Mins", val: timeLeft.minutes },
                  { label: "Secs", val: timeLeft.seconds },
                ].map((item, idx) => (
                  <div key={idx} className="glass-card" style={{ borderRadius: "16px", padding: "14px 8px", textAlign: "center" }}>
                    <span style={{ display: "block", fontSize: "24px", fontWeight: 900, color: "#fff", fontFamily: "monospace", lineHeight: 1 }}>
                      {String(item.val).padStart(2, "0")}
                    </span>
                    <span style={{ display: "block", fontSize: "9px", color: "#4a6580", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "4px" }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lead Form / Coupon Card */}
          <div className="fade-up fade-up-delay-3 glass-card" style={{ borderRadius: "24px", padding: "24px", marginBottom: "20px", boxShadow: "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
            {!isSubmitted ? (
              <>
                <div style={{ marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", marginBottom: "4px" }}>
                    {isLeadOnly ? "Submit Enquiry" : "Claim your reward"}
                  </h2>
                  <p style={{ color: "#4a6580", fontSize: "12px" }}>
                    {isLeadOnly ? "Fill in the fields below to submit your details." : "Fill in the fields below to unlock your exclusive code."}
                  </p>
                </div>

                {couponPeriodConcluded && !isLeadOnly && (
                  <div style={{ 
                    padding: "12px 14px", 
                    background: "rgba(245,158,11,0.06)", 
                    border: "1px solid rgba(245,158,11,0.15)", 
                    borderRadius: "14px", 
                    marginBottom: "16px", 
                    color: "#f59e0b", 
                    fontSize: "11px", 
                    fontWeight: 500,
                    lineHeight: "1.4",
                    textAlign: "left"
                  }}>
                    ⚠️ Notice: The coupon reward period for this campaign has concluded. You can still register to receive future updates and promotions!
                  </div>
                )}

                {detectedLoc && (
                  <div style={{ 
                    padding: "12px 14px", 
                    background: "rgba(6,182,212,0.06)", 
                    border: "1px solid rgba(6,182,212,0.15)", 
                    borderRadius: "14px", 
                    marginBottom: "16px", 
                    color: "#22d3ee", 
                    fontSize: "11px", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "10px",
                    fontWeight: 500,
                    lineHeight: "1.4"
                  }}>
                    <MapPin size={14} style={{ flexShrink: 0, color: "#22d3ee" }} />
                    <div style={{ textAlign: "left" }}>
                      Scan location detected: <strong style={{ color: "#fff" }}>{detectedLoc.city ? `${detectedLoc.city}${detectedLoc.country ? `, ${detectedLoc.country}` : ''}` : detectedLoc.country || 'Unknown Location'}</strong> using <strong style={{ color: "#fff" }}>{detectedLoc.device || 'Device'}</strong>.
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div style={{ padding: "12px 14px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", marginBottom: "16px", color: "#fca5a5", fontSize: "12.5px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: "#f87171" }}>
                      <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>
                    </svg>
                    {errorMsg}
                  </div>
                )}

                {landingPage.leadFormEnabled ? (
                  <form 
                    method="POST"
                    action={`/api/landing-pages/${landingPage.id}/lead`}
                    onSubmit={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSubmit(onSubmit, onInvalid)(e);
                    }}
                    style={{ display: "flex", flexDirection: "column", gap: "12px" }}
                  >
                    <div>
                      <input type="text" {...register("name")} autoComplete="name" placeholder="Full Name *" className="form-input" />
                      {errors.name && <p style={{ color: "#f87171", fontSize: "11px", marginTop: "5px" }}>{errors.name.message}</p>}
                    </div>
                    <div>
                      <input type="tel" {...register("phone")} autoComplete="tel" placeholder="Phone Number *" className="form-input" />
                      {errors.phone && <p style={{ color: "#f87171", fontSize: "11px", marginTop: "5px" }}>{errors.phone.message}</p>}
                    </div>
                    <div>
                      <input type="email" {...register("email")} autoComplete="email" placeholder="Email (Optional)" className="form-input" />
                      {errors.email && <p style={{ color: "#f87171", fontSize: "11px", marginTop: "5px" }}>{errors.email.message}</p>}
                    </div>
                    <div>
                      <input type="text" {...register("city")} placeholder="City (Optional)" className="form-input" />
                      {errors.city && <p style={{ color: "#f87171", fontSize: "11px", marginTop: "5px" }}>{errors.city.message}</p>}
                    </div>

                    {/* Consent */}
                    <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", paddingTop: "4px" }}>
                      <input type="checkbox" id="consentCheck" {...register("consentCheck")} style={{ width: "18px", height: "18px", marginTop: "1px", flexShrink: 0, accentColor: "#06b6d4", cursor: "pointer" }} />
                      <span style={{ color: "#4a6580", fontSize: "12px", lineHeight: 1.5 }}>
                        {isLeadOnly 
                          ? "I agree to submit my details and receive promotional updates." 
                          : "I agree to join the rewards program and receive promotional codes."}
                      </span>
                    </label>
                    {errors.consentCheck && <p style={{ color: "#f87171", fontSize: "11px" }}>{errors.consentCheck.message}</p>}

                    <LoadingButton type="submit" loading={isLoading} variant="primary" className="w-full !py-4 !rounded-2xl text-base" style={{ marginTop: "8px" }}>
                      {(!landingPage.campaign.coupons || landingPage.campaign.coupons.length === 0) ? (
                        <Sparkles size={17} />
                      ) : (
                        <Gift size={17} />
                      )}
                      {(!landingPage.campaign.coupons || landingPage.campaign.coupons.length === 0) 
                        ? "Register for Future Offers" 
                        : "Get My Reward Code"}
                    </LoadingButton>
                  </form>
                ) : (
                  <div style={{ textAlign: "center", padding: "24px 0", color: "#4a6580", fontSize: "13px" }}>
                    This campaign is view-only. No registration required.
                  </div>
                )}
              </>
            ) : (
              /* Success State */
              <div style={{ textAlign: "center" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                  <CheckCircle size={30} color="#34d399" />
                </div>
                <h3 style={{ color: "#fff", fontSize: "18px", fontWeight: 900, letterSpacing: "-0.02em", marginBottom: "6px" }}>You're in!</h3>
                <p style={{ color: "#4a6580", fontSize: "12px", lineHeight: 1.6, marginBottom: "24px" }}>
                  {isLeadOnly 
                    ? "Your details are registered. Thank you for scanning!" 
                    : "Your details are registered. Here is your exclusive reward:"}
                </p>

                {isRedeemedState ? (
                  <div style={{ padding: "24px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "20px", color: "#94a3b8", fontSize: "13px", lineHeight: 1.6, textAlign: "center" }}>
                    <div style={{ color: "#ef4444", fontWeight: 800, fontSize: "15px", marginBottom: "8px" }}>
                      Offer Already Claimed
                    </div>
                    You have already claimed this particular offer. Thank you for scanning!
                  </div>
                ) : couponCode ? (
                  <div style={{ position: "relative", border: "2px dashed rgba(6,182,212,0.2)", borderRadius: "20px", padding: "24px", background: "rgba(6,182,212,0.03)", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    {/* Punch holes */}
                    <div style={{ position: "absolute", left: "-10px", top: "50%", transform: "translateY(-50%)", width: "20px", height: "20px", borderRadius: "50%", background: "#020509" }} />
                    <div style={{ position: "absolute", right: "-10px", top: "50%", transform: "translateY(-50%)", width: "20px", height: "20px", borderRadius: "50%", background: "#020509" }} />

                    {couponDiscount && (
                      <div style={{ marginBottom: "16px" }}>
                        <span className="shimmer-text" style={{ fontSize: "13px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {couponDiscount} DISCOUNT UNLOCKED
                        </span>
                      </div>
                    )}

                    {/* QR Code Graphic for business scanner */}
                    <div style={{ background: "#ffffff", padding: "10px", borderRadius: "16px", marginBottom: "16px", display: "inline-block", boxShadow: "0 8px 32px rgba(6,182,212,0.15)" }}>
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(couponCode)}`} 
                        alt="Coupon Redemption QR Code"
                        style={{ width: "120px", height: "120px", display: "block" }}
                      />
                    </div>

                    <div style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "16px 20px", marginBottom: "16px", fontFamily: "monospace", fontSize: "26px", fontWeight: 900, color: "#fff", letterSpacing: "0.1em" }}>
                      {couponCode}
                    </div>

                    <button onClick={handleCopy} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "12px", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)", color: "#22d3ee", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
                      <Copy size={13} />
                      {isCopied ? "Copied!" : "Copy Code"}
                    </button>

                    <p style={{ color: "#4a6580", fontSize: "10px", marginTop: "16px", lineHeight: "1.4" }}>
                      Show this screen or the code at the counter to redeem your discount. The coupon has been sent to your WhatsApp and Email!
                    </p>
                  </div>
                ) : (
                  <div style={{ padding: "24px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "20px", color: "#94a3b8", fontSize: "13px", lineHeight: 1.6, textAlign: "center" }}>
                    <div style={{ color: "#10b981", fontWeight: 800, fontSize: "15px", marginBottom: "8px" }}>
                      Registration Successful!
                    </div>
                    {isLeadOnly 
                      ? "Thank you for scanning! Your registration is complete and your details have been captured successfully. We will contact you soon!"
                      : "Thank you for scanning! Your registration is complete and your details have been captured successfully. We will notify you via Email or WhatsApp as soon as future offers or updates are available!"}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Video Section */}
          {landingPage.videoUrl && (
            <div className="fade-up fade-up-delay-3 glass-card" style={{ borderRadius: "20px", padding: "16px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <Play size={14} color="#22d3ee" />
                <span style={{ color: "#e2eaf4", fontSize: "12px", fontWeight: 700 }}>Watch Campaign Story</span>
              </div>
              <div style={{ position: "relative", aspectRatio: "16/9", background: "#000", borderRadius: "14px", overflow: "hidden" }}>
                <iframe
                  src={landingPage.videoUrl}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Campaign Video"
                />
              </div>
            </div>
          )}

          {/* CTAs */}
          {hasCtas && (
            <div className="fade-up fade-up-delay-4" style={{ marginBottom: "20px" }}>
              <p style={{ color: "#2e4a62", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center", marginBottom: "12px" }}>
                Connect with us
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                {landingPage.whatsappButton && landingPage.whatsappNumber && (
                  <a
                    href={`https://wa.me/${landingPage.whatsappNumber.replace(/[^0-9]/g, "")}?text=Hi, I've scanned your bottle QR!`}
                    target="_blank" rel="noopener noreferrer"
                    className="cta-btn"
                    style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", color: "#4ade80" }}
                  >
                    <MessageCircle size={16} />
                    <span>WhatsApp</span>
                  </a>
                )}
                {landingPage.callButton && landingPage.callNumber && (
                  <a href={`tel:${landingPage.callNumber}`} className="cta-btn"
                    style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", color: "#60a5fa" }}>
                    <Phone size={16} />
                    <span>Call Us</span>
                  </a>
                )}
                {landingPage.websiteButton && landingPage.websiteUrl && (
                  <a href={landingPage.websiteUrl} target="_blank" rel="noopener noreferrer" className="cta-btn"
                    style={{ background: "rgba(109,40,217,0.08)", border: "1px solid rgba(109,40,217,0.2)", color: "#c084fc" }}>
                    <Globe size={16} />
                    <span>Website</span>
                  </a>
                )}
                {landingPage.googleMapsUrl && (
                  <a href={landingPage.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="cta-btn"
                    style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)", color: "#fbbf24" }}>
                    <MapPin size={16} />
                    <span>Location</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Terms & Privacy */}
          {(landingPage.termsText || landingPage.privacyText) && (
            <div style={{ textAlign: "center", paddingBottom: "8px" }}>
              <button
                onClick={() => setShowTerms(!showTerms)}
                style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "#2e4a62", fontSize: "11px", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
              >
                <Shield size={11} />
                Terms & Privacy Policy
                <ChevronDown size={11} style={{ transform: showTerms ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
              </button>
              {showTerms && (
                <div className="glass-card" style={{ marginTop: "12px", borderRadius: "16px", padding: "16px", textAlign: "left" }}>
                  {landingPage.termsText && (
                    <div style={{ marginBottom: landingPage.privacyText ? "12px" : 0 }}>
                      <h4 style={{ color: "#8ba3bc", fontSize: "11px", fontWeight: 700, marginBottom: "6px", display: "flex", alignItems: "center", gap: "5px" }}>
                        <Shield size={11} color="#22d3ee" /> Campaign Terms
                      </h4>
                      <p style={{ color: "#4a6580", fontSize: "11px", lineHeight: 1.6 }}>{landingPage.termsText}</p>
                    </div>
                  )}
                  {landingPage.privacyText && (
                    <div>
                      <h4 style={{ color: "#8ba3bc", fontSize: "11px", fontWeight: 700, marginBottom: "6px", display: "flex", alignItems: "center", gap: "5px" }}>
                        <Shield size={11} color="#2563eb" /> Privacy Policy
                      </h4>
                      <p style={{ color: "#4a6580", fontSize: "11px", lineHeight: 1.6 }}>{landingPage.privacyText}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Custom Toastify Toast Notification ── */}
      {toast && (
        <div className="toast-container">
          <div className={`toast-item toast-item-${toast.type}`}>
            {toast.type === "success" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* ── Custom SweetAlert Modal Notification ── */}
      {sweetAlert && (
        <div className="swal-overlay">
          <div className="swal-modal">
            <div className={`swal-icon swal-icon-${sweetAlert.type}`}>
              {sweetAlert.type === "success" ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>
                </svg>
              )}
            </div>
            <h3 className="swal-title">{sweetAlert.title}</h3>
            <p className="swal-text">{sweetAlert.text}</p>
            <button className="swal-btn" onClick={() => setSweetAlert(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}
    </>
  );
}
