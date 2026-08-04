"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Settings,
  Lock,
  User,
  Shield,
  Eye,
  EyeOff,
  Loader2,
  Check,
  AlertCircle
} from "lucide-react";

export default function SuperAdminSettings() {
  const { data: session } = useSession();

  // Change password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      alert("Password baru dan konfirmasi password tidak cocok.");
      return;
    }

    if (newPassword.length < 8) {
      alert("Password baru minimal harus terdiri dari 8 karakter.");
      return;
    }

    setIsSubmitting(true);
    // Simulate changing password
    setTimeout(() => {
      setIsSubmitting(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      alert("Kata sandi Super Admin berhasil diperbarui.");
    }, 1200);
  };

  if (!session) return null;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold font-display text-[#111827]">
          Pengaturan Akun Super Admin
        </h1>
        <p className="text-sm text-[#6B6B8A]">
          Kelola kredensial pengaman utama root, pantau status sesi, dan audit hak akses penuh.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card (Left - Column 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Super Admin Info */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#111827] flex items-center gap-1.5 pb-2 border-b border-[#E8E2D9]">
              <User size={16} className="text-red-600" />
              Informasi Super Admin (Root)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="block text-[10px] font-bold text-[#6B6B8A] uppercase tracking-wider">Nama Lengkap</span>
                <span className="text-sm font-semibold text-[#111827] block mt-1">{session.user.name}</span>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-[#6B6B8A] uppercase tracking-wider">Alamat Email</span>
                <span className="text-sm font-semibold text-[#111827] block mt-1">{session.user.email}</span>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-[#6B6B8A] uppercase tracking-wider">Tingkatan Hak Akses</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-100 uppercase tracking-wider w-fit block mt-1">
                  SYSTEM ROOT ({session.user.role})
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-[#6B6B8A] uppercase tracking-wider">Status Otorisasi</span>
                <span className="text-xs font-semibold text-emerald-600 block mt-1">
                  Akses Penuh Basis Data, Akun & Laporan
                </span>
              </div>
            </div>
          </div>

          {/* Root Audit Info */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-[#111827] flex items-center gap-1.5 pb-2 border-b border-[#E8E2D9]">
              <Shield size={16} className="text-red-600" />
              Sistem Kredensial & Enkripsi
            </h3>
            <p className="text-xs text-[#6B6B8A] leading-relaxed">
              Sebagai <strong className="text-red-600">Super Admin (Root)</strong>, akun Anda dilindungi enkripsi JWT NextAuth.js 30-hari dan memiliki wewenang eksekusi endpoint modifikasi basis data sensitif (seperti pendaftaran admin, penghapusan data aduan secara fisik, dan pembuatan kategori baru). Pastikan untuk mengganti sandi Anda secara berkala demi menjamin integritas platform KataWarga.
            </p>
          </div>
        </div>

        {/* Change Password Form (Right - Column 1) */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm h-fit">
          <h3 className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-1.5">
            <Lock size={16} className="text-red-600" />
            Ubah Sandi Utama
          </h3>

          <form onSubmit={handleSubmitPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#6B6B8A] mb-1.5">Kata Sandi Lama</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan kata sandi lama"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-[#FFFBF5] rounded-xl border border-[#E8E2D9] outline-none text-xs text-[#111827] focus:border-[#192126] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6B6B8A] mb-1.5">Kata Sandi Baru</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 8 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-[#FFFBF5] rounded-xl border border-[#E8E2D9] outline-none text-xs text-[#111827] focus:border-[#192126] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6B6B8A] mb-1.5">Konfirmasi Kata Sandi Baru</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Ulangi kata sandi baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-[#FFFBF5] rounded-xl border border-[#E8E2D9] outline-none text-xs text-[#111827] focus:border-[#192126] transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-password-sa"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-[#E8E2D9] text-[#192126] focus:ring-[#192126] cursor-pointer"
              />
              <label htmlFor="show-password-sa" className="text-[10px] font-semibold text-[#6B6B8A] cursor-pointer select-none">
                Tampilkan Kata Sandi
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !oldPassword || !newPassword || !confirmPassword}
              className="w-full py-2.5 bg-[#192126] text-white font-semibold text-xs rounded-xl hover:bg-[#2b2e2f] transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check size={14} />
              )}
              <span>Perbarui Kata Sandi</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
