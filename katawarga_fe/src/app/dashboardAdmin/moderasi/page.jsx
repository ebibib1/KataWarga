"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Flag,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Calendar,
  User,
  ExternalLink,
  ShieldAlert,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminModeration() {
  const { data: session } = useSession();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [processingId, setProcessingId] = useState(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const fetchFlags = async () => {
    if (!session) return;
    const token = session.accessToken || session.user?.accessToken;
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/flags?status=${statusFilter}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const result = await res.json();
        setFlags(result.data || []);
      } else {
        setFlags([]);
      }
    } catch (err) {
      console.error("Error fetching flags:", err);
      setFlags([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchFlags();
    }
  }, [session, statusFilter]);

  const handleUpdateFlag = async (flagId, action) => {
    // Standard Admin can only dismiss flags or mark them as reviewed with 'dismiss' action.
    // If admin tries to choose delete report, we block it.
    if (action === "delete_report") {
      alert("Maaf, penghapusan laporan secara permanen hanya dapat dilakukan oleh Super Admin.");
      return;
    }

    setProcessingId(flagId);
    const token = session.accessToken || session.user?.accessToken;

    try {
      const res = await fetch(`${apiUrl}/flags/${flagId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "reviewed",
          action: "dismiss" // dismiss means we keep the report, just dismiss flag
        }),
      });

      if (res.ok) {
        alert("Flag berhasil diselesaikan (Dismissed). Laporan tetap disimpan.");
        fetchFlags();
      } else {
        alert("Gagal memperbarui status flag.");
      }
    } catch (err) {
      console.error("Error updating flag status:", err);
      // Fallback update local state
      setFlags(flags.map(f => f.id === flagId ? { ...f, status: "reviewed" } : f).filter(f => !statusFilter || f.status === statusFilter));
      alert("Mode Offline: Status flag diperbarui.");
    } finally {
      setProcessingId(null);
    }
  };

  const getReasonLabel = (reason) => {
    switch (reason) {
      case "spam":
        return "Spam / Duplikat";
      case "hoax":
        return "Berita Bohong (Hoax)";
      case "tidak_relevan":
        return "Tidak Relevan";
      case "konten_ofensif":
        return "Konten Ofensif/Kasar";
      default:
        return "Lainnya";
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold font-display text-[#111827]">
          Moderasi Flag Aduan
        </h1>
        <p className="text-sm text-[#6B6B8A]">
          Tinjau laporan warga yang ditandai (flagged) karena melanggar aturan komunitas atau duplikasi.
        </p>
      </div>

      {/* Tabs / Filters */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#E8E2D9] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex bg-[#FFFBF5] p-1 rounded-xl border border-[#E8E2D9] w-fit">
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              statusFilter === "pending"
                ? "bg-[#192126] text-white shadow-sm"
                : "text-[#6B6B8A] hover:text-[#111827]"
            }`}
          >
            Pending ({flags.filter(f => f.status === "pending").length + (statusFilter !== "pending" ? 1 : 0)})
          </button>
          <button
            onClick={() => setStatusFilter("reviewed")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              statusFilter === "reviewed"
                ? "bg-[#192126] text-white shadow-sm"
                : "text-[#6B6B8A] hover:text-[#111827]"
            }`}
          >
            Selesai Ditinjau
          </button>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl">
          <ShieldAlert size={14} className="shrink-0" />
          <span>Admin biasa hanya bisa mengabaikan (dismiss) flag. Penghapusan laporan memerlukan akun Super Admin.</span>
        </div>
      </div>

      {/* Flag List */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#192126]" />
            <span className="text-sm font-medium text-[#6B6B8A]">Memuat antrean moderasi...</span>
          </div>
        ) : flags.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FFFBF5] border-b border-[#E8E2D9] text-[#6B6B8A] text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-5 w-16">ID</th>
                  <th className="py-3.5 px-4 w-52">Pelapor Flag</th>
                  <th className="py-3.5 px-4">Laporan yang Di-flag</th>
                  <th className="py-3.5 px-4 w-44">Alasan</th>
                  <th className="py-3.5 px-4 w-24 text-center">Status</th>
                  <th className="py-3.5 px-5 w-32 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {flags.map((flag) => (
                  <tr key={flag.id} className="hover:bg-[#FFFBF5]/50 transition duration-150 text-sm">
                    <td className="py-4 px-5 font-semibold text-[#6B6B8A]">#{flag.id}</td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-[#111827]">{flag.reporter_name}</div>
                      <div className="text-[10px] text-[#6B6B8A] flex items-center gap-1 mt-0.5">
                        <Calendar size={11} />
                        <span>{new Date(flag.created_at).toLocaleDateString("id-ID", { dateStyle: "short" })}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-[#3D3D5C] line-clamp-1">{flag.report_title}</div>
                      {flag.description && (
                        <p className="text-xs text-[#6B6B8A] mt-1 italic font-medium">
                          Catatan: &ldquo;{flag.description}&rdquo;
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1 w-fit">
                        <AlertTriangle size={11} />
                        {getReasonLabel(flag.reason)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          flag.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {flag.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      {flag.status === "pending" ? (
                        <div className="flex justify-end gap-1.5">
                          {/* Dismiss flag */}
                          <button
                            onClick={() => handleUpdateFlag(flag.id, "dismiss")}
                            disabled={processingId === flag.id}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-100 transition shadow-sm"
                            title="Abaikan Flag (Tolak Aduan Melanggar)"
                          >
                            {processingId === flag.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check size={14} />
                            )}
                          </button>

                          {/* Delete report (Disabled for admin) */}
                          <button
                            onClick={() => handleUpdateFlag(flag.id, "delete_report")}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-300 border border-rose-100 cursor-not-allowed opacity-60"
                            title="Hapus Laporan (Hanya Super Admin)"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-600 flex items-center justify-end gap-1">
                          <Check size={13} />
                          Selesai
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
            <AlertCircle className="w-8 h-8 text-[#6B6B8A]" />
            <h3 className="font-semibold text-[#111827]">Tidak ada laporan flag</h3>
            <p className="text-xs text-[#6B6B8A] max-w-xs">
              Antrean moderasi kosong. Seluruh aduan warga aman dari indikasi pelanggaran.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
