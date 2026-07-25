import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowRight,
  Droplet,
  Users,
  QrCode,
  ShieldCheck,
  Target,
  Sparkles,
  TrendingUp,
  Globe,
  CheckCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Blunira — Smart QR Hydration Marketing Platform",
  description:
    "Learn how Blunira transforms water bottle packaging into powerful direct marketing channels. Our mission, values, and the technology behind smart hydration engagement.",
  openGraph: {
    title: "About Blunira — Smart QR Hydration Marketing",
    description:
      "Blunira bridges physical hydration products with digital engagement. Discover our story, mission and the tech behind QR hydration marketing.",
    url: "https://blunira.com/about",
    siteName: "Blunira",
    type: "website",
  },
  alternates: { canonical: "https://blunira.com/about" },
};

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/#features", label: "Features", anchor: true },
  { href: "/contact", label: "Contact" },
];

const VALUES = [
  {
    icon: Droplet,
    color: "cyan",
    title: "Pure Hydration",
    desc: "We partner with brands sourcing high-quality mountain spring water — pure, crisp, and representing the trustworthy quality our campaigns amplify.",
  },
  {
    icon: QrCode,
    color: "indigo",
    title: "Smart Technology",
    desc: "Sequential QR architecture prevents malicious spoofing, ensuring every coupon, reward, and lead is authentic and traceable.",
  },
  {
    icon: ShieldCheck,
    color: "teal",
    title: "Tenant Protection",
    desc: "Multi-tenant security keeps every advertiser workspace fully isolated — campaigns, leads, and logs never cross boundaries.",
  },
  {
    icon: Globe,
    color: "emerald",
    title: "Global Scale",
    desc: "From regional distribution runs to nationwide bottle launches, Blunira scales seamlessly with your campaign volume.",
  },
  {
    icon: Users,
    color: "amber",
    title: "Consumer First",
    desc: "Consent-based lead capture, transparent data practices, and instant rewards that make scanning genuinely valuable for consumers.",
  },
  {
    icon: TrendingUp,
    color: "rose",
    title: "Real ROI",
    desc: "Measurable impact from day one — track every scan, lead, and coupon redemption with precision geo-analytics dashboards.",
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

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] relative overflow-x-hidden font-sans transition-colors duration-300">

      {/* Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-cyan-500/[0.04] blur-[140px]" />
        <div className="absolute bottom-[15%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-indigo-500/[0.04] blur-[130px]" />
      </div>

      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(var(--card-border) 1px, transparent 1px), linear-gradient(90deg, var(--card-border) 1px, transparent 1px)", backgroundSize: "72px 72px", opacity: 0.4 }} aria-hidden="true" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--bg-base)]/80 border-b border-[var(--card-border)] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-6" style={{ height: "72px" }}>
          <Link href="/" className="flex items-center gap-3 hover:opacity-85 transition-opacity" aria-label="Blunira Home">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-[var(--card-border)]">
              <Image src="/favicon.png" alt="Blunira" width={36} height={36} className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="block font-display font-black text-lg tracking-tight leading-none text-[var(--text-primary)]">Blunira</span>
              <span className="block text-[9px] font-bold text-cyan-500 uppercase tracking-widest mt-0.5">Hydration Marketing</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map((item) =>
              item.anchor ? (
                <a key={item.label} href={item.href} className="px-4 py-2 rounded-lg text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg)] transition-all">{item.label}</a>
              ) : (
                <Link key={item.label} href={item.href} className="px-4 py-2 rounded-lg text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg)] transition-all">{item.label}</Link>
              )
            )}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/auth/login" className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 hover:scale-[1.02]">
              Brand Portal <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative pt-20 pb-24 text-center" aria-labelledby="about-heading">
          <div className="max-w-4xl mx-auto px-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-500 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              Our Story
            </div>
            <h1 id="about-heading" className="text-5xl sm:text-6xl font-display font-black text-[var(--text-primary)] tracking-tight leading-tight">
              Connecting Hydration{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">
                With Digital Engagement
              </span>
            </h1>
            <p className="text-[var(--text-secondary)] text-lg leading-relaxed max-w-3xl mx-auto">
              Blunira was founded on a simple premise: physical packaging is an underutilized marketing asset.
              By combining premium water with tamper-proof sequential QR campaigns, we enable brands to create
              meaningful, real-time connections with their consumers.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="py-20 border-t border-[var(--card-border)]" aria-labelledby="mission-heading">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 id="mission-heading" className="text-3xl font-display font-black text-[var(--text-primary)]">Our Mission</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                In a crowded market, traditional advertising struggles to build trusted relationships. Blunira bridges the gap.
                We supply premium spring water sourced from natural mountain reservoirs, outfitted with sequentially-numbered QR technology.
              </p>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                When a consumer scans a Blunira bottle, they open a portal. It validates their purchase, respects their privacy,
                captures lead credentials with consent, and delivers valuable brand rewards.
              </p>
              <ul className="space-y-3">
                {[
                  "High-performing DTC marketing engine",
                  "Built directly onto the product label",
                  "Consent-based, privacy-first approach",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-semibold text-[var(--text-secondary)]">
                    <CheckCircle className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-cyan-500/5 blur-[50px] pointer-events-none" />
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Why Water Bottles?</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Water bottles have high dwell-time, are carried everywhere, and represent healthy, clean living.
                They are the perfect vehicle to deliver smart engagements, rewards, and interactive brand portals.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                {[
                  { v: "4h+", l: "Avg. daily carry time" },
                  { v: "73%", l: "Scan-to-claim rate" },
                ].map((s) => (
                  <div key={s.l} className="bg-[var(--bg-elevated)] border border-[var(--card-border)] rounded-2xl p-4 text-center">
                    <span className="block text-2xl font-black text-cyan-500">{s.v}</span>
                    <span className="block text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wide mt-1">{s.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 border-t border-[var(--card-border)]" aria-labelledby="values-heading">
          <div className="max-w-6xl mx-auto px-6 space-y-14">
            <div className="text-center space-y-3">
              <span className="text-cyan-500 text-xs font-extrabold uppercase tracking-widest">What We Stand For</span>
              <h2 id="values-heading" className="text-4xl font-display font-black text-[var(--text-primary)]">
                The Foundations of Blunira
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {VALUES.map((v) => {
                const c = colorMap[v.color];
                const Icon = v.icon;
                return (
                  <article key={v.title} className="bg-[var(--card-bg)] border border-[var(--card-border)] p-7 rounded-3xl space-y-4 hover:border-cyan-500/20 hover:-translate-y-1 transition-all duration-300 group">
                    <div className={`w-11 h-11 rounded-2xl ${c.bg} border ${c.border} flex items-center justify-center ${c.text} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">{v.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{v.desc}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20" aria-label="Get started with Blunira">
          <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
            <h2 className="text-3xl font-display font-black text-[var(--text-primary)]">Ready to Transform Your Packaging?</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">Join hundreds of hydration brands already running smart QR campaigns with Blunira.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold transition-all hover:scale-[1.03] shadow-xl shadow-cyan-500/20">
                Start Your Campaign <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-[var(--card-border)] hover:border-cyan-500/40 bg-[var(--card-bg)] text-[var(--text-primary)] font-bold transition-all">
                Contact Sales
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--card-border)] bg-[var(--bg-surface)] pt-8 pb-8" role="contentinfo">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3 hover:opacity-85 transition-opacity">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-[var(--card-border)]">
              <Image src="/favicon.png" alt="Blunira" width={32} height={32} className="w-full h-full object-cover" />
            </div>
            <span className="font-display font-black text-sm text-[var(--text-primary)]">Blunira</span>
          </Link>
          <p className="text-xs text-[var(--text-muted)]">© 2026 Blunira. All rights reserved.</p>
          <div className="flex items-center gap-5 text-xs font-semibold text-[var(--text-secondary)]">
            {[{ href: "/about", l: "About" }, { href: "/privacy", l: "Privacy" }, { href: "/terms", l: "Terms" }, { href: "/contact", l: "Contact" }].map((lnk) => (
              <Link key={lnk.l} href={lnk.href} className="hover:text-[var(--text-primary)] transition-colors">{lnk.l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
