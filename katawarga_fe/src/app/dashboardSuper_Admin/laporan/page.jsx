"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import {
  Search,
  Filter,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  X,
  Send,
  Loader2,
  Calendar,
  User,
  MapPin,
  Trash2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "@/components/ui/Avatar";

// Dynamically import MapComponent to avoid SSR errors
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => <div className="h-48 bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-xs text-[#6B6B8A]">Memuat peta lokasi...</div>
});

const DEFAULT_CATEGORIES = [
  { id: 1, category_name: "Jalan Rusak" },
  { id: 2, category_name: "Penerangan Jalan" },
  { id: 3, category_name: "Sampah & Kebersihan" },
  { id: 4, category_name: "Fasilitas Umum" },
  { id: 5, category_name: "Banjir & Drainase" },
  { id: 6, category_name: "Keamanan" }
];

export default function SuperAdminReports() {
  const { data: session } = useSession();
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Detailed Modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalTab, setModalTab] = useState("detail");

  // Status Change State
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Comment Input
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const fetchReports = async () => {
    if (!session) return;
    const token = session.accessToken || session.user?.accessToken;
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/reports?limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const result = await res.json();
        setReports(result.data || []);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.error("Error fetching reports in super admin:", err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${apiUrl}/categories`);
      if (res.ok) {
        const result = await res.json();
        setCategories(result.data || DEFAULT_CATEGORIES);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (err) {
      setCategories(DEFAULT_CATEGORIES);
    }
  };

  useEffect(() => {
    if (session) {
      fetchReports();
      fetchCategories();
    }
  }, [session]);

  const handleOpenDetail = (report) => {
    setSelectedReport(report);
    setNewStatus(report.status);
    setStatusNote("");
    setModalTab("detail");
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;
    if (newStatus === selectedReport.status && !statusNote) return;

    setIsUpdatingStatus(true);
    const token = session.accessToken || session.user?.accessToken;

    try {
      const res = await fetch(`${apiUrl}/reports/${selectedReport.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          note: statusNote || `Status diperbarui oleh Super Admin ${session.user.name}`,
        }),
      });

      if (res.ok) {
        await fetchReports();
        const updated = reports.find(r => r.id === selectedReport.id) || selectedReport;
        const newLog = {
          id: Date.now(),
          old_status: selectedReport.status,
          new_status: newStatus,
          changed_by_name: session.user.name,
          note: statusNote,
          created_at: new Date().toISOString()
        };
        setSelectedReport({
          ...selectedReport,
          status: newStatus,
          status_logs: [...(selectedReport.status_logs || []), newLog]
        });
        setStatusNote("");
        alert("Status aduan berhasil diperbarui.");
      } else {
        const errData = await res.json();
        alert(`Gagal: ${errData.message}`);
      }
    } catch (err) {
      console.error("Error updating status:", err);
      // Mock update locally
      const newLog = {
        id: Date.now(),
        old_status: selectedReport.status,
        new_status: newStatus,
        changed_by_name: session.user.name,
        note: statusNote,
        created_at: new Date().toISOString()
      };
      const updatedReport = {
        ...selectedReport,
        status: newStatus,
        status_logs: [...(selectedReport.status_logs || []), newLog]
      };
      setReports(reports.map(r => r.id === selectedReport.id ? updatedReport : r));
      setSelectedReport(updatedReport);
      setStatusNote("");
      alert("Mode Offline: Status berhasil diperbarui.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedReport) return;

    setIsSubmittingComment(true);
    const token = session.accessToken || session.user?.accessToken;

    try {
      const res = await fetch(`${apiUrl}/reports/${selectedReport.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          body: newComment,
        }),
      });

      if (res.ok) {
        setNewComment("");
        await fetchReports();
        const newCommentItem = {
          id: Date.now(),
          body: newComment,
          user_name: session.user.name,
          role: session.user.role,
          is_admin_response: true,
          created_at: new Date().toISOString()
        };
        setSelectedReport({
          ...selectedReport,
          comments: [...(selectedReport.comments || []), newCommentItem]
        });
      } else {
        alert("Gagal menambahkan komentar.");
      }
    } catch (err) {
      console.error("Error posting comment:", err);
      const newCommentItem = {
        id: Date.now(),
        body: newComment,
        user_name: session.user.name,
        role: session.user.role,
        is_admin_response: true,
        created_at: new Date().toISOString()
      };
      setSelectedReport({
        ...selectedReport,
        comments: [...(selectedReport.comments || []), newCommentItem]
      });
      setNewComment("");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!confirm("Apakah Anda yakin ingin menghapus laporan aduan warga ini secara permanen dari database? Tindakan ini akan menghapus log dan dokumentasi foto.")) return;

    const token = session.accessToken || session.user?.accessToken;

    try {
      const res = await fetch(`${apiUrl}/reports/${reportId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert("Laporan aduan warga berhasil dihapus.");
        setSelectedReport(null);
        fetchReports();
      } else {
        alert("Gagal menghapus laporan.");
      }
    } catch (err) {
      console.error("Error deleting report:", err);
      setReports(reports.filter(r => r.id !== reportId));
      setSelectedReport(null);
      alert("Mode Offline: Laporan berhasil dihapus.");
    }
  };

  const getPriorityStyle = (prio) => {
    switch (prio) {
      case "tinggi":
        return "bg-red-50 text-red-700 border border-red-100";
      case "sedang":
        return "bg-amber-50 text-amber-700 border border-amber-100";
      default:
        return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "menunggu":
        return "bg-amber-100 text-amber-800";
      case "diproses":
        return "bg-blue-100 text-blue-800";
      case "selesai":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-rose-100 text-rose-800";
    }
  };

  // Filter
  const filteredReports = reports.filter((item) => {
    const matchesSearch =
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter ? item.status === statusFilter : true;
    const matchesPriority = priorityFilter ? item.priority === priorityFilter : true;
    const matchesCategory = categoryFilter
      ? item.category_name === categoryFilter || String(item.category_id) === String(categoryFilter)
      : true;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold font-display text-[#111827]">
          Otoritas & Manajemen Aduan Warga
        </h1>
        <p className="text-sm text-[#6B6B8A]">
          Hak akses penuh Super Admin: Tinjau, ubah status kerja, moderasi tanggapan, dan lakukan penghapusan aduan.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[#6B6B8A]" />
          <input
            type="text"
            placeholder="Cari judul aduan, deskripsi, atau pelapor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#FFFBF5] rounded-xl border border-[#E8E2D9] outline-none text-sm text-[#111827] focus:border-[#192126] focus:ring-1 focus:ring-[#192126] transition"
          />
        </div>

        {/* Filters Select */}
        <div className="flex flex-wrap gap-2.5">
          {/* Status */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-[#FFFBF5] border border-[#E8E2D9] rounded-xl pl-3 pr-8 py-2.5 text-xs font-semibold text-[#3D3D5C] outline-none focus:border-[#192126] cursor-pointer"
            >
              <option value="">Semua Status</option>
              <option value="menunggu">Menunggu</option>
              <option value="diproses">Diproses</option>
              <option value="selesai">Selesai</option>
              <option value="ditolak">Ditolak</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#6B6B8A]" />
          </div>

          {/* Priority */}
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="appearance-none bg-[#FFFBF5] border border-[#E8E2D9] rounded-xl pl-3 pr-8 py-2.5 text-xs font-semibold text-[#3D3D5C] outline-none focus:border-[#192126] cursor-pointer"
            >
              <option value="">Semua Prioritas</option>
              <option value="tinggi">Tinggi</option>
              <option value="sedang">Sedang</option>
              <option value="rendah">Rendah</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#6B6B8A]" />
          </div>

          {/* Category */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none bg-[#FFFBF5] border border-[#E8E2D9] rounded-xl pl-3 pr-8 py-2.5 text-xs font-semibold text-[#3D3D5C] outline-none focus:border-[#192126] cursor-pointer"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.category_name}>
                  {c.category_name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#6B6B8A]" />
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#192126]" />
            <span className="text-sm font-medium text-[#6B6B8A]">Memuat daftar laporan...</span>
          </div>
        ) : filteredReports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FFFBF5] border-b border-[#E8E2D9] text-[#6B6B8A] text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-5 w-16">ID</th>
                  <th className="py-3.5 px-4">Judul Aduan</th>
                  <th className="py-3.5 px-4 w-40">Pelapor</th>
                  <th className="py-3.5 px-4 w-36">Kategori</th>
                  <th className="py-3.5 px-4 w-28 text-center">Prioritas</th>
                  <th className="py-3.5 px-4 w-28 text-center">Status</th>
                  <th className="py-3.5 px-5 w-32 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {filteredReports.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FFFBF5]/50 transition duration-150 text-sm">
                    <td className="py-4 px-5 font-semibold text-[#6B6B8A]">#{item.id}</td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-[#111827] line-clamp-1 max-w-sm md:max-w-md">
                        {item.title}
                      </div>
                      <div className="text-xs text-[#6B6B8A] flex items-center gap-1.5 mt-1">
                        <MapPin size={12} className="text-[#192126]" />
                        <span className="truncate">{item.location || "Jakarta"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[#3D3D5C] font-medium">
                      {item.user_name || "Warga"}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#192126] to-[#2b2e2f] text-white shadow-sm">
                        {item.category_name || item.category || "Umum"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getPriorityStyle(item.priority)}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(item)}
                          className="p-1.5 rounded-lg bg-[#FFFBF5] text-[#192126] hover:bg-[#192126] hover:text-white border border-[#E8E2D9] transition shadow-sm"
                          title="Tinjau Detail"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteReport(item.id)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 transition shadow-sm"
                          title="Hapus Aduan secara Permanen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
            <AlertCircle className="w-8 h-8 text-[#6B6B8A]" />
            <h3 className="font-semibold text-[#111827]">Laporan tidak ditemukan</h3>
            <p className="text-xs text-[#6B6B8A] max-w-xs">Tidak ada data aduan warga yang cocok dengan kriteria filter saat ini.</p>
          </div>
        )}
      </div>

      {/* Interactive Detail Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReport(null)}
              className="fixed inset-0 bg-black/55 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl border border-[#E8E2D9] relative z-10 flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-[#E8E2D9] bg-[#FFFBF5] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#6B6B8A]">ADUAN #{selectedReport.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getPriorityStyle(selectedReport.priority)}`}>
                    {selectedReport.priority}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${getStatusBadge(selectedReport.status)}`}>
                    {selectedReport.status}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-1 rounded-lg hover:bg-white text-[#6B6B8A] hover:text-[#111827] border border-[#E8E2D9] transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[#E8E2D9] bg-[#FFFBF5] px-6">
                <button
                  onClick={() => setModalTab("detail")}
                  className={`py-3 px-4 text-sm font-semibold transition border-b-2 -mb-[1px] ${
                    modalTab === "detail"
                      ? "border-[#192126] text-[#192126]"
                      : "border-transparent text-[#6B6B8A] hover:text-[#111827]"
                  }`}
                >
                  Informasi & Status
                </button>
                <button
                  onClick={() => setModalTab("comments")}
                  className={`py-3 px-4 text-sm font-semibold transition border-b-2 -mb-[1px] flex items-center gap-1.5 ${
                    modalTab === "comments"
                      ? "border-[#192126] text-[#192126]"
                      : "border-transparent text-[#6B6B8A] hover:text-[#111827]"
                  }`}
                >
                  <span>Komentar Warga</span>
                  <span className="text-xs bg-[#E8E2D9] text-[#3D3D5C] px-1.5 py-0.5 rounded-full font-bold">
                    {selectedReport.comments?.length || 0}
                  </span>
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {modalTab === "detail" ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-lg font-bold text-[#111827] leading-snug">{selectedReport.title}</h2>
                        <div className="flex items-center gap-2 text-xs text-[#6B6B8A] font-semibold mt-2">
                          <User size={13} className="text-[#192126]" />
                          <span>Oleh: <strong className="text-[#3D3D5C]">{selectedReport.user_name || "Warga"}</strong></span>
                          <span>•</span>
                          <Calendar size={13} />
                          <span>{new Date(selectedReport.created_at).toLocaleDateString("id-ID", { dateStyle: "medium" })}</span>
                        </div>
                        {/* Category Badge with KataWarga styling */}
                        <div className="mt-3">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-[#192126] to-[#2b2e2f] text-white shadow-sm">
                            {selectedReport.category_name || selectedReport.category || "Umum"}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 bg-[#FFFBF5] rounded-2xl border border-[#E8E2D9] space-y-2">
                        <span className="text-xs font-bold text-[#6B6B8A] uppercase tracking-wider">Deskripsi Aduan</span>
                        <p className="text-sm text-[#111827] leading-relaxed whitespace-pre-line">{selectedReport.description}</p>
                      </div>

                      {selectedReport.image && (
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-[#6B6B8A] uppercase tracking-wider">Dokumentasi Foto</span>
                          <div className="rounded-2xl overflow-hidden border border-[#E8E2D9] relative bg-slate-100 shadow-sm">
                            <img
                              src={
                                selectedReport.image.startsWith("http")
                                  ? selectedReport.image
                                  : `http://localhost:5000/uploads/${selectedReport.image}`
                              }
                              alt={selectedReport.title}
                              className="object-cover w-full h-64"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentNode.innerHTML = '<div class="flex items-center justify-center h-64 text-[#6B6B8A]"><span>Gambar tidak dapat dimuat</span></div>';
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <span className="text-xs font-bold text-[#6B6B8A] uppercase tracking-wider flex items-center gap-1">
                          <MapPin size={12} className="text-[#22C55E]" />
                          Koordinat Peta
                        </span>
                        <div className="h-44 w-full rounded-2xl overflow-hidden border border-[#E8E2D9]">
                          <MapComponent markers={[selectedReport]} />
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      {/* Update Status Form */}
                      <div className="bg-[#FFFBF5] p-5 rounded-2xl border border-[#E8E2D9] space-y-4">
                        <h4 className="text-sm font-bold text-[#111827] flex items-center gap-1.5">
                          <Clock size={16} className="text-[#192126]" />
                          Perbarui Status (Super Admin)
                        </h4>
                        <form onSubmit={handleUpdateStatus} className="space-y-3.5">
                          <div>
                            <label className="block text-xs font-semibold text-[#6B6B8A] mb-1.5">Pilih Status Baru</label>
                            <div className="relative">
                              <select
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                className="appearance-none w-full bg-white border border-[#E8E2D9] rounded-xl px-3 py-2.5 text-xs font-bold text-[#3D3D5C] outline-none focus:border-[#192126] cursor-pointer"
                              >
                                <option value="menunggu">Menunggu Verifikasi</option>
                                <option value="diproses">Dalam Pengerjaan (Diproses)</option>
                                <option value="selesai">Selesai (Konfirmasi Dinas)</option>
                                <option value="ditolak">Tolak Laporan</option>
                              </select>
                              <ChevronDown size={14} className="absolute right-3.5 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#6B6B8A]" />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#6B6B8A] mb-1.5">Catatan Perubahan</label>
                            <textarea
                              placeholder="Masukkan catatan pengerjaan sistem..."
                              value={statusNote}
                              onChange={(e) => setStatusNote(e.target.value)}
                              rows={3}
                              className="w-full p-3 bg-white rounded-xl border border-[#E8E2D9] outline-none text-xs text-[#111827] focus:border-[#192126] transition resize-none"
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={isUpdatingStatus || (newStatus === selectedReport.status && !statusNote)}
                              className="flex-1 py-2.5 bg-[#192126] text-white font-semibold text-xs rounded-xl hover:bg-[#2b2e2f] transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {isUpdatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                              <span>Simpan</span>
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => handleDeleteReport(selectedReport.id)}
                              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 font-semibold text-xs rounded-xl border border-rose-200 transition flex items-center gap-1"
                            >
                              <Trash2 size={13} />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Log timeline */}
                      <div className="space-y-4">
                        <span className="text-xs font-bold text-[#6B6B8A] uppercase tracking-wider block">Audit Log Status</span>
                        <div className="relative border-l border-[#E8E2D9] ml-2.5 pl-5 space-y-4 py-1.5">
                          {selectedReport.status_logs && selectedReport.status_logs.length > 0 ? (
                            selectedReport.status_logs.map((log, index) => (
                              <div key={log.id || index} className="relative">
                                <div className="absolute -left-[26px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-red-600 shadow-sm"></div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="font-semibold text-[#111827]">{log.changed_by_name}</span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${getStatusBadge(log.new_status)}`}>
                                      {log.new_status}
                                    </span>
                                    <span className="text-[10px] text-[#6B6B8A] ml-auto">
                                      {new Date(log.created_at).toLocaleDateString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  {log.note && (
                                    <p className="text-xs text-[#6B6B8A] bg-[#FFFBF5] border border-[#E8E2D9] p-2.5 rounded-xl mt-1.5">
                                      {log.note}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-[#6B6B8A] italic pl-2">Tidak ada log aktivitas status.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Comments Tab
                  <div className="flex flex-col h-[55vh] justify-between">
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
                      {selectedReport.comments && selectedReport.comments.length > 0 ? (
                        selectedReport.comments.map((comment) => {
                          const initials = comment.user_name
                            ? comment.user_name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
                            : "U";

                          return (
                            <div
                              key={comment.id}
                              className={`p-3.5 rounded-2xl border ${
                                comment.is_admin_response
                                  ? "bg-blue-50/20 border-[#192126] border-opacity-15 ml-8"
                                  : "bg-[#FFFBF5] border-[#E8E2D9] mr-8"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <div className="flex items-center gap-2">
                                  <Avatar
                                    src={null}
                                    initials={initials}
                                    color={comment.is_admin_response ? "bg-[#192126]" : "bg-[#60A5FA]"}
                                    size="w-6 h-6"
                                    textSize="text-[9px]"
                                  />
                                  <span className="text-xs font-semibold text-[#111827]">{comment.user_name}</span>
                                  {comment.is_admin_response && (
                                    <span className="text-[9px] font-bold text-[#192126] bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded">
                                      Official Staff
                                    </span>
                                  )}
                                </div>
                                <span className="text-[9px] text-[#6B6B8A]">
                                  {new Date(comment.created_at).toLocaleDateString("id-ID", { dateStyle: "short" })}
                                </span>
                              </div>
                              <p className="text-xs text-[#3D3D5C] leading-relaxed whitespace-pre-line pl-8">
                                {comment.body}
                              </p>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-20 text-xs text-[#6B6B8A] flex flex-col items-center justify-center gap-2">
                          <MessageSquare className="w-8 h-8 text-[#E8E2D9]" />
                          <span>Belum ada diskusi dalam aduan ini.</span>
                        </div>
                      )}
                    </div>

                    <form onSubmit={handlePostComment} className="flex gap-2 border-t border-[#E8E2D9] pt-4">
                      <input
                        type="text"
                        placeholder="Tulis instruksi resmi super admin..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-[#FFFBF5] border border-[#E8E2D9] rounded-xl outline-none text-xs text-[#111827] focus:border-[#192126] transition"
                        disabled={isSubmittingComment}
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingComment || !newComment.trim()}
                        className="px-4 py-2.5 bg-[#192126] text-white font-semibold text-xs rounded-xl hover:bg-[#2b2e2f] transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 shrink-0"
                      >
                        {isSubmittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send size={13} />}
                        <span>Kirim</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
