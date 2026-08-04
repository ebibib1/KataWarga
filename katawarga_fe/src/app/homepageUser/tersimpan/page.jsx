"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import { useConfig } from "@/hooks/useConfig";
import { CATEGORY_ICONS } from "@/lib/configIcons";
import {
  Bookmark,
  BookmarkMinus,
  Heart,
  Search,
  MessageSquare,
  ThumbsUp,
  Loader2,
  AlertCircle,
} from "lucide-react";
import ReportDetailModal from "@/components/modals/ReportDetailModal";

export default function TersimpanPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("tersimpan");
  const [searchQuery, setSearchQuery] = useState("");
  const [savedItems, setSavedItems] = useState([]);
  const [likedItems, setLikedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState(null);

  const token = session?.accessToken;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const { config } = useConfig();
  const categories = config?.categories || [];

  // ── Fetch bookmarked reports ────────────────────────────────────────────────
  const fetchBookmarks = useCallback(async () => {
    if (!token) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/reports/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSavedItems(
          (data.data || []).map((r) => ({
            ...r,
            category: r.category_name,
            categoryConfig: categories.find((c) => c.id === r.category_id) || categories[0] || {},
            time: new Date(r.created_at).toLocaleDateString("id-ID", {
              day: "numeric", month: "long", year: "numeric",
            }),
          }))
        );
      }
    } catch (err) {
      console.error("Fetch bookmarks error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token, apiUrl]);

  // ── Fetch liked reports ─────────────────────────────────────────────────────
  const fetchLiked = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/reports?liked=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLikedItems(
          (data.data || []).map((r) => ({
            ...r,
            category: r.category_name,
            categoryConfig: categories.find((c) => c.id === r.category_id) || categories[0] || {},
            time: new Date(r.created_at).toLocaleDateString("id-ID", {
              day: "numeric", month: "long", year: "numeric",
            }),
          }))
        );
      }
    } catch (err) {
      console.error("Fetch liked error:", err);
    }
  }, [token, apiUrl, categories]);

  useEffect(() => {
    fetchBookmarks();
    fetchLiked();
  }, [fetchBookmarks, fetchLiked]);

  // ── Remove bookmark ─────────────────────────────────────────────────────────
  const handleDeleteBookmark = async (reportId) => {
    if (!token) return;
    setDeletingId(reportId);
    try {
      const res = await fetch(`${apiUrl}/reports/${reportId}/bookmark`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSavedItems((prev) => prev.filter((item) => item.id !== reportId));
      }
    } catch (err) {
      console.error("Delete bookmark error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Remove like ─────────────────────────────────────────────────────────────
  const handleUnlike = async (reportId) => {
    if (!token) return;
    setDeletingId(reportId);
    try {
      const res = await fetch(`${apiUrl}/reports/${reportId}/like`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setLikedItems((prev) => prev.filter((item) => item.id !== reportId));
      }
    } catch (err) {
      console.error("Unlike error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const activeData = activeTab === "tersimpan" ? savedItems : likedItems;
  const filtered = activeData.filter(
    (item) =>
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { val: "tersimpan", label: "Tersimpan", icon: Bookmark },
    { val: "disukai",   label: "Disukai",   icon: Heart    },
  ];

  return (
    <div className="flex flex-col bg-[#FFFBF5] min-h-full">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between px-5 py-3.5 bg-[#FFFBF5]/80 backdrop-blur-md sticky top-0 z-20 border-b border-[#E8E2D9]">
        <div>
          <h1 className="font-bold text-base text-[#111827]">Tersimpan</h1>
          <p className="text-[11px] text-[#6B6B8A]">
            Kelola aduan warga yang telah Anda tandai atau simpan
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1 bg-[#192126]/10 text-[#192126] rounded-full">
          {savedItems.length} item
        </span>
      </div>

      <div className="p-4 md:p-6 flex flex-col gap-4 max-w-2xl mx-auto w-full">
        {/* Tab Selector */}
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-1 shadow-sm flex text-xs">
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.val}
                onClick={() => setActiveTab(item.val)}
                className={`flex-1 py-2 font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                  activeTab === item.val
                    ? "bg-[#192126] text-white shadow-sm"
                    : "text-[#6B6B8A] hover:bg-[#F5F0E8] hover:text-[#111827]"
                }`}
              >
                <Icon size={12} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B0A898]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Cari di dalam laporan ${activeTab}...`}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E8E2D9] rounded-xl text-xs text-[#111827] placeholder-[#B0A898] focus:outline-none focus:border-[#192126] transition"
          />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Loader2 className="animate-spin text-[#192126]" size={24} />
              <p className="text-xs text-[#6B6B8A]">Memuat laporan...</p>
            </div>
          ) : !token ? (
            <div className="bg-white border border-[#E8E2D9] rounded-3xl p-12 text-center flex flex-col items-center gap-3">
              <AlertCircle size={24} className="text-[#B0A898]" />
              <p className="text-sm font-bold text-[#111827]">Login diperlukan</p>
              <p className="text-xs text-[#6B6B8A]">Silakan login untuk melihat halaman ini.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-[#E8E2D9] rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#FFFBF5] border border-[#E8E2D9] flex items-center justify-center text-[#B0A898]">
                {activeTab === "tersimpan" ? <Bookmark size={20} /> : <Heart size={20} />}
              </div>
              <h3 className="font-bold text-sm text-[#111827]">
                {searchQuery ? "Tidak ditemukan" : `Belum ada laporan ${activeTab}`}
              </h3>
              <p className="text-xs text-[#6B6B8A]">
                {searchQuery
                  ? "Coba kata kunci lain."
                  : activeTab === "tersimpan"
                    ? "Klik ikon bookmark pada laporan untuk menyimpannya di sini."
                    : "Klik ikon hati pada laporan untuk menyukainya."}
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const CatIcon = CATEGORY_ICONS[item.category];
              return (
                <div
                  key={item.id}
                  className="bg-white border border-[#E8E2D9] rounded-2xl p-4 hover:border-[#192126]/20 transition shadow-sm flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        item.categoryConfig?.bg || "bg-blue-50 text-[#192126]"
                      }`}
                    >
                      {CatIcon && <CatIcon size={9} />}
                      {item.category || "Umum"}
                    </span>

                    {/* Action button: unbookmark or unlike */}
                    {activeTab === "tersimpan" ? (
                      <button
                        onClick={() => handleDeleteBookmark(item.id)}
                        disabled={deletingId === item.id}
                        className="p-1.5 hover:bg-red-50 text-[#B0A898] hover:text-red-500 rounded-lg transition disabled:opacity-40"
                        title="Hapus dari tersimpan"
                      >
                        {deletingId === item.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <BookmarkMinus size={13} />
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnlike(item.id)}
                        disabled={deletingId === item.id}
                        className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition disabled:opacity-40"
                        title="Batal suka"
                      >
                        {deletingId === item.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Heart size={13} className="fill-current" />
                        )}
                      </button>
                    )}
                  </div>

                  <h3
                    onClick={() => setSelectedReportId(item.id)}
                    className="font-bold text-xs sm:text-sm text-[#111827] hover:text-[#192126] cursor-pointer transition"
                  >
                    {item.title}
                  </h3>

                  <p className="text-[10px] text-[#6B6B8A] font-semibold">
                    Oleh: {item.user_name || "Warga"} · {item.time}
                  </p>

                  <div className="flex items-center gap-3.5 pt-2 border-t border-[#FFFBF5] text-[10px] text-[#6B6B8A] font-bold">
                    <span className="flex items-center gap-1">
                      <ThumbsUp size={11} /> {item.likes_count || 0} Dukungan
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={11} /> {item.comments_count || 0} Tanggapan
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Detail Popup Modal */}
      {selectedReportId && (
        <ReportDetailModal
          reportId={selectedReportId}
          onClose={() => {
            setSelectedReportId(null);
            fetchBookmarks();
            fetchLiked();
          }}
        />
      )}
    </div>
  );
}
