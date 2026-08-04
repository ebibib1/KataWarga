"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { Flag, X, Loader2 } from "lucide-react";
import { useConfig } from "@/hooks/useConfig";

export default function FlagModal({ reportId, onClose }) {
  const { data: session } = useSession();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { config } = useConfig();
  const flagReasons = config?.flagReasons || {};

  const token = session?.accessToken || session?.user?.accessToken;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const handleSubmit = async () => {
    if (!reason || !token) {
      alert("Anda harus login terlebih dahulu.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/reports/${reportId}/flag`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason, description: "Dilaporkan oleh warga via aplikasi." }),
      });
      if (res.ok) {
        alert("Laporan aduan berhasil dikirim ke moderator untuk ditinjau.");
        onClose();
      } else {
        const errData = await res.json();
        alert(errData.message || "Gagal mengirim laporan.");
      }
    } catch (err) {
      console.error("Flag report error:", err);
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flag size={16} className="text-red-500" />
            <h3 className="font-semibold text-[#111827] text-sm">
              Laporkan Konten
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#F5F0E8] text-[#6B6B8A] transition"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-[#6B6B8A] mb-4 leading-relaxed">
          Pilih alasan mengapa Anda melaporkan konten ini. Tim moderasi akan
          meninjau laporan Anda dalam 24 jam.
        </p>

        <div className="flex flex-col gap-2 mb-4">
          {Object.entries(flagReasons).map(([key, label]) => (
            <label
              key={key}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                reason === key
                  ? "border-red-300 bg-red-50"
                  : "border-[#E8E2D9] hover:bg-[#F5F0E8]"
              }`}
            >
              <input
                type="radio"
                name="flagReason"
                value={key}
                checked={reason === key}
                onChange={() => setReason(key)}
                className="accent-red-500"
              />
              <span className="text-xs font-medium text-[#111827]">
                {label}
              </span>
            </label>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#6B6B8A] hover:bg-[#F5F0E8] transition"
          >
            Batal
          </button>
          <button
            disabled={!reason || submitting}
            onClick={handleSubmit}
            className="flex-1 py-2 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600 transition disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            {submitting && <Loader2 size={12} className="animate-spin" />}
            Kirim Laporan
          </button>
        </div>
      </div>
    </div>
  );
}
