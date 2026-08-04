"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import { useConfig } from "@/hooks/useConfig";
import {
  FileText,
  Loader2,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2
} from "lucide-react";
import Link from "next/link";
import ReportCard from "@/components/feed/ReportCard";
import ReportDetailModal from "@/components/modals/ReportDetailModal";

export default function LaporanSayaPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("semua");
  const [myReports, setMyReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const user = session?.user;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const token  = session?.accessToken || session?.user?.accessToken;
  const { config } = useConfig();
  const categories = config?.categories || [];

  const fetchMyReports = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/reports?mine=true&limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setMyReports(data.data.map(r => ({
            ...r,
            user_initials: r.user_name ? r.user_name.substring(0, 2).toUpperCase() : "??",
            category: r.category_name,
            categoryConfig: categories.find(c => c.id === r.category_id) || categories[0] || {},
            time: new Date(r.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }),
            location: r.address || "Lokasi tidak diketahui",
          })));
        }
      }
    } catch (err) {
      console.error("Fetch my reports error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token, apiUrl, categories]);

  useEffect(() => {
    if (session) fetchMyReports();
  }, [session, fetchMyReports]);

  const handleLike = async (id) => {
    if (!token) return;
    const report = myReports.find(r => r.id === id);
    const method = report?.user_liked ? "DELETE" : "POST";
    const res = await fetch(`${apiUrl}/reports/${id}/like`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setMyReports(prev =>
        prev.map(r => r.id === id ? {
          ...r,
          likes_count: r.user_liked ? r.likes_count - 1 : r.likes_count + 1,
          user_liked: !r.user_liked
        } : r)
      );
    }
  };

  const handleBookmark = async (id) => {
    if (!token) return;
    const report = myReports.find(r => r.id === id);
    const res = await fetch(`${apiUrl}/reports/${id}/bookmark`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setMyReports(prev =>
        prev.map(r => r.id === id ? { ...r, user_bookmarked: !r.user_bookmarked } : r)
      );
    }
  };

  const handleShare = (id) => {
    setMyReports(prev =>
      prev.map(r => (r.id === id ? { ...r, shares_count: (r.shares_count || 0) + 1 } : r))
    );
    if (navigator.share) {
      navigator.share({ title: "KataWarga Report", url: `${window.location.origin}/homepageUser/laporan/${id}` });
    }
  };

  const handleDeleteDraft = async (id) => {
    if (!token) return;
    if (confirm("Apakah Anda yakin ingin menghapus draft ini?")) {
      try {
        const res = await fetch(`${apiUrl}/reports/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setMyReports(prev => prev.filter(r => r.id !== id));
        }
      } catch (err) {
        console.error("Delete draft error:", err);
      }
    }
  };

  const filteredReports = statusFilter === "semua"
    ? myReports
    : myReports.filter(r => r.status === statusFilter);

  return (
    <div className="flex flex-col min-h-full bg-[#FFFBF5]">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between px-5 py-3.5 bg-[#FFFBF5]/80 backdrop-blur-md sticky top-0 z-20 border-b border-[#E8E2D9]">
        <div>
          <h1 className="font-bold text-base text-[#111827]">Laporan Saya</h1>
          <p className="text-[11px] text-[#6B6B8A]">
            Daftar pengaduan yang telah Anda kirimkan ke platform
          </p>
        </div>

        <Link
          href="/homepageUser/buat-laporan"
          className="px-3.5 py-1.5 bg-[#192126] text-white hover:bg-[#2b2e2f] rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-[#192126]/10"
        >
          <Plus size={14} />
          Buat Laporan Baru
        </Link>
      </div>

      <div className="p-4 md:p-6 flex flex-col gap-4 max-w-2xl mx-auto w-full">
        {/* User Stats Card */}
        <div className="bg-white border border-[#E8E2D9] rounded-3xl p-5 flex items-center gap-4 shadow-sm">
          <Avatar
            src={user?.image}
            initials={user?.name ? user.name.substring(0, 2).toUpperCase() : "WG"}
            color="bg-[#192126]"
            size="w-12 h-12"
            textSize="text-sm"
          />
          <div>
            <h2 className="font-bold text-sm text-[#111827]">{user?.name || "Warga"}</h2>
            <p className="text-xs text-[#6B6B8A] mt-0.5">{user?.email || "@warga"}</p>
            <div className="flex gap-4 mt-2 text-[11px] font-semibold text-[#3D3D5C]">
              <span className="flex items-center gap-1.5"><FileText size={12} className="text-[#192126]" /> {myReports.filter(r => r.status !== 'draft').length} Laporan Dibuat</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-green-500" /> {myReports.filter(r => r.status === "selesai").length} Selesai</span>
            </div>
          </div>
        </div>

        {/* Status Filter Tab Group */}
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-1 shadow-sm flex text-xs overflow-x-auto scrollbar-none">
          {[
            { val: "semua", label: "Semua" },
            { val: "draft", label: "Draft" },
            { val: "menunggu", label: "Menunggu" },
            { val: "diproses", label: "Diproses" },
            { val: "selesai", label: "Selesai" },
          ].map((item) => (
            <button
              key={item.val}
              onClick={() => setStatusFilter(item.val)}
              className={`flex-1 py-2 px-3 font-bold rounded-xl transition whitespace-nowrap ${
                statusFilter === item.val
                  ? "bg-[#192126] text-white shadow-sm"
                  : "text-[#6B6B8A] hover:bg-[#F5F0E8] hover:text-[#111827]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Reports List */}
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-[#192126] mb-2" size={32} />
              <p className="text-sm text-[#6B6B8A]">Memuat laporan Anda...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="bg-white border border-[#E8E2D9] rounded-3xl p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#FFFBF5] border border-[#E8E2D9] flex items-center justify-center text-[#B0A898] mb-3">
                <FileText size={20} />
              </div>
              <h3 className="font-bold text-sm text-[#111827]">Tidak ada laporan ditemukan</h3>
              <p className="text-xs text-[#6B6B8A] mt-1">
                Silakan ganti filter atau kirim laporan pengaduan baru.
              </p>
            </div>
          ) : (
            filteredReports.map((report) => {
              if (report.status === "draft") {
                // Draft view card
                return (
                  <div
                    key={report.id}
                    className="bg-white border border-[#E8E2D9] rounded-2xl p-4 hover:border-[#192126]/20 transition shadow-sm flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between text-[10px] text-[#6B6B8A] font-semibold">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        Draft Laporan
                      </span>
                      <span>{report.time}</span>
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-[#111827]">{report.title || "Tanpa Judul"}</h4>
                    <p className="text-xs text-[#6B6B8A] line-clamp-2 leading-relaxed">
                      {report.description || "Draft kosong, klik edit untuk melengkapi."}
                    </p>
                    <div className="flex justify-end gap-2.5 pt-2 border-t border-[#FFFBF5]">
                      <button
                        onClick={() => handleDeleteDraft(report.id)}
                        className="px-3 py-1.5 text-[10px] text-red-500 hover:bg-red-50 font-bold rounded-xl transition flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        Hapus
                      </button>
                      <button
                        onClick={() => router.push(`/homepageUser/buat-laporan?draftId=${report.id}`)}
                        className="px-3.5 py-1.5 bg-[#192126] hover:bg-[#2b2e2f] text-white text-[10px] font-bold rounded-xl transition flex items-center gap-1 shadow-sm"
                      >
                        <Edit2 size={12} />
                        Lanjutkan Edit
                      </button>
                    </div>
                  </div>
                );
              }

              // Published ReportCard
              return (
                <ReportCard
                  key={report.id}
                  report={report}
                  onLike={handleLike}
                  onBookmark={handleBookmark}
                  onShare={handleShare}
                  onDetailClick={(id) => setSelectedReportId(id)}
                />
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
            fetchMyReports();
          }}
        />
      )}
    </div>
  );
}
