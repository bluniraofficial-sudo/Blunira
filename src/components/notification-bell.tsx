"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, Sparkles, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  initialUnreadCount: number;
}

export function NotificationBell({ initialUnreadCount }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications on mount & when opened
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const togglePopover = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const markAsRead = async (id: string) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={togglePopover}
        type="button"
        className="relative p-2.5 rounded-xl transition-all cursor-pointer group"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--card-border)",
        }}
        title="Notifications"
      >
        <Bell className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--cyan-400)] transition-colors" />

        {unreadCount > 0 && (
          <>
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-cyan-500 text-[9px] font-black text-black flex items-center justify-center rounded-full shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-cyan-400 rounded-full animate-ping opacity-75 pointer-events-none" />
          </>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border shadow-2xl z-50 overflow-hidden animate-fade-in backdrop-blur-xl"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--card-border)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3.5 border-b"
            style={{ borderColor: "var(--card-border)" }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                type="button"
                className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Body List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-80" />
                <p className="text-xs font-bold text-[var(--text-primary)]">You're all caught up!</p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  No new notifications right now.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && markAsRead(n.id)}
                  className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                    !n.isRead ? "bg-cyan-500/[0.04] hover:bg-cyan-500/[0.08]" : "hover:bg-white/[0.02]"
                  }`}
                >
                  {/* Icon indicator */}
                  <div className="mt-0.5 flex-shrink-0">
                    {!n.isRead ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 block shadow-sm shadow-cyan-400/50" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-bold truncate ${
                          !n.isRead ? "text-cyan-400 font-extrabold" : "text-[var(--text-primary)]"
                        }`}
                      >
                        {n.title}
                      </span>
                      <span className="text-[9px] text-[var(--text-muted)] flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(n.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <p className="text-[11px] text-[var(--text-secondary)] mt-1 line-clamp-2 leading-snug">
                      {n.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            className="p-2.5 text-center border-t bg-black/10"
            style={{ borderColor: "var(--card-border)" }}
          >
            <span className="text-[10px] text-[var(--text-muted)] font-medium">
              Real-time activity alerts
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
