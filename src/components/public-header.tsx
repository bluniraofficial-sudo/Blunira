import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowRight } from "lucide-react";

export function PublicHeader() {
  return (
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
            { href: "/#features", label: "Features", anchor: true },
            { href: "/#how-it-works", label: "How It Works", anchor: true },
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
  );
}
