import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Blunira QR Hydration Marketing",
  description: "Review Blunira\'s terms of service governing use of our QR hydration marketing platform, campaign management, and data processing agreements.",
  alternates: { canonical: "https://blunira.com/terms" },
};
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, Gavel } from "lucide-react";

export default function TermsPage() {
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
              <Gavel className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-display font-black text-[var(--text-primary)] tracking-tight">Terms of Service</h1>
          </div>
          <p className="text-[var(--text-secondary)] text-xs">Last Updated: July 25, 2026</p>
        </div>

        <div className="border-t border-[var(--card-border)] pt-10 space-y-10 text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Service Agreement</h2>
            <p>
              By accessing the Blunira brand portals, configuring advertiser accounts, generating sequential QR codes, or scanning Blunira campaigns, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please refrain from using our software and physical media channels.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Advertiser Conduct & Campaign Rules</h2>
            <p>
              Advertisers utilizing our platform are fully responsible for the compliance and legal validity of the campaigns they publish.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Advertisers must not configure promotions that violate local gaming or lottery regulations.</li>
              <li>Lead capture registration forms must request consumer consent clearly and honestly.</li>
              <li>Coupons and discounts configured in campaigns must be honored according to the parameters specified.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. QR Code Integrity & sequentially numbering</h2>
            <p>
              Our platform generates custom sequential QR endpoints (e.g. `QR000000001`) mapped securely in the database.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Sequential series generation is subject to campaign quotas and subscription tiers.</li>
              <li>Any attempts to brute-force, scrape, or systematically trigger scan endpoints outside of physical label placements will result in immediate IP banning.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Account Suspension</h2>
            <p>
              Blunira Super Admins reserve the right to suspend or terminate advertiser tenant workspaces at any time for policy violations, outstanding payments, or fraudulent activities. In the event of advertiser suspension:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>All associated campaign landing pages will return an inactive message.</li>
              <li>Active QR scans will cease redirection tracking.</li>
              <li>Access to crm logs, lead tables, and coupon codes will be restricted.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Limitation of Liability</h2>
            <p>
              Blunira services are provided "as is". We are not liable for typographical errors in commercial print labels, scan connection failures due to consumer carrier signal loss, database outages, or advertiser disputes arising from lead lists or coupon redemptions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">6. Amendments to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Changes will be posted to this page with an updated timestamp. Continued use of the platform constitutes agreement to the updated terms.
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
