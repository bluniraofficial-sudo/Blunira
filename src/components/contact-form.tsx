"use client";

import { useState } from "react";
import { ArrowRight, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { LoadingButton } from "@/components/ui/loading-button";

export function ContactForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !email || message.length < 10) return;
    setIsSubmitting(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, company, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setStatus("success");
      setStatusMsg("Thanks for reaching out! We'll get back to you within 24 hours.");
      setFirstName(""); setLastName(""); setEmail(""); setCompany(""); setMessage("");
    } catch (err: any) {
      setStatus("error");
      setStatusMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-label="Contact form">
      {status === "success" && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {statusMsg}
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {statusMsg}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="first-name" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">First Name *</label>
          <input id="first-name" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Alex" required
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--card-border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition-all" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="last-name" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Last Name</label>
          <input id="last-name" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Carter"
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--card-border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition-all" />
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Email Address *</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alex@company.com" required
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--card-border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition-all" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="company" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Company / Brand</label>
        <input id="company" type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Aqua Flow Beverages"
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--card-border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition-all" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="message" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Message *</label>
        <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Tell us about your campaign goals..." required
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--card-border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition-all resize-none" />
      </div>
      <LoadingButton type="submit" loading={isSubmitting} variant="primary" className="w-full !py-4 !rounded-xl !text-sm shadow-lg shadow-cyan-500/20">
        {isSubmitting ? "Sending..." : "Send Message"}
        <ArrowRight className="w-4 h-4" />
      </LoadingButton>
    </form>
  );
}