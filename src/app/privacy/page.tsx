import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Blunira QR Hydration Marketing",
  description: "Read Blunira\'s privacy policy to understand how we collect, process, and protect your data in our QR hydration marketing platform.",
  alternates: { canonical: "https://blunira.com/privacy" },
};
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden font-sans">
      
      {/* Ambient background glows enclosed to prevent bottom overflow gap */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none" 
        style={{
          backgroundImage: "linear-gradient(rgba(6,182,212,1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,1) 1px, transparent 1px)",
          backgroundSize: "64px 64px"
        }} 
      />

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--bg-base)]/80 border-b border-[var(--card-border)] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src="/favicon.png" alt="Blunira Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="block font-display font-black text-xl tracking-tight text-[var(--text-primary)] leading-none">Blunira</span>
              <span className="block text-[9px] font-bold text-cyan-500 uppercase tracking-widest mt-0.5">Hydration Marketing</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[var(--text-secondary)]">
            <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">Home</Link>
            <Link href="/about" className="hover:text-[var(--text-primary)] transition-colors">About Us</Link>
            <Link href="/#features" className="hover:text-[var(--text-primary)] transition-colors">Features</Link>
            <Link href="/#how-it-works" className="hover:text-[var(--text-primary)] transition-colors">How It Works</Link>
            <Link href="/contact" className="hover:text-[var(--text-primary)] transition-colors">Contact Us</Link>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link 
              href="/auth/login" 
              className="px-5 py-2.5 rounded-xl border border-[var(--card-border)] hover:border-cyan-500/30 bg-[var(--card-bg)] hover:bg-cyan-500/5 text-sm font-bold transition-all text-[var(--text-primary)] flex items-center gap-2 cursor-pointer"
            >
              <span>Brand Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        
        <div className="space-y-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors group mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Home</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-display font-black text-[var(--text-primary)] tracking-tight">Privacy Policy</h1>
          </div>
          <p className="text-[var(--text-secondary)] text-xs">Last Updated: July 25, 2026</p>
        </div>

        <div className="border-t border-[var(--card-border)] pt-10 space-y-10 text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Introduction</h2>
            <p>
              Welcome to Blunira ("we", "our", "us"). We are committed to protecting the privacy of consumers who scan our product QR codes and the advertisers who use our marketing platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you interact with our services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Information We Collect</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-white font-bold mb-1">A. QR Scan Logs (Automatic Data Collection)</h3>
                <p>
                  When you scan a Blunira QR code with a mobile device, our servers automatically log basic transaction and technical metrics, including:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Device Operating System and version (e.g., iOS, Android).</li>
                  <li>Browser application type and version (e.g., Safari, Chrome).</li>
                  <li>Approximate location data derived from your IP address (resolved to the city and country level, e.g., "Chicago, USA"). We do NOT log precise GPS coordinate points.</li>
                  <li>Timestamp and specific sequence reference code of the scan.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-bold mb-1">B. Lead Capture Registration (Voluntary Submission)</h3>
                <p>
                  To unlock rewards, promotional coupon codes, or campaign perks on landing pages, consumers voluntarily enter identification parameters, including:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Full name.</li>
                  <li>Mobile phone number.</li>
                  <li>Email address.</li>
                  <li>Voluntarily submitted city, region, or redemption comments.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. How We Use Information</h2>
            <p>
              We process information in accordance with legitimate business purposes:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To validate campaign claiming eligibility and prevent reward fraud or duplicate claims.</li>
              <li>To compute visual, aggregate metrics on scanner engagement (conversion rate, location clusters, device breakdowns) for brand campaigns.</li>
              <li>To deliver in-app notifications and email summaries to authorized advertisers regarding new leads.</li>
              <li>To process automated email reminder queues and connect direct WhatsApp chats initiated by advertisers.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Multi-Tenant Data Isolation</h2>
            <p>
              Blunira is designed as an isolated multi-tenant system. Lead logs, coupon redemption registers, and campaign parameters are strictly isolated within each tenant partition. Managers from one brand cannot access or query lead lists or scan logs belonging to another advertiser under any circumstances.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Cookies and Local Storage</h2>
            <p>
              We utilize secure, session-only cookies (e.g., `claimed_campaign_[id]`) on consumer browsers solely to remember if a device has already registered a lead for a specific bottle campaign. This facilitates showing the rewarded coupon code on refresh and prevents double claiming. These cookies do not track you outside the Blunira domain.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">6. Contact Us</h2>
            <p>
              If you have any questions, feedback, or requests regarding data removal or compliance, please reach out to us at <span className="text-cyan-400 font-bold">privacy@blunira.com</span>.
            </p>
          </section>

        </div>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--card-border)] bg-[var(--bg-surface)] py-8 text-[var(--text-muted)]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src="/favicon.png" alt="Blunira Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="block font-display font-black text-sm text-[var(--text-primary)] tracking-tight">Blunira</span>
              <span className="block text-[8px] font-bold text-cyan-500 uppercase tracking-widest mt-0.5">Pure • Refreshing • Trusted</span>
            </div>
          </Link>

          <p className="text-xs text-[var(--text-muted)] font-semibold">
            &copy; 2026 Blunira. All rights reserved. Enterprise QR Hydration Suite.
          </p>

          <div className="flex items-center gap-6 text-xs font-bold">
            <Link href="/about" className="hover:text-[var(--text-primary)] transition-colors">About Us</Link>
            <Link href="/privacy" className="hover:text-[var(--text-primary)] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[var(--text-primary)] transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-[var(--text-primary)] transition-colors">Contact Us</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
