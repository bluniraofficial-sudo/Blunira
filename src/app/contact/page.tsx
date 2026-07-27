import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import {
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Sparkles,
  Clock,
  Globe,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Blunira — Get in Touch with Our Team",
  description:
    "Reach out to Blunira for QR hydration marketing inquiries, campaign support, or partnership opportunities. Our team responds within 24 hours.",
  openGraph: {
    title: "Contact Blunira — QR Hydration Marketing Platform",
    description: "Get in touch with Blunira for sales, support, or partnership inquiries.",
    url: "https://blunira.com/contact",
    siteName: "Blunira",
    type: "website",
  },
  alternates: { canonical: "https://blunira.com/contact" },
};

const CONTACT_METHODS = [
  {
    icon: Mail,
    color: "cyan",
    title: "Email Us",
    value: "hello@blunira.com",
    desc: "For general inquiries and sales",
    href: "mailto:hello@blunira.com",
  },
  {
    icon: Phone,
    color: "indigo",
    title: "Call Us",
    value: "+91 800 258 6472",
    desc: "Mon–Fri, 9am–6pm IST",
    href: "tel:+918002586472",
  },
  {
    icon: MapPin,
    color: "teal",
    title: "Visit Us",
    value: "New York, NY 10001",
    desc: "123 Marketing Ave, Suite 400",
    href: "#",
  },
  {
    icon: Clock,
    color: "emerald",
    title: "Response Time",
    value: "< 24 Hours",
    desc: "We reply to all inquiries quickly",
    href: "#",
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  cyan:    { bg: "bg-cyan-500/10",    text: "text-cyan-500",    border: "border-cyan-500/20" },
  indigo:  { bg: "bg-indigo-500/10",  text: "text-indigo-500",  border: "border-indigo-500/20" },
  teal:    { bg: "bg-teal-500/10",    text: "text-teal-500",    border: "border-teal-500/20" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] relative overflow-x-hidden font-sans transition-colors duration-300">

      {/* Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-[-15%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-indigo-500/[0.04] blur-[140px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-cyan-500/[0.04] blur-[130px]" />
      </div>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(var(--card-border) 1px, transparent 1px), linear-gradient(90deg, var(--card-border) 1px, transparent 1px)", backgroundSize: "72px 72px", opacity: 0.4 }} aria-hidden="true" />

      {/* Header */}
      <PublicHeader />

      <main>
        {/* Hero */}
        <section className="relative pt-20 pb-16 text-center" aria-labelledby="contact-heading">
          <div className="max-w-3xl mx-auto px-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-500 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              Get in Touch
            </div>
            <h1 id="contact-heading" className="text-5xl sm:text-6xl font-display font-black text-[var(--text-primary)] tracking-tight leading-tight">
              We&apos;d Love to{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Hear from You
              </span>
            </h1>
            <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
              Whether you&apos;re ready to launch your first QR campaign or just exploring what Blunira can do,
              our team is here to help. Reach out and we&apos;ll respond within 24 hours.
            </p>
          </div>
        </section>

        {/* Contact cards + form */}
        <section className="py-12 pb-24" aria-label="Contact information and form">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

              {/* Left: Contact methods */}
              <div className="space-y-6">
                <h2 className="text-2xl font-display font-black text-[var(--text-primary)]">Contact Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {CONTACT_METHODS.map((m) => {
                    const c = colorMap[m.color];
                    const Icon = m.icon;
                    return (
                      <a
                        key={m.title}
                        href={m.href}
                        className="group bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 space-y-3 hover:border-cyan-500/30 hover:-translate-y-1 transition-all duration-300"
                      >
                        <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center ${c.text} group-hover:scale-110 transition-transform`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)]">{m.title}</p>
                          <p className="text-sm font-bold text-[var(--text-primary)] mt-0.5">{m.value}</p>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{m.desc}</p>
                        </div>
                      </a>
                    );
                  })}
                </div>

                {/* Extra info */}
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-7 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
                      <Globe className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-[var(--text-primary)]">Global Partnerships</h3>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    Blunira works with hydration brands across North America, Europe, and Southeast Asia.
                    Whether you&apos;re a regional bottler or a global brand, we have campaign solutions for your scale.
                  </p>
                </div>
              </div>

              {/* Right: Contact form */}
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-cyan-500/5 blur-[60px] pointer-events-none" />
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-extrabold text-[var(--text-primary)]">Send Us a Message</h2>
                  </div>

                  <form className="space-y-5" aria-label="Contact form">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="first-name" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">First Name</label>
                        <input id="first-name" type="text" placeholder="Alex" autoComplete="given-name"
                          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--card-border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="last-name" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Last Name</label>
                        <input id="last-name" type="text" placeholder="Carter" autoComplete="family-name"
                          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--card-border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition-all" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="email" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Email Address</label>
                      <input id="email" type="email" placeholder="alex@company.com" autoComplete="email"
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--card-border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="company" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Company / Brand</label>
                      <input id="company" type="text" placeholder="Aqua Flow Beverages" autoComplete="organization"
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--card-border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="message" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Message</label>
                      <textarea id="message" rows={4} placeholder="Tell us about your campaign goals..."
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--card-border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition-all resize-none" />
                    </div>
                    <button type="submit"
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-100 shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2">
                      Send Message
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}
