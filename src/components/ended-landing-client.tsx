"use client";

import { useEffect, useState } from "react";
import { Gift, MapPin, Laptop, CheckCircle2 } from "lucide-react";
import { LoadingButton } from "@/components/ui/loading-button";

interface EndedLandingPageClientProps {
  campaignId: string;
  advertiserId: string;
  companyName: string;
}

export function EndedLandingPageClient({ campaignId, advertiserId, companyName }: EndedLandingPageClientProps) {
  const [locData, setLocData] = useState<{ ip: string; city: string; country: string; device: string } | null>(null);
  
  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const getDeviceType = () => {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes("tablet") || ua.includes("ipad")) return "Tablet";
      if (ua.includes("mobile") || ua.includes("iphone") || ua.includes("android")) return "Mobile";
      return "Desktop";
    };

    const getBrowserAndOS = () => {
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

    const fetchActualData = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) throw new Error("ipapi failed");
        const geo = await res.json();
        
        if (geo && !geo.error) {
          const city = geo.city || "";
          const country = geo.country_name || "";
          const ip = geo.ip || "";
          const device = getDeviceType();
          const { browser, os } = getBrowserAndOS();

          const formattedDevice = `${device} - ${browser} on ${os}`;
          const finalLocation = city && country ? `${city}, ${country}` : city || country || "Unknown Location";

          setLocData({ ip, city, country, device: formattedDevice });

          // Silent initial background capture
          await fetch(`/api/landing-pages/${campaignId}/ended-lead`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Bypass-Tunnel-Reminder": "true"
            },
            body: JSON.stringify({
              ipAddress: ip,
              city: finalLocation,
              name: `Device Scan Lead (${formattedDevice})`,
              userAgent: navigator.userAgent,
              advertiserId,
            }),
          });
        }
      } catch (err) {
        console.error("Error capturing client location on ended campaign:", err);
      }
    };

    fetchActualData();
  }, [campaignId, advertiserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Please enter your name");
      return;
    }
    if (phone.trim().length < 8) {
      setErrorMsg("Please enter a valid phone number");
      return;
    }
    if (!consent) {
      setErrorMsg("Please accept the promotional rewards agreement");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const clientIp = locData?.ip || "127.0.0.1";
    const clientLocation = locData ? `${locData.city}, ${locData.country}` : "Unknown Location";
    const clientDevice = locData?.device || "Desktop";

    try {
      const response = await fetch(`/api/landing-pages/${campaignId}/ended-lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Bypass-Tunnel-Reminder": "true"
        },
        body: JSON.stringify({
          ipAddress: clientIp,
          city: clientLocation,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          userAgent: navigator.userAgent,
          advertiserId,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Submission failed");

      setIsSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020509] px-4 py-12">
      <style>{`
        body { background: #020509; font-family: 'Inter', system-ui, sans-serif; }
        .glass-card {
          background: rgba(9,18,32,0.85);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }
        .form-input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(0,0,0,0.35);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          color: #e2eaf4;
          font-size: 14px;
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
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 8px 32px rgba(6,182,212,0.3);
          transition: all 0.25s ease;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(6,182,212,0.45);
          filter: brightness(1.08);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div className="glass-card p-8 rounded-3xl max-w-md shadow-2xl w-full">
        {!isSubmitted ? (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mx-auto mb-4">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            
            <h1 className="text-xl font-black text-white text-center mb-1">
              {companyName}
            </h1>
            
            <div className="text-amber-400 font-extrabold uppercase text-[10px] tracking-wider text-center mb-3">
              Offer Has Concluded
            </div>
            
            <p className="text-gray-400 text-xs leading-relaxed text-center mb-6">
              We're sorry, but the campaign offer for this business has expired or ended. Fill out the form below to join our rewards list and receive notifications about future promotions!
            </p>

            {errorMsg && (
              <div className="p-3 bg-red-950/30 border border-red-900/40 text-red-300 text-xs rounded-xl mb-4 text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Email (Optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Consent checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  style={{
                    width: "18px",
                    height: "18px",
                    marginTop: "1px",
                    flexShrink: 0,
                    accentColor: "#06b6d4",
                    cursor: "pointer",
                  }}
                />
                <span className="text-gray-500 text-xs leading-normal">
                  I agree to join the rewards list and receive notification about future promotional offers.
                </span>
              </label>

              <LoadingButton type="submit" loading={isLoading} variant="primary" className="w-full !py-4 !rounded-2xl text-base">
                <Gift size={16} />
                <span>Notify Me of Future Offers</span>
              </LoadingButton>
            </form>
          </>
        ) : (
          <div className="text-center py-6 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Thank you!</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Your registration is complete. We have successfully saved your details and will notify you via Email or WhatsApp as soon as future offers are launched!
            </p>
            <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
              {companyName}
            </div>
          </div>
        )}

        {/* Footer Scan Info */}
        <div className="border-t border-white/5 pt-4 mt-6 flex flex-col gap-1.5 text-[9px] text-gray-600 font-mono text-center">
          <div className="flex items-center justify-center gap-1">
            <MapPin size={10} />
            <span>Location: {locData ? `${locData.city}, ${locData.country}` : "resolving..."}</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <Laptop size={10} />
            <span>Device: {locData?.device || "loading..."}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
