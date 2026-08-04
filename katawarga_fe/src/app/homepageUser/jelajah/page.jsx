"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import ReportCard from "@/components/feed/ReportCard";
import { useConfig } from "@/hooks/useConfig";
import dynamic from "next/dynamic";
import ReportDetailModal from "@/components/modals/ReportDetailModal";
import {
  Search,
  SlidersHorizontal,
  Flame,
  MapPin,
  Clock,
  ThumbsUp,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Inbox,
  LayoutGrid,
  List,
  RefreshCw,
  X,
  Map as MapIcon,
} from "lucide-react";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-[#F5F0E8] rounded-2xl flex items-center justify-center text-xs font-semibold text-[#6B6B8A]">
      Memuat peta...
    </div>
  ),
});


const SORT_OPTIONS = [
  { val: "Terbaru",                   label: "Terbaru"         },
  { val: "Paling Banyak Dibahas",     label: "Paling Dibahas"  },
  { val: "Paling Disukai",            label: "Paling Disukai"  },
  { val: "Paling Urgent (Prioritas Tinggi)", label: "Prioritas Tinggi" },
];

function JelajahContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [searchQuery,     setSearchQuery]     = useState("");
  const [debouncedQuery,  setDebouncedQuery]  = useState("");
  const [categoryFilter,  setCategoryFilter]  = useState("Semua Kategori");
  const [statusFilter,    setStatusFilter]    = useState("Semua Status");
  const [sortBy,          setSortBy]          = useState("Terbaru");
  const [showFilters,     setShowFilters]     = useState(false);
  const [showMapPicker,   setShowMapPicker]   = useState(false);
  const [mapSelectedReport, setMapSelectedReport] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState(null);

  const { config } = useConfig();
  const categories = config?.categories || [];

  const [reports,         setReports]         = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [isLoading,       setIsLoading]       = useState(true);
  const [isRefreshing,    setIsRefreshing]    = useState(false);
  const [trendingReports, setTrendingReports] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  // Debounce search query — wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch all reports
  const fetchReports = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      let dbReports = [];

      // Use 'search' param to match backend API contract
      const params = new URLSearchParams({ limit: 50 });
      if (debouncedQuery.trim()) {
        params.append("search", debouncedQuery.trim());
      }

      const token = session?.accessToken || session?.user?.accessToken;
      if (token) {
        const res = await fetch(`${apiUrl}/reports?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data) {
            dbReports = data.data.map((r) => ({
              ...r,
              user_initials:    r.user_name ? r.user_name.substring(0, 2).toUpperCase() : "??",
              category:         r.category_name,
              categoryConfig:   categories.find((c) => c.id === r.category_id) || categories[0] || {},
              time:             new Date(r.created_at).toLocaleString("id-ID", {
                                  dateStyle: "medium", timeStyle: "short",
                                }),
              location:         r.address || "Lokasi tidak diketahui",
            }));
          }
        }
      }

      setReports(dbReports);
    } catch (e) {
      console.error("Jelajah fetch error:", e);
      setReports([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchReports(); }, [session, debouncedQuery]);

  // Fetch trending reports from real API
  useEffect(() => {
    const fetchTrending = async () => {
      const token = session?.accessToken || session?.user?.accessToken;
      if (!token) { setTrendingLoading(false); return; }
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const res = await fetch(`${apiUrl}/reports/trending?limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setTrendingReports(data.data || []);
        }
      } catch (e) {
        console.error("Trending fetch error:", e);
      } finally {
        setTrendingLoading(false);
      }
    };
    fetchTrending();
  }, [session]);

  // Read URL search param
  useEffect(() => {
    const q = searchParams.get("q") || searchParams.get("search") || "";
    if (q) {
      setSearchQuery(q);
      setShowFilters(true);
    }
  }, [searchParams]);

  // Apply filters + sort
  useEffect(() => {
    let result = [...reports];

    // Local search filter (keyword, location, category)
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.location?.toLowerCase().includes(q) ||
          r.category?.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== "Semua Kategori") {
      result = result.filter((r) => r.category === categoryFilter);
    }

    if (statusFilter !== "Semua Status") {
      const mapping = { Menunggu: "menunggu", Diproses: "diproses", Selesai: "selesai", Ditolak: "ditolak" };
      result = result.filter((r) => r.status === mapping[statusFilter]);
    }

    if (mapSelectedReport) {
      result = result.filter((r) => r.id === mapSelectedReport.id);
    }

    if (sortBy === "Terbaru") {
      result.sort((a, b) => b.id - a.id);
    } else if (sortBy === "Paling Banyak Dibahas") {
      result.sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0));
    } else if (sortBy === "Paling Disukai") {
      result.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    } else if (sortBy === "Paling Urgent (Prioritas Tinggi)") {
      const score = (p) => (p === "tinggi" ? 3 : p === "sedang" ? 2 : 1);
      result.sort((a, b) => score(b.priority) - score(a.priority));
    }

    setFilteredReports(result);
  }, [reports, categoryFilter, statusFilter, sortBy, debouncedQuery, mapSelectedReport]);

  const handleLike = async (id) => {
    const token = session?.accessToken || session?.user?.accessToken;
    const report = reports.find(r => r.id === id);
    if (!token || !report) return;
    const method = report.user_liked ? "DELETE" : "POST";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    try {
      const res = await fetch(`${apiUrl}/reports/${id}/like`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setReports(prev => prev.map(r =>
          r.id === id
            ? { ...r, likes_count: r.user_liked ? r.likes_count - 1 : r.likes_count + 1, user_liked: !r.user_liked }
            : r
        ));
      }
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleBookmark = async (id) => {
    const token = session?.accessToken || session?.user?.accessToken;
    const report = reports.find(r => r.id === id);
    if (!token || !report) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    try {
      const res = await fetch(`${apiUrl}/reports/${id}/bookmark`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setReports(prev => prev.map(r =>
          r.id === id ? { ...r, user_bookmarked: !r.user_bookmarked } : r
        ));
      }
    } catch (err) {
      console.error("Bookmark error:", err);
    }
  };

  const handleShare = (id) => {
    setReports(prev =>
      prev.map(r => (r.id === id ? { ...r, shares_count: (r.shares_count || 0) + 1 } : r))
    );
    if (navigator.share) {
      navigator.share({ title: "KataWarga Report", url: `${window.location.origin}/homepageUser/laporan/${id}` });
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("Semua Kategori");
    setStatusFilter("Semua Status");
    setSortBy("Terbaru");
    setMapSelectedReport(null);
  };

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    (categoryFilter !== "Semua Kategori" ? 1 : 0) +
    (statusFilter !== "Semua Status" ? 1 : 0) +
    (mapSelectedReport ? 1 : 0);

  return (
    <div className="flex flex-col h-full bg-[#FFFBF5]">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between px-5 py-3.5 bg-[#FFFBF5]/80 backdrop-blur-md sticky top-0 z-20 border-b border-[#E8E2D9]">
        <div>
          <h1 className="font-bold text-base text-[#111827]">Jelajahi Laporan</h1>
          <p className="text-[11px] text-[#6B6B8A]">
            {isLoading ? "Memuat..." : `${filteredReports.length} laporan ditemukan`}
          </p>
        </div>
        <button
          onClick={() => fetchReports(true)}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-[#E8E2D9] rounded-xl text-[#3D3D5C] hover:bg-[#F5F0E8] transition"
        >
          <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
          Segarkan
        </button>
      </div>

      <div className="p-4 md:p-6 flex flex-col gap-4 max-w-3xl mx-auto w-full">

        {/* Search + Filter Bar */}
        <div className="bg-white border border-[#E8E2D9] rounded-3xl p-4 shadow-sm flex flex-col gap-3">
          {/* Search row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B0A898]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kata kunci, lokasi, kategori..."
                className="w-full pl-10 pr-4 py-3 bg-[#FFFBF5] border border-[#E8E2D9] rounded-xl text-sm text-[#111827] placeholder-[#B0A898] focus:outline-none focus:border-[#192126] focus:ring-2 focus:ring-[#192126]/10 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B0A898] hover:text-[#111827]"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowMapPicker(!showMapPicker)}
              className={`p-3 border rounded-xl transition flex items-center justify-center gap-1.5 text-xs font-bold ${
                showMapPicker
                  ? "bg-[#192126] text-white border-[#192126]"
                  : "bg-white text-[#3D3D5C] border-[#E8E2D9] hover:bg-[#F5F0E8]"
              }`}
              title="Cari berdasarkan lokasi di peta"
            >
              <MapIcon size={16} />
              <span className="hidden sm:inline">Peta</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative p-3 border rounded-xl transition flex items-center justify-center gap-1.5 text-xs font-bold ${
                showFilters || activeFilterCount > 0
                  ? "bg-[#192126] text-white border-[#192126]"
                  : "bg-white text-[#3D3D5C] border-[#E8E2D9] hover:bg-[#F5F0E8]"
              }`}
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-[#192126] text-[9px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Map Picker Panel */}
          {showMapPicker && (
            <div className="pt-3 border-t border-[#F5F0E8] flex flex-col gap-2">
              <p className="text-[11px] font-bold text-[#6B6B8A] mb-1">
                Klik pin laporan di peta untuk memfilter laporan tersebut:
              </p>
              <div className="h-64 w-full rounded-xl overflow-hidden border border-[#E8E2D9]">
                <MapComponent
                  markers={reports}
                  onMarkerClick={(report) => setMapSelectedReport(report)}
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowMapPicker(false)}
                  className="text-[10px] font-bold text-[#192126] hover:underline"
                >
                  Tutup Peta
                </button>
              </div>
            </div>
          )}

          {/* Map Selection Badge */}
          {mapSelectedReport && (
            <div className="pt-2 border-t border-[#F5F0E8] flex items-center justify-between text-xs font-semibold text-[#192126]">
              <span className="truncate">Terfilter oleh marker peta: "{mapSelectedReport.title}"</span>
              <button 
                onClick={() => setMapSelectedReport(null)} 
                className="text-red-500 font-bold hover:underline shrink-0 ml-2"
              >
                Bersihkan Filter Peta
              </button>
            </div>
          )}

          {/* Filter panel */}
          {showFilters && (
            <div className="pt-3 border-t border-[#F5F0E8] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-[#111827] mb-1">Kategori</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full p-2.5 bg-[#FFFBF5] border border-[#E8E2D9] rounded-lg text-[#3D3D5C] focus:outline-none"
                >
                  <option>Semua Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-[#111827] mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2.5 bg-[#FFFBF5] border border-[#E8E2D9] rounded-lg text-[#3D3D5C] focus:outline-none"
                >
                  <option>Semua Status</option>
                  <option>Menunggu</option>
                  <option>Diproses</option>
                  <option>Selesai</option>
                  <option>Ditolak</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-[#111827] mb-1">Urutkan</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2.5 bg-[#FFFBF5] border border-[#E8E2D9] rounded-lg text-[#3D3D5C] focus:outline-none"
                >
                  {SORT_OPTIONS.map((s) => (
                    <option key={s.val} value={s.val}>{s.label}</option>
                  ))}
                </select>
              </div>
              {activeFilterCount > 0 && (
                <div className="sm:col-span-3 flex justify-end">
                  <button
                    onClick={resetFilters}
                    className="text-[10px] font-bold text-red-500 hover:underline flex items-center gap-1"
                  >
                    <X size={10} /> Reset semua filter
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Category quick-filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {["Semua Kategori", ...categories.map((c) => c.name)].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`flex-shrink-0 px-3 py-1.5 text-xs font-bold rounded-full border transition ${
                categoryFilter === cat
                  ? "bg-[#192126] text-white border-[#192126]"
                  : "bg-white text-[#3D3D5C] border-[#E8E2D9] hover:bg-[#F5F0E8]"
              }`}
            >
              {cat === "Semua Kategori" ? "Semua" : cat}
            </button>
          ))}
        </div>

        {/* Results count */}
        {!isLoading && (
          <div className="flex items-center justify-between text-xs text-[#6B6B8A] font-semibold px-1">
            <span>
              Menampilkan{" "}
              <strong className="text-[#111827]">{filteredReports.length}</strong> dari{" "}
              {reports.length} laporan
            </span>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="text-[#192126] hover:underline flex items-center gap-1">
                <X size={11} /> Reset
              </button>
            )}
          </div>
        )}

        {/* Report List */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-[#E8E2D9] rounded-3xl p-5 animate-pulse">
                <div className="h-3 bg-[#F0EAE0] rounded w-24 mb-3" />
                <div className="h-4 bg-[#F0EAE0] rounded w-3/4 mb-2" />
                <div className="h-3 bg-[#F0EAE0] rounded w-full mb-1" />
                <div className="h-3 bg-[#F0EAE0] rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-white border border-[#E8E2D9] rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
            <Inbox className="text-[#D1CEC8]" size={36} />
            <div>
              <h3 className="font-bold text-sm text-[#111827]">Tidak ada laporan ditemukan</h3>
              <p className="text-xs text-[#6B6B8A] mt-1">
                {activeFilterCount > 0 ? "Coba ubah kata kunci atau filter." : "Belum ada laporan yang tersedia."}
              </p>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-[#192126] text-white text-xs font-bold rounded-xl hover:bg-[#2b2e2f] transition"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onLike={handleLike}
                onBookmark={handleBookmark}
                onShare={handleShare}
                onDetailClick={(id) => setSelectedReportId(id)}
              />
            ))}
          </div>
        )}

        {/* Trending section — shown when not filtering, uses real API data */}
        {!searchQuery && categoryFilter === "Semua Kategori" && statusFilter === "Semua Status" && (
          <div className="bg-white border border-[#E8E2D9] rounded-3xl p-5 shadow-sm mt-1">
            <h2 className="font-bold text-sm text-[#111827] flex items-center gap-2 mb-4">
              <Flame className="text-orange-500" size={16} />
              Laporan Sedang Trending
            </h2>
            {trendingLoading ? (
              <div className="flex flex-col gap-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-16 bg-[#F5F0E8] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : trendingReports.length === 0 ? (
              <p className="text-xs text-[#B0A898] text-center py-4">Belum ada laporan trending minggu ini.</p>
            ) : (
              <div className="flex flex-col gap-3.5">
                {trendingReports.map((rep) => (
                  <div
                    key={rep.id}
                    onClick={() => router.push(`/homepageUser/laporan/${rep.id}`)}
                    className="pb-3.5 border-b border-[#F5F0E8] last:pb-0 last:border-0 cursor-pointer group"
                  >
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#192126] border border-blue-100">
                      {rep.category_name || "Laporan"}
                    </span>
                    <h3 className="font-bold text-sm text-[#111827] mt-1.5 group-hover:text-[#192126] transition leading-snug">
                      {rep.title}
                    </h3>
                    <div className="flex items-center justify-between text-[11px] text-[#6B6B8A] mt-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><ThumbsUp size={11} /> {rep.likes_count || 0}</span>
                        <span className="flex items-center gap-1"><MessageSquare size={11} /> {rep.comments_count || 0}</span>
                      </div>
                      <span className="font-semibold text-orange-600 flex items-center gap-1">
                        <TrendingUp size={11} /> Trending
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Detail Popup Modal */}
        {selectedReportId && (
          <ReportDetailModal
            reportId={selectedReportId}
            onClose={() => {
              setSelectedReportId(null);
              fetchReports(true);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function JelajahPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 bg-[#FFFBF5] flex items-center justify-center text-xs font-semibold text-[#6B6B8A] py-12">
          Memuat halaman jelajah...
        </div>
      }
    >
      <JelajahContent />
    </Suspense>
  );
}
