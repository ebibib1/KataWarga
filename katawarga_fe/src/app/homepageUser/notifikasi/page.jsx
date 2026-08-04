"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  Clock,
  MessageSquare,
  ThumbsUp,
  UserPlus,
  MoreVertical,
  Check,
  Loader2,
  XCircle,
  RefreshCw,
} from "lucide-react";

// Map notification message keywords to icon/color
function getNotifStyle(message = "") {
  const msg = message.toLowerCase();
  if (msg.includes("selesai"))
    return { icon: CheckCircle2, iconColor: "text-green-600 bg-green-50 border-green-100" };
  if (msg.includes("diproses"))
    return { icon: Loader2, iconColor: "text-blue-500 bg-blue-50 border-blue-100" };
  if (msg.includes("ditolak"))
    return { icon: XCircle, iconColor: "text-red-500 bg-red-50 border-red-100" };
  if (msg.includes("komentar") || msg.includes("tanggapan"))
    return { icon: MessageSquare, iconColor: "text-[#192126] bg-blue-50 border-blue-100" };
  if (msg.includes("like") || msg.includes("suka") || msg.includes("dukungan"))
    return { icon: ThumbsUp, iconColor: "text-orange-500 bg-orange-50 border-orange-100" };
  if (msg.includes("follow") || msg.includes("mengikuti"))
    return { icon: UserPlus, iconColor: "text-violet-500 bg-violet-50 border-violet-100" };
  // default — status
  return { icon: Clock, iconColor: "text-amber-500 bg-amber-50 border-amber-100" };
}

function relativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Baru saja";
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} jam lalu`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default function NotifikasiPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab]   = useState("semua");
  const [notifs, setNotifs]         = useState([]);
  const [isLoading, setIsLoading]   = useState(true);

  const token  = session?.accessToken || session?.user?.accessToken;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  // ── Fetch notifications from API ─────────────────────────────────────────────
  const fetchNotifs = useCallback(async () => {
    if (!token) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/notifications?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifs(data.data || []);
        // Sync unread count to localStorage for LeftSidebar badge
        const unread = (data.data || []).filter((n) => !n.is_read).length;
        localStorage.setItem("kw_unread_notif_count", String(unread));
        window.dispatchEvent(new Event("kw_notif_update"));
      }
    } catch (err) {
      console.error("Fetch notifications error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token, apiUrl]);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  // ── Mark all as read ──────────────────────────────────────────────────────────
  const markAllAsRead = async () => {
    if (!token) return;
    try {
      await fetch(`${apiUrl}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
      localStorage.setItem("kw_unread_notif_count", "0");
      window.dispatchEvent(new Event("kw_notif_update"));
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  // ── Mark single as read ───────────────────────────────────────────────────────
  const markSingleAsRead = async (id) => {
    if (!token) return;
    try {
      await fetch(`${apiUrl}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = notifs.map((n) => (n.id === id ? { ...n, is_read: true } : n));
      setNotifs(updated);
      const unread = updated.filter((n) => !n.is_read).length;
      localStorage.setItem("kw_unread_notif_count", String(unread));
      window.dispatchEvent(new Event("kw_notif_update"));
    } catch (err) {
      console.error("Mark single read error:", err);
    }
  };

  const filteredNotifs = activeTab === "semua"
    ? notifs
    : notifs.filter((n) => !n.is_read);

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  return (
    <div className="flex flex-col h-full bg-[#FFFBF5]">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between px-5 py-3.5 bg-[#FFFBF5]/80 backdrop-blur-md sticky top-0 z-20 border-b border-[#E8E2D9]">
        <div>
          <h1 className="font-bold text-base text-[#111827]">Notifikasi</h1>
          <p className="text-[11px] text-[#6B6B8A]">
            Pantau aktivitas terbaru dan status laporan Anda
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchNotifs}
            className="p-2 hover:bg-[#F5F0E8] rounded-xl text-[#6B6B8A] hover:text-[#111827] transition"
            title="Segarkan"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3 py-1.5 bg-white border border-[#E8E2D9] hover:bg-[#F5F0E8] rounded-xl text-xs font-bold text-[#192126] transition flex items-center gap-1.5"
            >
              <Check size={14} />
              Tandai semua dibaca
            </button>
          )}
        </div>
      </div>

      <div className="p-4 md:p-6 flex flex-col gap-4 max-w-2xl mx-auto w-full">
        {/* Tabs */}
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-1 shadow-sm flex">
          <button
            onClick={() => setActiveTab("semua")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === "semua"
                ? "bg-[#192126] text-white"
                : "text-[#6B6B8A] hover:bg-[#F5F0E8] hover:text-[#111827]"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setActiveTab("unread")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition relative ${
              activeTab === "unread"
                ? "bg-[#192126] text-white"
                : "text-[#6B6B8A] hover:bg-[#F5F0E8] hover:text-[#111827]"
            }`}
          >
            Belum Dibaca
            {unreadCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Loader2 className="animate-spin text-[#192126]" size={28} />
              <p className="text-xs text-[#6B6B8A]">Memuat notifikasi...</p>
            </div>
          ) : filteredNotifs.length === 0 ? (
            <div className="bg-white border border-[#E8E2D9] rounded-3xl p-10 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#FFFBF5] border border-[#E8E2D9] flex items-center justify-center text-[#B0A898] mb-3">
                <Bell size={20} />
              </div>
              <h3 className="font-bold text-sm text-[#111827]">
                {activeTab === "unread" ? "Semua sudah dibaca" : "Tidak ada notifikasi"}
              </h3>
              <p className="text-xs text-[#6B6B8A] mt-1">
                {activeTab === "unread"
                  ? "Tidak ada notifikasi yang belum dibaca."
                  : "Semua pembaruan laporan akan muncul di sini."}
              </p>
            </div>
          ) : (
            filteredNotifs.map((n) => {
              // Use `message` or `massage` (DB typo fallback)
              const msgText = n.message || n.massage || "";
              const { icon: Icon, iconColor } = getNotifStyle(msgText);
              return (
                <div
                  key={n.id}
                  onClick={async () => {
                    if (n.report_id) {
                      if (!n.is_read) await markSingleAsRead(n.id);
                      router.push(`/homepageUser/laporan/${n.report_id}`);
                    } else {
                      if (!n.is_read) markSingleAsRead(n.id);
                    }
                  }}
                  className={`bg-white border rounded-2xl p-4 shadow-sm transition flex gap-3.5 items-start ${
                    n.is_read
                      ? "border-[#E8E2D9] cursor-default"
                      : "border-[#192126]/40 bg-blue-50/10 cursor-pointer hover:border-[#192126]/20"
                  }`}
                >
                  {/* Unread indicator bar */}
                  {!n.is_read && (
                    <div className="w-1 h-10 rounded-full bg-[#192126] shrink-0" />
                  )}

                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${iconColor}`}>
                    <Icon size={16} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-xs sm:text-sm text-[#111827] truncate">
                        {n.report_title || "Notifikasi"}
                      </h3>
                      <span className="text-[10px] text-[#B0A898] font-semibold whitespace-nowrap">
                        {relativeTime(n.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B6B8A] mt-1 leading-relaxed">
                      {msgText}
                    </p>
                  </div>

                  {/* Options dot menu (non-functional cosmetic) */}
                  <button className="p-1 hover:bg-[#F5F0E8] text-[#B0A898] hover:text-[#3D3D5C] rounded-lg transition shrink-0">
                    <MoreVertical size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
