"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  ArrowRight,
  Loader2,
  RotateCcw,
} from "lucide-react";

// Components
import Avatar from "@/components/ui/Avatar";
import ReportCard from "@/components/feed/ReportCard";
import FeedFilters from "@/components/feed/FeedFilters";
import MyReportSummary from "@/components/feed/MyReportSummary";
import ReportDetailModal from "@/components/modals/ReportDetailModal";

// Only keep non-mock constants — categories now come from API
import { useConfig } from "@/hooks/useConfig";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function HomepageUser() {
  const { data: session } = useSession();
  const router = useRouter();

  // State
  const [activeFilter, setActiveFilter]     = useState("terbaru");
  const [activeCategory, setActiveCategory] = useState("semua");
  const [feed, setFeed]                     = useState([]);
  const [isLoading, setIsLoading]           = useState(true);
  const [page, setPage]                     = useState(1);
  const [hasMore, setHasMore]               = useState(true);
  const [selectedReportId, setSelectedReportId] = useState(null);

  const { config } = useConfig();
  const categories = config?.categories || [];
  const [isLoadingMore, setIsLoadingMore]   = useState(false);

  const token = session?.accessToken || session?.user?.accessToken;

  const fetchReports = useCallback(async (isLoadMore = false) => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    if (isLoadMore) setIsLoadingMore(true);
    else setIsLoading(true);

    try {
      const currentPage = isLoadMore ? page + 1 : 1;
      const params = new URLSearchParams({ page: currentPage, limit: 10 });

      if (activeCategory !== "semua") {
        const cat = categories.find(c => c.name === activeCategory);
        if (cat) params.append("category_id", cat.id);
      }
      if (activeFilter === "selesai") params.append("status", "selesai");
      if (activeFilter === "diproses") params.append("status", "diproses");
      if (activeFilter === "trending") params.append("sort", "trending");
      if (activeFilter === "populer") params.append("sort", "populer");

      const res = await fetch(`${API_URL}/reports?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const dbReports = (data.data || []).map(r => ({
          ...r,
          user_initials: r.user_name ? r.user_name.substring(0, 2).toUpperCase() : "??",
          category: r.category_name,
          categoryConfig: categories.find(c => c.id === r.category_id) || categories[0] || {},
          time: new Date(r.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }),
          location: r.address || "Lokasi tidak diketahui",
        }));

        setFeed(prev => isLoadMore ? [...prev, ...dbReports] : dbReports);
        setHasMore(data.pagination.page < data.pagination.totalPages);
        if (isLoadMore) setPage(currentPage);
      }
    } catch (err) {
      console.error("Fetch reports error:", err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [token, activeCategory, activeFilter, page, categories]);

  // Refresh feed function
  const refreshFeed = useCallback(() => {
    setPage(1);
    setHasMore(true);
    fetchReports(false);
  }, [fetchReports]);

  useEffect(() => {
    setPage(1);
    setFeed([]);
    fetchReports(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeCategory, activeFilter, categories]);

  // Like handler
  const handleLike = async (id) => {
    if (!token) return;
    const report = feed.find(r => r.id === id);
    const method = report?.user_liked ? "DELETE" : "POST";

    const res = await fetch(`${API_URL}/reports/${id}/like`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setFeed(prev =>
        prev.map(r =>
          r.id === id
            ? {
                ...r,
                likes_count: r.user_liked ? r.likes_count - 1 : r.likes_count + 1,
                user_liked: !r.user_liked,
              }
            : r
        )
      );
    }
  };

  const handleBookmark = async (id) => {
    if (!token) return;
    const report = feed.find(r => r.id === id);
    const isBookmarked = report?.user_bookmarked;
    const method = isBookmarked ? "DELETE" : "POST";

    const res = await fetch(`${API_URL}/reports/${id}/bookmark`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setFeed(prev =>
        prev.map(r => (r.id === id ? { ...r, user_bookmarked: !r.user_bookmarked } : r))
      );
    }
  };

  const handleShare = (id) => {
    setFeed(prev =>
      prev.map(r => (r.id === id ? { ...r, shares_count: (r.shares_count || 0) + 1 } : r))
    );
    if (navigator.share) {
      navigator.share({ title: "KataWarga Report", url: `${window.location.origin}/homepageUser/laporan/${id}` });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Desktop Page Header */}
      <div className="hidden md:flex items-center justify-between px-5 py-3.5 bg-[#FFFBF5]/80 backdrop-blur-md sticky top-0 z-20 border-b border-[#E8E2D9]">
        <div>
          <h1 className="font-bold text-base text-[#111827]">Beranda</h1>
          <p className="text-[11px] text-[#6B6B8A]">
            {isLoading ? "Memuat..." : `${feed.length} laporan ditemukan`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshFeed}
            className="px-3 py-1.5 bg-[#F5F0E8] text-[#192126] hover:bg-[#E8E2D9] rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            title="Refresh feed"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={() => router.push("/homepageUser/buat-laporan")}
            className="px-3.5 py-1.5 bg-[#192126] text-white hover:bg-[#2b2e2f] rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-[#192126]/10"
          >
            <Plus size={14} />
            Buat Laporan
          </button>
        </div>
      </div>

      {/* Feed Filters */}
      <FeedFilters
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      {/* Main Content Area */}
      <div className="p-4 flex flex-col gap-4">
        {/* User's Own Reports Summary */}
        <MyReportSummary />

        {/* Quick Create Prompt */}
        <div
          onClick={() => router.push("/homepageUser/buat-laporan")}
          className="bg-white border border-[#E8E2D9] rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:border-[#192126]/40 hover:shadow-sm transition group"
        >
          <Avatar
            src={session?.user?.image}
            initials={session?.user?.name ? session.user.name.substring(0, 2).toUpperCase() : "??"}
            color="bg-[#192126]"
            size="w-10 h-10"
            textSize="text-sm"
          />
          <div className="flex-1 px-3 py-2 bg-[#FFFBF5] border border-[#E8E2D9] rounded-xl text-sm text-[#B0A898] group-hover:border-[#192126]/40 transition">
            Ada masalah di sekitar Anda? Laporkan sekarang...
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push("/homepageUser/buat-laporan");
            }}
            className="flex-shrink-0 px-4 py-2 bg-[#192126] text-white text-xs font-semibold rounded-xl hover:bg-[#2b2e2f] transition"
          >
            Lapor
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-[#192126] mb-2" size={32} />
            <p className="text-sm text-[#6B6B8A]">Memuat laporan...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && feed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F5F0E8] flex items-center justify-center mb-4">
              <Search size={24} className="text-[#B0A898]" />
            </div>
            <h3 className="font-semibold text-[#111827] mb-1">
              Tidak ada laporan ditemukan
            </h3>
            <p className="text-sm text-[#6B6B8A]">
              Coba pilih kategori yang berbeda atau jadilah yang pertama melapor!
            </p>
            <button
              onClick={() => router.push("/homepageUser/buat-laporan")}
              className="mt-4 px-5 py-2 bg-[#192126] text-white text-sm font-semibold rounded-xl hover:bg-[#2b2e2f] transition"
            >
              Buat Laporan Pertama
            </button>
          </div>
        )}

        {/* Feed of Report Cards */}
        {!isLoading && feed.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            onLike={handleLike}
            onBookmark={handleBookmark}
            onShare={handleShare}
            onDetailClick={(id) => setSelectedReportId(id)}
          />
        ))}

        {/* Load More Button */}
        {!isLoading && feed.length > 0 && hasMore && (
          <button
            onClick={() => fetchReports(true)}
            disabled={isLoadingMore}
            className="w-full py-3 bg-white border border-[#E8E2D9] rounded-2xl text-sm font-semibold text-[#6B6B8A] hover:bg-[#F5F0E8] hover:text-[#192126] hover:border-[#192126]/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoadingMore ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <ArrowRight size={15} />
            )}
            {isLoadingMore ? "Memuat..." : "Muat lebih banyak laporan"}
          </button>
        )}
      </div>

      {/* Detail Popup Modal */}
      {selectedReportId && (
        <ReportDetailModal
          reportId={selectedReportId}
          onClose={() => {
            setSelectedReportId(null);
            fetchReports(false);
          }}
        />
      )}
    </div>
  );
}
