"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Activity, 
  UserCheck, 
  QrCode, 
  Gift, 
  Users, 
  Globe,
  LucideIcon 
} from "lucide-react";

interface FloatingCardProps {
  title: string;
  value: string;
  desc: string;
  icon: "activity" | "user-check" | "qr-code" | "gift" | "users" | "globe";
  iconColor: string;
  className?: string;
  delay?: number;
  badge?: string;
}

const iconMap: Record<FloatingCardProps["icon"], LucideIcon> = {
  activity: Activity,
  "user-check": UserCheck,
  "qr-code": QrCode,
  gift: Gift,
  users: Users,
  globe: Globe,
};

export function FloatingCard({
  title,
  value,
  desc,
  icon,
  iconColor,
  className = "",
  delay = 0,
  badge,
}: FloatingCardProps) {
  const [displayValue, setDisplayValue] = useState("0");

  // Numeric count-up animation
  useEffect(() => {
    // Parse numeric characters from string (e.g. "12,482" -> 12482)
    const isNumeric = /^[0-9,.\-+%M]+$/.test(value);
    const cleanNum = value.replace(/[^0-9.]/g, "");
    const parsed = parseFloat(cleanNum);

    if (isNaN(parsed) || !isNumeric) {
      setDisplayValue(value);
      return;
    }

    const duration = 2000; // 2 seconds
    const start = 0;
    const end = parsed;
    let startTime: number | null = null;

    const animateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const current = Math.floor(progress * (end - start) + start);

      // Reformat count back to original string format
      let formatted = current.toString();
      if (value.includes(",")) {
        formatted = current.toLocaleString();
      }
      if (value.includes("M")) {
        formatted = (current / 10).toFixed(1) + "M";
      }
      if (value.startsWith("+")) {
        formatted = "+" + formatted;
      }
      if (value.includes("%")) {
        formatted = formatted + "%";
      }

      setDisplayValue(formatted);

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      } else {
        setDisplayValue(value);
      }
    };

    const timer = setTimeout(() => {
      requestAnimationFrame(animateCount);
    }, delay * 1000 + 400);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -12, 0],
      }}
      whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
      transition={{
        y: {
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay,
        },
        opacity: { duration: 0.6, delay: delay * 0.5 },
        scale: { duration: 0.6, delay: delay * 0.5 },
      }}
      className={`bg-[var(--card-bg)] border border-[var(--card-border)] backdrop-blur-xl rounded-2xl p-3.5 sm:p-4 shadow-2xl z-20 flex flex-col gap-1.5 min-w-0 select-none transition-all duration-300 ${className}`}
    >
      {/* Top row */}
      <div className="flex items-center justify-between gap-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {(() => {
            const SelectedIcon = iconMap[icon];
            return <SelectedIcon className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} />;
          })()}
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] truncate">
            {title}
          </span>
        </div>
        {badge && (
          <span className="text-[7px] font-extrabold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 max-w-[56px] truncate">
            {badge}
          </span>
        )}
      </div>

      {/* Main value */}
      <span className="block text-xl font-display font-black text-[var(--text-primary)] leading-none tracking-tight">
        {displayValue}
      </span>

      {/* Description / Subtext */}
      <div className="flex items-center gap-1.5 mt-0.5">
        <div className={`w-1.5 h-1.5 rounded-full ${value.includes("claims") || badge ? "bg-emerald-400 animate-pulse" : "bg-cyan-500 animate-pulse"}`} />
        <span className="text-[9px] text-[var(--text-secondary)] font-semibold truncate leading-none">
          {desc}
        </span>
      </div>
    </motion.div>
  );
}
