"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Bell, Heart, MessageCircle, Users, Activity } from "lucide-react";
import { useSession } from "next-auth/react";

const TYPE_ICONS = {
  status:  Activity,
  like:    Heart,
  comment: MessageCircle,
  follow:  Users,
};

export default function NotificationPanel({ onClose }) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState([]);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const fetchNotifications = async () => {
    if (!session) return;
    const token = session.accessToken || session.user?.accessToken;
    try {
      const res = await fetch(`${apiUrl}/notifications?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.data || []);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchNotifications();
  }, [session, apiUrl]);

  const unread = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    const token = session.accessToken || session.user?.accessToken;
    try {
      await fetch(`${apiUrl}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch { /* ignore */ }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      className="absolute right-0 top-12 w-80 bg-white border border-[#E8E2D9] rounded-2xl shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0EAE0]">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-[#192126]" />
          <span className="font-bold text-sm text-[#111827]">Notifikasi</span>
          {unread > 0 && (
            <span className="bg-[#192126] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {unread}
            </span>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="text-[10px] font-bold text-[#192126] hover:underline"
          >
            Tandai Dibaca
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-[#6B6B8A]">
            <Bell size={28} strokeWidth={1.5} />
            <span className="text-xs font-semibold">Belum ada notifikasi</span>
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type] || Bell;
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3 border-b border-[#F9F5EE] hover:bg-[#FFFBF5] transition cursor-pointer ${
                  !n.is_read ? "bg-[#EFF6FF]" : ""
                }`}
              >
                <div
                  className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center ${
                    n.type === "like"
                      ? "bg-red-100 text-red-500"
                      : n.type === "comment"
                      ? "bg-blue-100 text-blue-500"
                      : n.type === "follow"
                      ? "bg-green-100 text-green-500"
                      : "bg-amber-100 text-amber-500"
                  }`}
                >
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#111827] leading-snug">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-[#6B6B8A] mt-0.5">
                    {new Date(n.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {!n.is_read && (
                  <span className="w-2 h-2 bg-[#192126] rounded-full flex-shrink-0 mt-1.5" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t border-[#F0EAE0] text-center">
          <a
            href="/homepageUser/notifikasi"
            className="text-[11px] font-bold text-[#192126] hover:underline"
          >
            Lihat Semua Notifikasi
          </a>
        </div>
      )}
    </motion.div>
  );
}
