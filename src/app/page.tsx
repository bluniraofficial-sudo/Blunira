import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { ThemeToggle } from "@/components/theme-toggle";
import { BackgroundMesh } from "@/components/background-mesh";
import { FloatingCard } from "@/components/floating-card";
import { Hero3DModel } from "@/components/hero-3d-model";
import {
  ArrowRight,
  QrCode,
  BarChart3,
  Sparkles,
  ShieldCheck,
  Zap,
  Smartphone,
  Gift,
  CheckCircle,
  TrendingUp,
  Globe,
  Users,
  Layers,
  ChevronRight,
  Star,
  Play,
  UserCheck,
  ArrowUpRight,
  Activity,
} from "lucide-react";

export const metadata: Metadata = {
  metadataBase: new URL("https://blunira.com"),
  title: "Blunira — Smart QR Hydration Marketing Platform",
  description:
    "Blunira transforms water bottle packaging into powerful marketing channels. Generate tamper-proof QR codes, capture validated leads, and track real-time analytics. Trusted by hydration brands globally.",
  keywords: [
    "QR code marketing",
    "water bottle QR",
    "hydration marketing",
    "lead capture",
    "QR campaign analytics",
    "sequential QR codes",
    "bottle label marketing",
    "Blunira",
  ],
  authors: [{ name: "Blunira" }],
  openGraph: {
    title: "Blunira — Smart QR Hydration Marketing Platform",
    description:
      "Turn physical water bottles into direct marketing channels. Track QR scans, capture leads, deliver rewards in real-time.",
    url: "https://blunira.com",
    siteName: "Blunira",
    type: "website",
    images: [
      {
        url: "/hero-bottle.png",
        width: 1200,
        height: 630,
        alt: "Blunira QR Hydration Marketing Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blunira — Smart QR Hydration Marketing",
    description:
      "Transform water bottle packaging into powerful marketing channels with Blunira's QR analytics platform.",
    images: ["/hero-bottle.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: { canonical: "https://blunira.com" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://blunira.com/#org",
      name: "Blunira",
      url: "https://blunira.com",
      logo: { "@type": "ImageObject", url: "https://blunira.com/favicon.png" },
      description:
        "Blunira is a smart QR hydration marketing platform that turns water bottle packaging into direct marketing channels.",
      sameAs: ["https://blunira.com/about"],
    },
    {
      "@type": "WebSite",
      "@id": "https://blunira.com/#website",
      url: "https://blunira.com",
      name: "Blunira",
      publisher: { "@id": "https://blunira.com/#org" },
    },
    {
      "@type": "SoftwareApplication",
      name: "Blunira Platform",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description:
        "QR code marketing platform for water bottle brands. Features sequential QR generation, lead capture, geo-analytics, and coupon management.",
    },
  ],
};

const FEATURES = [
  {
    icon: QrCode,
    color: "cyan",
    title: "Sequential QR Batches",
    desc: "Generate tamper-proof sequential codes (QR000000001+) at scale. Export print-ready files directly to commercial label printers.",
  },
  {
    icon: BarChart3,
    color: "indigo",
    title: "Geo-Data & Analytics",
    desc: "Track IP addresses, exact cities, device types and browsers in real-time. Build granular scanner profiles automatically.",
  },
  {
    icon: Smartphone,
    color: "teal",
    title: "Dynamic Landing Pages",
    desc: "Build custom lead-capture screens with brand colors, countdown timers, validated forms, and instant reward tokens.",
  },
  {
    icon: ShieldCheck,
    color: "emerald",
    title: "Multi-Tenant Isolation",
    desc: "Enterprise-grade tenant scoping keeps advertiser campaigns completely separated with role-based access controls.",
  },
  {
    icon: Zap,
    color: "amber",
    title: "CRM & WhatsApp Integration",
    desc: "Connect campaigns to automated email sequences and direct WhatsApp chat triggers for follow-up conversion.",
  },
  {
    icon: Gift,
    color: "rose",
    title: "Instant Coupon Allocation",
    desc: "Upload coupon codes, set redemption caps, and auto-deactivate expired promotions. Zero manual management.",
  },
];

const STEPS = [
  {
    num: "01",
    icon: Layers,
    title: "Generate Code Batches",
    tag: "Super Admin Panel",
    desc: "Create advertiser tenants and batch-generate thousands of sequential secure QR endpoints. Export for commercial label printing.",
  },
  {
    num: "02",
    icon: QrCode,
    title: "Consumer Bottle Scan",
    tag: "< 400ms Edge API",
    desc: "Consumer scans the bottle QR. Our API logs geo, device, browser and scan status in under 400ms before redirecting.",
  },
  {
    num: "03",
    icon: Users,
    title: "Lead Registration",
    tag: "Mobile Claim Page",
    desc: "Consumer lands on a branded campaign page. They submit details to claim a reward, creating a validated lead record.",
  },
  {
    num: "04",
    icon: BarChart3,
    title: "Analytics Conversion",
    tag: "Advertiser Dashboard",
    desc: "Track redemptions, lead velocity, repeat scans, and geo-locations on interactive charts. Export CSV for retargeting.",
  },
];

const STATS = [
  { value: "10M+", label: "QR Scans Tracked" },
  { value: "94.8%", label: "Lead Validation Rate" },
  { value: "< 400ms", label: "Redirect Speed" },
  { value: "500+", label: "Active Campaigns" },
];

const TESTIMONIALS = [
  {
    quote: "Blunira turned our bottle labels into a lead generation machine. We captured 3,200 validated leads in the first month alone.",
    name: "Sarah M.",
    role: "CMO, Aqua Flow Beverages",
    rating: 5,
  },
  {
    quote: "The geo-analytics feature is incredible. We can see exactly which cities are engaging with our campaigns and optimize our distribution accordingly.",
    name: "James K.",
    role: "Marketing Director, Summit Springs",
    rating: 5,
  },
  {
    quote: "Setup was incredibly fast. Within 24 hours we had QR codes printed, campaigns live, and leads flowing into our CRM automatically.",
    name: "Priya R.",
    role: "Head of Growth, Nordic Drift",
    rating: 5,
  },
  {
    quote: "We launched a regional campaign and gathered verified numbers easily. Seamless API and clean interface.",
    name: "Thomas W.",
    role: "Brand Director, Glacier Vibe",
    rating: 5,
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  cyan:    { bg: "bg-cyan-500/10",    text: "text-cyan-500",    border: "border-cyan-500/20" },
  indigo:  { bg: "bg-indigo-500/10",  text: "text-indigo-500",  border: "border-indigo-500/20" },
  teal:    { bg: "bg-teal-500/10",    text: "text-teal-500",    border: "border-teal-500/20" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" },
  amber:   { bg: "bg-amber-500/10",   text: "text-amber-500",   border: "border-amber-500/20" },
  rose:    { bg: "bg-rose-500/10",    text: "text-rose-500",    border: "border-rose-500/20" },
};

export default function Home() {
  return (
    <>
      <Script
        id="jsonld-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] relative overflow-x-hidden font-sans transition-colors duration-300">
        
        {/* ── World-Class Animated Mesh Background ── */}
        <BackgroundMesh />

        {/* ══════════════════════════════════════
            HEADER
        ══════════════════════════════════════ */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--bg-base)]/80 border-b border-[var(--card-border)] transition-all duration-300">
          <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between gap-6" style={{ height: "72px" }}>
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-85 transition-all flex-shrink-0" aria-label="Blunira Home">
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-[var(--card-border)] flex-shrink-0 bg-[var(--card-bg)] shadow-md">
                <Image src="/favicon.png" alt="Blunira" width={36} height={36} className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="block font-display font-black text-lg tracking-tight leading-none text-[var(--text-primary)]">Blunira</span>
                <span className="block text-[9px] font-bold text-cyan-500 uppercase tracking-widest mt-0.5">Hydration Marketing</span>
              </div>
            </Link>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-1.5" aria-label="Main navigation">
              {[
                { href: "/about", label: "About Us" },
                { href: "#features", label: "Features", anchor: true },
                { href: "#how-it-works", label: "How It Works", anchor: true },
                { href: "/contact", label: "Contact Us" },
              ].map((item) =>
                item.anchor ? (
                  <a key={item.label} href={item.href}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg)] transition-all">
                    {item.label}
                  </a>
                ) : (
                  <Link key={item.label} href={item.href}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg)] transition-all">
                    {item.label}
                  </Link>
                )
              )}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/auth/login"
                className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 hover:scale-[1.02] flex-shrink-0">
                Portal
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </header>

        <main>
          {/* ══════════════════════════════════════
              HERO SECTION (Apple/Vercel Aesthetic)
          ══════════════════════════════════════ */}
          <section className="relative pt-10 pb-20 md:pt-20 md:pb-28 min-h-[110vh] flex items-center" aria-labelledby="hero-heading">
            <div className="max-w-7xl mx-auto px-6 w-full relative">
              
              {/* Glowing connecting bezier curves (Desktop only) */}
              <div className="absolute inset-0 z-0 pointer-events-none hidden lg:block" aria-hidden="true">
                <svg className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="curve-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
                      <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="curve-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Curve 1: Left cards to Bottle */}
                  <path d="M 100 200 Q 300 150, 700 300" stroke="url(#curve-grad-1)" strokeWidth="1.5" strokeDasharray="6,6" />
                  {/* Curve 2: Right cards to Bottle */}
                  <path d="M 1200 150 Q 950 350, 750 350" stroke="url(#curve-grad-2)" strokeWidth="1.5" />
                  {/* Curve 3: Bottle to Bottom cards */}
                  <path d="M 720 400 C 650 500, 400 550, 250 500" stroke="url(#curve-grad-1)" strokeWidth="2" strokeDasharray="8,4" />
                </svg>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">

                {/* Left Side (Headline & Details) - 5 Columns */}
                <div className="lg:col-span-5 space-y-8 text-left">
                  
                  {/* Pill badge */}
                  <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-500 text-xs font-black uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    Smart QR Hydration Platform
                  </div>

                  {/* Huge Headline */}
                  <h1 id="hero-heading" className="text-5xl sm:text-6xl md:text-7xl font-display font-black tracking-tight leading-[1.02] text-[var(--text-primary)]">
                    Water Bottles.{" "}
                    <span className="block bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">
                      Infinite Reach.
                    </span>
                  </h1>

                  {/* Description */}
                  <p className="text-[var(--text-secondary)] text-lg leading-relaxed max-w-lg">
                    Blunira transforms physical water bottle packaging into live marketing channels.
                    Print sequential QR codes, capture validated leads, and track scanner velocity in real-time.
                  </p>

                  {/* 3 CTA Buttons */}
                  <div className="flex flex-wrap gap-4 pt-2">
                    <Link href="/auth/login"
                      className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base transition-all hover:scale-[1.03] active:scale-100 shadow-xl shadow-cyan-500/25">
                      Launch Campaign
                      <Zap className="w-4 h-4 fill-current" />
                    </Link>
                    <a href="#how-it-works"
                      className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-[var(--card-border)] hover:border-cyan-500/40 bg-[var(--card-bg)] hover:bg-cyan-500/5 text-[var(--text-primary)] font-bold text-base transition-all group">
                      <Play className="w-4 h-4 text-cyan-500 group-hover:scale-110 transition-transform" />
                      See How It Works
                    </a>
                    <Link href="/contact"
                      className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-sm hover:underline transition-all">
                      Talk to Sales
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* Trust Indicators */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6 pt-4 border-t border-[var(--card-border)]">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {["A", "K", "R", "S"].map((char, idx) => (
                          <div key={idx} className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 border-2 border-[var(--bg-base)] flex items-center justify-center text-white text-xs font-black shadow-md">
                            {char}
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className="block text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider mt-0.5">500+ Active Brands</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[var(--card-border)]">
                    {STATS.map((s) => (
                      <div key={s.label} className="bg-[var(--card-bg)]/40 border border-[var(--card-border)] p-3 rounded-2xl backdrop-blur-md">
                        <span className="block text-xl font-black font-display text-[var(--text-primary)]">{s.value}</span>
                        <span className="block text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider mt-0.5 leading-tight">{s.label}</span>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Right Side (3D Model and Floating Cards) - 7 Columns */}
                <div className="lg:col-span-7 relative flex flex-col lg:flex-row items-center justify-center min-h-0 lg:min-h-[600px] w-full">
                  
                  {/* Dynamic 3D Bottle Canvas */}
                  <div className="w-full relative z-10 flex items-center justify-center">
                    <Hero3DModel />
                  </div>

                  {/* Mobile / Tablet Responsive Metrics Grid (< lg screens) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mt-8 w-full lg:hidden z-20">
                    <FloatingCard
                      title="QR Analytics"
                      value="12,482"
                      desc="Scanner velocity active"
                      icon="activity"
                      iconColor="text-cyan-500"
                      className="relative w-full"
                      delay={0.1}
                    />
                    <FloatingCard
                      title="Lead Validation"
                      value="+142%"
                      desc="Validated phone match"
                      icon="user-check"
                      iconColor="text-emerald-500"
                      className="relative w-full"
                      delay={0.3}
                      badge="Verified"
                    />
                    <FloatingCard
                      title="QR Scanner Active"
                      value="5.8M+"
                      desc="Global server redirect"
                      icon="qr-code"
                      iconColor="text-indigo-400"
                      className="relative w-full"
                      delay={0.5}
                    />
                    <FloatingCard
                      title="Rewards Distributed"
                      value="94.8%"
                      desc="Auto-allocated coupons"
                      icon="gift"
                      iconColor="text-rose-400"
                      className="relative w-full"
                      delay={0.7}
                    />
                    <FloatingCard
                      title="Customer Connected"
                      value="100%"
                      desc="Active WhatsApp leads"
                      icon="users"
                      iconColor="text-cyan-400"
                      className="relative w-full"
                      delay={0.9}
                    />
                    <FloatingCard
                      title="Live Campaigns"
                      value="500+"
                      desc="Auto redirection on"
                      icon="globe"
                      iconColor="text-teal-400"
                      className="relative w-full"
                      delay={1.1}
                      badge="Live"
                    />
                  </div>

                  {/* Desktop 3D Floating Cards (>= lg screens) */}
                  <div className="hidden lg:block">
                    <FloatingCard
                      title="QR Analytics"
                      value="12,482"
                      desc="Scanner velocity active"
                      icon="activity"
                      iconColor="text-cyan-500"
                      className="absolute top-[22%] -left-12"
                      delay={0.1}
                    />
                    <FloatingCard
                      title="Lead Validation"
                      value="+142%"
                      desc="Validated phone match"
                      icon="user-check"
                      iconColor="text-emerald-500"
                      className="absolute bottom-8 -left-12"
                      delay={0.5}
                      badge="Verified"
                    />
                    <FloatingCard
                      title="QR Scanner Active"
                      value="5.8M+"
                      desc="Global server redirect"
                      icon="qr-code"
                      iconColor="text-indigo-400"
                      className="absolute top-4 right-8"
                      delay={0.3}
                    />
                    <FloatingCard
                      title="Rewards Distributed"
                      value="94.8%"
                      desc="Auto-allocated coupons"
                      icon="gift"
                      iconColor="text-rose-400"
                      className="absolute bottom-12 -right-8"
                      delay={0.7}
                    />
                    <FloatingCard
                      title="Customer Connected"
                      value="100%"
                      desc="Active WhatsApp leads"
                      icon="users"
                      iconColor="text-cyan-400"
                      className="absolute top-[-45px] left-[10%]"
                      delay={0.9}
                    />
                    <FloatingCard
                      title="Live Campaigns"
                      value="500+"
                      desc="Auto redirection on"
                      icon="globe"
                      iconColor="text-teal-400"
                      className="absolute top-[38%] -right-12"
                      delay={1.1}
                      badge="Live"
                    />
                  </div>

                </div>

              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════
              TRUSTED BY BANNER (Infinite horizontal marquee)
          ══════════════════════════════════════ */}
          <section className="py-12 border-y border-[var(--card-border)] bg-[var(--card-bg)]/80 overflow-hidden backdrop-blur-xl" aria-label="Trusted brands">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <span className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-[0.25em] whitespace-nowrap flex-shrink-0 z-20">
                Trusted by Hydration Brands
              </span>
              
              <div className="flex-1 overflow-hidden relative w-full">
                {/* Fade edges */}
                <div className="absolute inset-y-0 left-0 w-12 md:w-24 bg-gradient-to-r from-[var(--bg-base)] to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-12 md:w-24 bg-gradient-to-l from-[var(--bg-base)] to-transparent z-10 pointer-events-none" />
                
                <div className="flex items-center gap-10 md:gap-18 w-max animate-marquee">
                  {[
                    "AQUA FLOW", "SUMMIT SPRINGS", "GLACIER VIBE", "NORDIC DRIFT", "PURE PEAK", "CRYSTAL GLEN",
                    "AQUA FLOW", "SUMMIT SPRINGS", "GLACIER VIBE", "NORDIC DRIFT", "PURE PEAK", "CRYSTAL GLEN"
                  ].map((brand, i) => (
                    <span key={i} className="font-display font-extrabold tracking-tight text-sm md:text-base text-[var(--text-primary)] opacity-40 hover:opacity-75 hover:scale-105 transition-all whitespace-nowrap cursor-default">
                      {brand}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════
              FEATURES SECTION (Redesigned Glassmorphic Cards)
          ══════════════════════════════════════ */}
          <section id="features" className="py-28 max-w-7xl mx-auto px-6" aria-labelledby="features-heading">
            <div className="text-center space-y-4 max-w-2xl mx-auto mb-20">
              <span className="text-cyan-500 text-xs font-extrabold uppercase tracking-widest">Engineered Capabilities</span>
              <h2 id="features-heading" className="text-4xl sm:text-5xl font-display font-black text-[var(--text-primary)] tracking-tight">
                Everything You Need to{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Market at Scale
                </span>
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                From batch generating sequential codes to displaying granular geographic conversions — Blunira covers the complete campaign lifecycle.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f, index) => {
                const c = colorMap[f.color];
                const Icon = f.icon;
                return (
                  <article
                    key={f.title}
                    className="relative bg-[var(--card-bg)] border border-[var(--card-border)] p-8 rounded-3xl space-y-5 hover:border-cyan-500/30 hover:-translate-y-2 transition-all duration-300 group overflow-hidden shadow-lg"
                  >
                    {/* Top gradient highlight strip */}
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Background glow node */}
                    <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-cyan-500/5 blur-2xl group-hover:bg-cyan-500/10 transition-colors pointer-events-none" />

                    <div className={`w-11 h-11 rounded-2xl ${c.bg} border ${c.border} flex items-center justify-center ${c.text} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-cyan-500 transition-colors">{f.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
                  </article>
                );
              })}
            </div>
          </section>

          {/* ══════════════════════════════════════
              HOW IT WORKS (Redesigned into Interactive Timeline)
          ══════════════════════════════════════ */}
          <section id="how-it-works" className="py-28 bg-[var(--bg-elevated)]/30 border-y border-[var(--card-border)] relative overflow-hidden" aria-labelledby="steps-heading">
            
            {/* Glow effects */}
            <div className="absolute top-[20%] left-[-10%] w-[350px] h-[350px] rounded-full bg-indigo-500/5 blur-[90px]" />
            <div className="absolute bottom-[20%] right-[-10%] w-[350px] h-[350px] rounded-full bg-cyan-500/5 blur-[90px]" />

            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center space-y-4 max-w-2xl mx-auto mb-24">
                <span className="text-cyan-500 text-xs font-extrabold uppercase tracking-widest font-mono">Operations Pipeline</span>
                <h2 id="steps-heading" className="text-4xl sm:text-5xl font-display font-black text-[var(--text-primary)] tracking-tight">
                  Seamless Integration{" "}
                  <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                    in 4 Simple Steps
                  </span>
                </h2>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  How our system bridges physical water bottle consumption with secure cloud redirect rules.
                </p>
              </div>

              {/* Responsive Vertical/Horizontal Timeline */}
              <div className="relative grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* Horizontal connection line for desktop */}
                <div className="absolute top-[35px] left-8 right-8 h-[2px] bg-gradient-to-r from-cyan-500/5 via-cyan-500/30 to-indigo-500/5 hidden lg:block z-0" aria-hidden="true" />

                {STEPS.map((s, idx) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.num} className="relative z-10 space-y-6 group">
                      
                      {/* Timeline Node Icon */}
                      <div className="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-center text-cyan-500 shadow-xl group-hover:border-cyan-500/40 group-hover:scale-105 transition-all">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl font-display font-black text-cyan-500/20 group-hover:text-cyan-500 transition-colors">{s.num}</span>
                          <span className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)] bg-[var(--card-bg)] px-2.5 py-1 rounded-md border border-[var(--card-border)]">{s.tag}</span>
                        </div>
                      </div>

                      {/* Step Card details */}
                      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-2xl hover:border-cyan-500/20 hover:shadow-lg transition-all space-y-2">
                        <h3 className="text-base font-bold text-[var(--text-primary)]">{s.title}</h3>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{s.desc}</p>
                      </div>

                    </div>
                  );
                })}

              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════
              ANALYTICS / DASHBOARD PREVIEW
          ══════════════════════════════════════ */}
          <section id="analytics" className="py-28 max-w-7xl mx-auto px-6" aria-labelledby="analytics-heading">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

              {/* Left Column: Analytics Copy */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <span className="text-cyan-500 text-xs font-extrabold uppercase tracking-widest">Granular Business Intelligence</span>
                  <h2 id="analytics-heading" className="text-4xl sm:text-5xl font-display font-black text-[var(--text-primary)] tracking-tight leading-tight">
                    Track Every Scan.{" "}
                    <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                      In Real-Time.
                    </span>
                  </h2>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    Monitor scan events, lead conversions, repeat visitor patterns, and device breakdowns.
                    Export clean tables to refine your marketing funnels and maximize campaign ROI.
                  </p>
                </div>

                <ul className="space-y-4">
                  {[
                    { title: "IP Geolocation Analysis", desc: "Automatically map client locations to spot region-specific demand patterns." },
                    { title: "Active Coupon Auditing", desc: "View redemption caps, remaining codes, and full expiration calendars." },
                    { title: "Audit Log Scaffolding", desc: "Track all actions, logins, and settings updates to ensure workspace compliance." },
                  ].map((item) => (
                    <li key={item.title} className="flex items-start gap-4 p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-cyan-500/20 transition-all">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--text-primary)]">{item.title}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <Link href="/auth/login"
                  className="inline-flex items-center gap-2 text-sm font-bold text-cyan-500 hover:text-cyan-400 group transition-colors">
                  Access Dashboard Portals
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Right Column: Parallax Dashboard Frame */}
              <div className="relative group">
                <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-br from-cyan-500/15 to-indigo-500/15 blur-2xl group-hover:scale-105 transition-transform duration-700 pointer-events-none" />
                <div className="relative rounded-3xl overflow-hidden border border-[var(--card-border)] shadow-2xl group-hover:-translate-y-1 transition-transform duration-500">
                  
                  {/* Dynamic Dark Mode Dashboard */}
                  <Image
                    src="/dashboard-preview-dark.png"
                    alt="Blunira campaign analytics dashboard showing scan counts, lead conversions, and geo-location data"
                    width={720}
                    height={480}
                    className="w-full h-auto object-cover dark-image"
                  />
                  {/* Dynamic Light Mode Dashboard */}
                  <Image
                    src="/dashboard-preview-light.png"
                    alt="Blunira campaign analytics dashboard showing scan counts, lead conversions, and geo-location data"
                    width={720}
                    height={480}
                    className="w-full h-auto object-cover light-image"
                  />

                  {/* Overlay Glass Statistics Strip */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)]/80 to-transparent p-6">
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { v: "14,281", l: "Total Scans", c: "text-emerald-500" },
                        { v: "9,042", l: "Leads Captured", c: "text-cyan-500" },
                        { v: "67.7%", l: "Claim Rate", c: "text-indigo-400" },
                      ].map((s) => (
                        <div key={s.l} className="text-center bg-[var(--card-bg)] border border-[var(--card-border)] backdrop-blur-md rounded-xl p-3 shadow-md hover:scale-102 transition-transform">
                          <span className={`block text-lg font-black ${s.c}`}>{s.v}</span>
                          <span className="block text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wide mt-0.5">{s.l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* ══════════════════════════════════════
              TESTIMONIALS (Horizontal Scrolling Marquee)
          ══════════════════════════════════════ */}
          <section className="py-28 border-t border-[var(--card-border)] relative overflow-hidden" aria-label="Customer testimonials">
            <div className="text-center mb-16 space-y-3">
              <span className="text-cyan-500 text-xs font-extrabold uppercase tracking-widest font-mono">Customer Stories</span>
              <h2 className="text-4xl font-display font-black text-[var(--text-primary)]">Loved by Marketing Teams</h2>
              <p className="text-sm text-[var(--text-secondary)]">Hover over any card to pause the horizontal scrolling feed.</p>
            </div>

            <div className="relative w-full overflow-hidden py-4">
              
              {/* Fade Edges */}
              <div className="absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-[var(--bg-base)] to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-[var(--bg-base)] to-transparent z-10 pointer-events-none" />

              <div className="flex gap-6 w-max animate-marquee">
                {[...TESTIMONIALS, ...TESTIMONIALS].map((t, idx) => (
                  <article
                    key={idx}
                    className="w-[360px] bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-7 space-y-5 hover:border-cyan-500/20 hover:-translate-y-1 transition-all duration-300 shadow-md flex-shrink-0"
                  >
                    <div className="flex gap-0.5">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <blockquote>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                    </blockquote>
                    <footer className="flex items-center gap-3 pt-4 border-t border-[var(--card-border)]">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--text-primary)]">{t.name}</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-semibold">{t.role}</p>
                      </div>
                    </footer>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════
              CTA SECTION (Large Apple-style Cards)
          ══════════════════════════════════════ */}
          <section className="py-24" aria-label="Call to action">
            <div className="max-w-5xl mx-auto px-6">
              <div className="relative rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--card-bg)] shadow-2xl">
                
                {/* Background lighting */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/20 via-[var(--bg-elevated)] to-indigo-950/20 pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full bg-cyan-500/8 blur-[90px] pointer-events-none" />
                
                {/* Grid */}
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(6,182,212,1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

                <div className="relative z-10 text-center py-24 px-8 space-y-8">
                  <div className="space-y-4 max-w-2xl mx-auto">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 text-xs font-extrabold uppercase tracking-widest font-mono">
                      <Globe className="w-3.5 h-3.5" />
                      Start Today
                    </span>
                    <h2 className="text-4xl md:text-5xl font-display font-black text-[var(--text-primary)] tracking-tight leading-[1.1]">
                      Launch Your First QR Campaign
                      <span className="block bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                        in Under 30 Minutes
                      </span>
                    </h2>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      Connect physical packaging to live digital rewards, grow your subscriber list, and track direct metrics from day one.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                    <Link href="/auth/login"
                      className="inline-flex items-center gap-2.5 px-9 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base transition-all hover:scale-[1.03] shadow-2xl shadow-cyan-500/25">
                      Enter Brand Workspace
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link href="/contact"
                      className="inline-flex items-center gap-2 px-9 py-4 rounded-2xl border-2 border-[var(--card-border)] hover:border-cyan-500/40 bg-[var(--card-bg)] text-[var(--text-primary)] font-bold text-base transition-all hover:bg-cyan-500/5">
                      Talk to Sales
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* ══════════════════════════════════════
            FOOTER (Premium Glass Design)
        ══════════════════════════════════════ */}
        <footer className="border-t border-[var(--card-border)] bg-[var(--bg-surface)] pt-16 pb-8 backdrop-blur-md relative z-10" role="contentinfo">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[var(--card-border)]">
              
              {/* Brand and Details */}
              <div className="md:col-span-2 space-y-4">
                <Link href="/" className="inline-flex items-center gap-3 hover:opacity-85 transition-opacity">
                  <div className="w-9 h-9 rounded-xl overflow-hidden border border-[var(--card-border)]">
                    <Image src="/favicon.png" alt="Blunira" width={36} height={36} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="block font-display font-black text-base text-[var(--text-primary)] leading-none">Blunira</span>
                    <span className="block text-[9px] font-bold text-cyan-500 uppercase tracking-widest mt-0.5">Hydration Marketing</span>
                  </div>
                </Link>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-xs">
                  The smart QR marketing platform for hydration brands. Track scans, capture leads, and deliver rewards in real-time.
                </p>
              </div>

              {/* Product Links */}
              <div className="space-y-4">
                <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--text-muted)]">Product</p>
                <ul className="space-y-2.5">
                  {[
                    { href: "#features", label: "Features", anchor: true },
                    { href: "#how-it-works", label: "How It Works", anchor: true },
                    { href: "#analytics", label: "Analytics", anchor: true },
                    { href: "/auth/login", label: "Brand Portal" },
                  ].map((l) => (
                    <li key={l.label}>
                      {l.anchor ? (
                        <a href={l.href} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all hover:translate-x-0.5 inline-block">{l.label}</a>
                      ) : (
                        <Link href={l.href} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all hover:translate-x-0.5 inline-block">{l.label}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company Links */}
              <div className="space-y-4">
                <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--text-muted)]">Company</p>
                <ul className="space-y-2.5">
                  {[
                    { href: "/about", label: "About Us" },
                    { href: "/contact", label: "Contact" },
                    { href: "/privacy", label: "Privacy Policy" },
                    { href: "/terms", label: "Terms of Service" },
                  ].map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all hover:translate-x-0.5 inline-block">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
            
            <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-[var(--text-muted)]">© 2026 Blunira. All rights reserved.</p>
              <p className="text-xs text-[var(--text-muted)]">Enterprise QR Hydration Marketing Suite</p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
