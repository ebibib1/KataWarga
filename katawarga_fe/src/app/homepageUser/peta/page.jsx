"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useConfig } from "@/hooks/useConfig";
import { CATEGORY_ICONS, STATUS_ICONS } from "@/lib/configIcons";
import {
  ArrowRight,
  MapPin,
  Filter,
  BarChart3,
  X,
  Loader2,
  Navigation,
  RefreshCw,
  Target,
} from "lucide-react";
import ReportDetailModal from "@/components/modals/ReportDetailModal";

// Leaflet must be dynamically imported (SSR disabled)
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] bg-[#EDE7D9]/40 rounded-2xl flex flex-col items-center justify-center gap-2 text-xs font-bold text-[#6B6B8A]">
      <Loader2 size={24} className="animate-spin text-[#192126]" />
      Memuat peta interaktif...
    </div>
  ),
});

export default function PetaPage() {
  const { data: session } = useSession();
  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [statusFilter,   setStatusFilter]   = useState("Semua");
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const [allReports,      setAllReports]      = useState([]);
  const [isLoading,       setIsLoading]       = useState(true);
  const [selectedReportId, setSelectedReportId] = useState(null);

  const { config } = useConfig();
  const categories = config?.categories || [];
  const statuses = config?.statuses || {};

  // Register global showReportDetail function for Leaflet HTML popups
  useEffect(() => {
    window.showReportDetail = (id) => {
      setSelectedReportId(id);
    };
    return () => {
      delete window.showReportDetail;
    };
  }, []);

  // Fetch reports from API
  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        let dbReports = [];
        if (session?.accessToken) {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
          const res = await fetch(`${apiUrl}/reports?limit=100`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.data) {
              dbReports = data.data.map((r) => ({
                ...r,
                category: r.category_name,
                location: r.address || "Lokasi tidak diketahui",
                lat: parseFloat(r.latitude)  || null,
                lng: parseFloat(r.longitude) || null,
              }));
            }
          }
        }
        setAllReports(dbReports);
      } catch (e) {
        console.error("Fetch reports error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [session]);

  // Apply filters (only show markers with valid coordinates)
  const filteredMarkers = allReports.filter((r) => {
    if (r.lat === null || r.lng === null) return false;
    if (categoryFilter !== "Semua" && r.category !== categoryFilter) return false;
    if (statusFilter !== "Semua" && r.status !== statusFilter.toLowerCase()) return false;
    return true;
  });

  // Helper functions
  const getStatusStyle = (status) => statuses[status] || statuses.menunggu || {};
  const getCatIcon = (name) => CATEGORY_ICONS[name] || MapPin;
  const getCatColor = (name) => {
    const cat = categories.find((c) => c.name === name);
    return cat?.bg || "bg-blue-50 text-[#192126]";
  };

  // Stats calculation (only counting reports that aren't drafts)
  const stats = {
    total:    allReports.filter(r => r.status !== 'draft').length,
    menunggu: allReports.filter(r => r.status === "menunggu").length,
    diproses: allReports.filter(r => r.status === "diproses").length,
    selesai:  allReports.filter(r => r.status === "selesai").length,
  };

  const activeFilterCount = (categoryFilter !== "Semua" ? 1 : 0) + (statusFilter !== "Semua" ? 1 : 0);

  return (
    <div className="flex flex-col h-full bg-[#FFFBF5]">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between px-5 py-3.5 bg-[#FFFBF5]/80 backdrop-blur-md sticky top-0 z-20 border-b border-[#E8E2D9]">
        <div>
          <h1 className="font-bold text-base text-[#111827] flex items-center gap-2">
            <MapPin size={16} className="text-[#192126]" />
            Peta Laporan Interaktif
          </h1>
          <p className="text-[11px] text-[#6B6B8A]">
            Visualisasi spasial {filteredMarkers.length} laporan pengaduan warga
          </p>
        </div>
        <button
          onClick={() => setShowFilterPanel(!showFilterPanel)}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition ${
            activeFilterCount > 0
              ? "bg-[#192126] text-white border-[#192126]"
              : "bg-white border-[#E8E2D9] text-[#3D3D5C] hover:bg-[#F5F0E8]"
          }`}
        >
          <Filter size={13} />
          Filter
          {activeFilterCount > 0 && (
            <span className="bg-white text-[#192126] w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="p-3 md:p-5 flex flex-col gap-4 max-w-5xl mx-auto w-full flex-1">
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Total Laporan", val: stats.total,    bg: "bg-[#192126]" },
            { label: "Menunggu",      val: stats.menunggu, bg: "bg-amber-400" },
            { label: "Diproses",      val: stats.diproses, bg: "bg-blue-400" },
            { label: "Selesai",       val: stats.selesai,  bg: "bg-green-500" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm text-white`}>
              <span className="font-black text-lg leading-none">{s.val}</span>
              <span className="text-[10px] font-bold opacity-80 mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Filter Panel */}
        {showFilterPanel && (
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 text-xs">
            <div className="flex-1">
              <label className="block font-bold text-[#111827] mb-1.5">Kategori Masalah</label>
              <div className="flex flex-wrap gap-1.5">
                {["Semua", ...categories.map((c) => c.name)].map((cat) => {
                  const Icon = CATEGORY_ICONS[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => { setCategoryFilter(cat); setSelectedMarker(null); }}
                      className={`px-2.5 py-1.5 rounded-xl font-bold border transition flex items-center gap-1 ${
                        categoryFilter === cat
                          ? "bg-[#192126] text-white border-[#192126]"
                          : "bg-[#FFFBF5] text-[#3D3D5C] border-[#E8E2D9] hover:bg-[#F5F0E8]"
                      }`}
                    >
                      {Icon && <Icon size={11} />}
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="sm:w-48">
              <label className="block font-bold text-[#111827] mb-1.5">Status Laporan</label>
              <div className="flex flex-col gap-1">
                {["Semua", "Menunggu", "Diproses", "Selesai"].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setStatusFilter(s); setSelectedMarker(null); }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg font-bold border transition ${
                      statusFilter === s
                        ? "bg-[#192126] text-white border-[#192126]"
                        : "bg-[#FFFBF5] text-[#3D3D5C] border-[#E8E2D9] hover:bg-[#F5F0E8]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setCategoryFilter("Semua"); setStatusFilter("Semua"); setSelectedMarker(null); }}
                className="self-start text-[10px] font-bold text-red-500 hover:underline flex items-center gap-1 mt-5"
              >
                <X size={11} /> Reset Filter
              </button>
            )}
          </div>
        )}

        {/* Dynamic Legend */}
        <div className="bg-white border border-[#E8E2D9] rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] font-bold text-[#6B6B8A] items-center">
            <span className="text-[#111827] font-black text-xs mr-1">Legend:</span>
            {categories.map((cat) => (
              <span key={cat.id} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: cat.color }} />
                {cat.name}
              </span>
            ))}
            <span className="flex items-center gap-1 ml-auto text-[#192126]">
              <Target size={11} className="text-[#192126]" /> Lokasi Anda
            </span>
          </div>
        </div>

        {/* Map Component */}
        <div className="relative border border-[#E8E2D9] rounded-3xl overflow-hidden shadow-sm flex flex-col" style={{ height: "460px", zIndex: 0 }}>
          {isLoading ? (
            <div className="flex-1 bg-[#F5F0E8] flex flex-col items-center justify-center gap-2">
              <Loader2 size={28} className="animate-spin text-[#192126]" />
              <span className="text-xs font-semibold text-[#6B6B8A]">Menyiapkan peta &amp; data laporan...</span>
            </div>
          ) : (
            <MapComponent
              markers={filteredMarkers}
              onMarkerClick={(report) => setSelectedMarker(report)}
            />
          )}
        </div>

        {/* Selected Marker Detail Card */}
        {selectedMarker && (() => {
          const statusCfg = getStatusStyle(selectedMarker.status);
          const Icon     = getCatIcon(selectedMarker.category);
          return (
            <div className="bg-white border border-[#E8E2D9] rounded-3xl p-4 shadow-sm animate-in slide-in-from-bottom duration-200 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getCatColor(selectedMarker.category)}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#6B6B8A]">{selectedMarker.category}</span>
                    <h3 className="font-bold text-sm text-[#111827] leading-snug">{selectedMarker.title}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMarker(null)}
                  className="p-1.5 hover:bg-[#F5F0E8] rounded-lg text-[#B0A898] transition flex-shrink-0"
                >
                  <X size={15} />
                </button>
              </div>

              <p className="text-xs text-[#6B6B8A] leading-relaxed line-clamp-2">
                {selectedMarker.description}
              </p>

              <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-[#6B6B8A]">
                <span className="flex items-center gap-1">
                  <MapPin size={11} />
                  {selectedMarker.location || selectedMarker.address || "Lokasi tidak diketahui"}
                </span>
                <span className={`px-2 py-0.5 rounded-full border font-bold ${statusCfg.className || "bg-yellow-50 text-yellow-700"}`}>
                  {statusCfg.label}
                </span>
                {selectedMarker.priority && (
                  <span className={`px-2 py-0.5 rounded-full font-bold ${
                    selectedMarker.priority === "tinggi"
                      ? "bg-red-50 text-red-600 border border-red-200"
                      : selectedMarker.priority === "sedang"
                      ? "bg-orange-50 text-orange-600 border border-orange-200"
                      : "bg-slate-50 text-slate-500 border border-slate-200"
                  }`}>
                    Prioritas {selectedMarker.priority}
                  </span>
                )}
              </div>

              <button
                onClick={() => setSelectedReportId(selectedMarker.id)}
                className="w-full py-2.5 bg-[#192126] hover:bg-[#2b2e2f] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm shadow-[#192126]/20"
              >
                Lihat Detail Laporan
                <ArrowRight size={12} />
              </button>
            </div>
          );
        })()}

        {/* Map Markers List Panel */}
        {filteredMarkers.length > 0 && (
          <div className="bg-white border border-[#E8E2D9] rounded-3xl p-4 shadow-sm flex flex-col gap-3">
            <h2 className="font-bold text-sm text-[#111827] flex items-center gap-2">
              <BarChart3 size={15} className="text-[#192126]" />
              Daftar Laporan di Peta ({filteredMarkers.length})
            </h2>
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#E8E2D9]">
              {filteredMarkers.map((r) => {
                const statusCfg  = getStatusStyle(r.status);
                const Icon    = getCatIcon(r.category);
                const isSelected = selectedMarker?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedMarker(isSelected ? null : r)}
                    className={`w-full text-left p-3 rounded-2xl border flex items-center gap-3 transition ${
                      isSelected
                        ? "bg-[#FFFBF5] border-[#192126]/30"
                        : "bg-[#FFFBF5] border-[#F0EAE0] hover:border-[#192126]/20 hover:bg-white"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${getCatColor(r.category)}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#111827] truncate">{r.title}</p>
                      <p className="text-[10px] text-[#6B6B8A] flex items-center gap-1 mt-0.5">
                        <MapPin size={9} />
                        {r.location || r.address || "Tidak diketahui"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusCfg.className || "bg-yellow-50 border-yellow-200"}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Detailed Popup Modal */}
      {selectedReportId && (
        <ReportDetailModal
          reportId={selectedReportId}
          onClose={() => setSelectedReportId(null)}
        />
      )}
    </div>
  );
}
