"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import DevelopmentBanner from "@/components/ui/DevelopmentBanner";
import { emitProfileUpdated } from "@/hooks/useUserProfile";
import {
  User,
  Shield,
  Bell,
  Eye,
  Settings,
  Languages,
  LogOut,
  Save,
  Laptop,
  Smartphone,
  Upload,
  Moon,
  Sun
} from "lucide-react";

export default function PengaturanPage() {
  const { data: session, update } = useSession();
  const [activeSection, setActiveSection] = useState("profil");
  const [isSaving, setIsSaving] = useState(false);
  
  // Settings Form State
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  const [passwordOld, setPasswordOld] = useState("");
  const [passwordNew, setPasswordNew] = useState("");
  
  // Notif Toggles State
  const [notifReportUpdates, setNotifReportUpdates] = useState(true);
  const [notifComments, setNotifComments] = useState(true);
  const [notifMentions, setNotifMentions] = useState(false);
  const [notifCommunity, setNotifCommunity] = useState(true);

  // Theme State
  const [currentTheme, setCurrentTheme] = useState("light");

  const fileInputRef = useRef(null);

  // Load profil dari API backend — hanya sekali saat mount
  useEffect(() => {
    if (!session?.user?.id || !session?.accessToken) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

    fetch(`${apiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const u = data?.user;
        if (!u) return;
        setFullName(u.name || "");
        setBio(u.bio || "");
        setUsername(u.username || u.email?.split("@")[0] || "");
        setAvatarPreview(u.avatar || null);
      })
      .catch(() => {
        // fallback session
        setFullName(session.user?.name || "");
        setUsername(session.user?.email?.split("@")[0] || "");
      });

    const savedTheme = localStorage.getItem("theme") || "light";
    setCurrentTheme(savedTheme);
  }, []); // sekali mount

  const toggleTheme = (theme) => {
    setCurrentTheme(theme);
    localStorage.setItem("theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  /**
   * Kompres & resize gambar via Canvas sebelum disimpan.
   * Output: JPEG 200x200px maks, kualitas 70% → ~20–50KB.
   */
  const compressImage = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const MAX = 200;
          const scale = Math.min(MAX / img.width, MAX / img.height, 1);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });

  // Avatar file ref for backend upload
  const [avatarFile, setAvatarFile] = useState(null);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setAvatarPreview(compressed);
      setAvatarFile(file); // Keep original file for backend upload
    } catch (err) {
      console.error("Gagal memproses foto:", err);
      alert("Gagal memproses foto. Coba gunakan file yang lebih kecil.");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const token = session?.accessToken;
    const userId = session?.user?.id;

    try {
      // 1. Upload avatar ke backend jika ada file baru
      if (avatarFile && token && userId) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        const avatarRes = await fetch(`${apiUrl}/users/${userId}/avatar`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (avatarRes.ok) {
          const avatarData = await avatarRes.json();
          if (avatarData.avatar) {
            setAvatarPreview(avatarData.avatar);
          }
        }
      }

      // 2. Simpan bio & lokasi ke backend via PUT /users/:id/profile
      if (token && userId) {
        const profileRes = await fetch(`${apiUrl}/users/${userId}/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ bio, name: fullName, username }),
        });
        if (!profileRes.ok) {
          const err = await profileRes.json().catch(() => ({}));
          console.warn("Gagal simpan profil ke backend:", err.message);
        }
      }

      // 3. Update NextAuth session
      if (update) {
        await update({ name: fullName, username, avatar: avatarPreview });
      }

      // 4. Refresh semua komponen yang pakai useUserProfile
      emitProfileUpdated();

      alert("Pengaturan profil berhasil disimpan!");
    } catch (err) {
      console.error("Save settings error:", err);
      alert("Terjadi kesalahan saat menyimpan pengaturan.");
    } finally {
      setIsSaving(false);
    }
  };

  // Mock Active Sessions
  const activeSessions = [
    { id: 1, device: "Windows Chrome (Sesi ini)", location: "Jakarta, Indonesia", ip: "192.168.100.10", time: "Aktif sekarang", icon: Laptop },
    { id: 2, device: "Xiaomi Redmi 10 Mobile App", location: "Bandung, Indonesia", ip: "10.201.8.44", time: "Login 2 hari lalu", icon: Smartphone }
  ];

  const menuItems = [
    { id: "akun", label: "Akun", icon: User },
    { id: "profil", label: "Profil", icon: User },
    { id: "keamanan", label: "Keamanan", icon: Shield },
    { id: "notifikasi", label: "Notifikasi", icon: Bell },
    { id: "privasi", label: "Privasi & Keamanan", icon: Eye },
    { id: "tampilan", label: "Tampilan", icon: Laptop },
    { id: "bahasa", label: "Bahasa", icon: Languages },
  ];

  return (
    <div className="flex flex-col h-full bg-[#FFFBF5]">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between px-5 py-3.5 bg-[#FFFBF5]/80 backdrop-blur-md sticky top-0 z-20 border-b border-[#E8E2D9]">
        <div>
          <h1 className="font-bold text-base text-[#111827]">Pengaturan</h1>
          <p className="text-[11px] text-[#6B6B8A]">
            Kelola preferensi akun, privasi, dan keamanan profil Anda
          </p>
        </div>
      </div>

      <div className="p-4 md:p-6 flex flex-col gap-4 max-w-4xl mx-auto w-full flex-1">
        {/* Development Banner */}
        <DevelopmentBanner featureName="Pengaturan Platform" />

        {/* Dual Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          
          {/* Left Navigation Menu */}
          <div className="md:col-span-4 bg-white border border-[#E8E2D9] rounded-3xl p-3 shadow-sm flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-1 whitespace-nowrap scrollbar-none">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 w-full text-left ${
                    activeSection === item.id
                      ? "bg-[#192126] text-white shadow-sm shadow-[#192126]/10"
                      : "text-[#3D3D5C] hover:bg-[#F5F0E8] hover:text-[#111827]"
                  }`}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Content Form Area */}
          <div className="md:col-span-8 bg-white border border-[#E8E2D9] rounded-3xl p-5 md:p-6 shadow-sm min-h-[300px]">
            
            {/* 1. Account Settings */}
            {activeSection === "akun" && (
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-[#111827] border-b border-[#FFFBF5] pb-2">Informasi Akun</h3>
                <div>
                  <label className="block text-[10px] font-bold text-[#6B6B8A] uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    disabled
                    value={session?.user?.email || "ahmadriyadi@email.com"}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-[#E8E2D9] rounded-xl text-xs text-[#6B6B8A] cursor-not-allowed"
                  />
                  <p className="text-[10px] text-[#B0A898] mt-1">Email Anda terhubung dengan verifikasi NextAuth.</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#6B6B8A] uppercase tracking-wider mb-1">Username Publik</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#B0A898] font-bold">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-7 pr-3 py-2.5 bg-white border border-[#E8E2D9] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#192126]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. Profile Settings */}
            {activeSection === "profil" && (
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-[#111827] border-b border-[#FFFBF5] pb-2">Sunting Profil</h3>
                
                {/* Photo Upload Simulation */}
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar Preview"
                      className="w-14 h-14 rounded-2xl object-cover border border-[#E8E2D9]"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-[#192126] text-white flex items-center justify-center font-bold text-lg">
                      {fullName.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-[#FFFBF5] border border-[#E8E2D9] text-xs font-bold rounded-xl text-[#192126] hover:bg-[#F5F0E8] transition flex items-center gap-1.5"
                    >
                      <Upload size={12} />
                      Ganti Foto
                    </button>
                    <p className="text-[9px] text-[#B0A898] mt-1">Rekomendasi ukuran square PNG/JPG min 400x400px.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#6B6B8A] uppercase tracking-wider mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-[#E8E2D9] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#192126]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#6B6B8A] uppercase tracking-wider mb-1">Biodata Singkat</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 bg-white border border-[#E8E2D9] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#192126] resize-none"
                  />
                </div>
              </div>
            )}

            {/* 3. Security Settings */}
            {activeSection === "keamanan" && (
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-[#111827] border-b border-[#FFFBF5] pb-2">Ubah Kata Sandi</h3>
                
                <div>
                  <label className="block text-[10px] font-bold text-[#6B6B8A] uppercase tracking-wider mb-1">Sandi Lama</label>
                  <input
                    type="password"
                    value={passwordOld}
                    onChange={(e) => setPasswordOld(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-[#E8E2D9] rounded-xl text-xs focus:outline-none focus:border-[#192126]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#6B6B8A] uppercase tracking-wider mb-1">Sandi Baru</label>
                  <input
                    type="password"
                    value={passwordNew}
                    onChange={(e) => setPasswordNew(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-[#E8E2D9] rounded-xl text-xs focus:outline-none focus:border-[#192126]"
                  />
                </div>

                {/* Sesi Aktif */}
                <div className="pt-4">
                  <h4 className="font-bold text-xs text-[#111827] mb-2.5">Sesi Login Aktif</h4>
                  <div className="flex flex-col gap-2.5">
                    {activeSessions.map((session) => {
                      const SessionIcon = session.icon;
                      return (
                        <div key={session.id} className="p-3 bg-[#FFFBF5] border border-[#F0EAE0] rounded-2xl flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#192126]">
                            <SessionIcon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-xs text-[#111827] truncate">{session.device}</h5>
                            <p className="text-[10px] text-[#6B6B8A] mt-0.5">{session.location} · {session.ip}</p>
                          </div>
                          <span className="text-[9px] text-[#192126] font-bold">{session.time}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 4. Notification Settings */}
            {activeSection === "notifikasi" && (
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-[#111827] border-b border-[#FFFBF5] pb-2">Preferensi Pemberitahuan</h3>
                <p className="text-[10px] text-[#6B6B8A] leading-normal">
                  Pilih kapan saja Anda ingin menerima pemberitahuan di browser atau email Anda.
                </p>
                <div className="flex flex-col gap-3 pt-2">
                  {[
                    { label: "Pembaruan Status Laporan", desc: "Beritahu saya jika admin memproses atau menyelesaikan laporan saya.", state: notifReportUpdates, setter: setNotifReportUpdates },
                    { label: "Komentar Baru", desc: "Beritahu saya jika ada warga lain atau admin menanggapi laporan saya.", state: notifComments, setter: setNotifComments },
                    { label: "Sebutan (Mentions)", desc: "Beritahu saya jika ada warga menyertakan username saya di komentar.", state: notifMentions, setter: setNotifMentions },
                    { label: "Aktivitas Komunitas", desc: "Info mingguan seputar laporan paling populer di wilayah saya.", state: notifCommunity, setter: setNotifCommunity },
                  ].map((notif, i) => (
                    <label key={i} className="flex items-start justify-between gap-4 p-3 hover:bg-[#FFFBF5] rounded-xl cursor-pointer transition">
                      <div className="flex-1">
                        <span className="block font-bold text-xs text-[#111827]">{notif.label}</span>
                        <span className="text-[10px] text-[#6B6B8A] mt-0.5 leading-normal">{notif.desc}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notif.state}
                        onChange={(e) => notif.setter(e.target.checked)}
                        className="w-4 h-4 rounded text-[#192126] border-[#E8E2D9] focus:ring-[#192126] shrink-0 mt-0.5"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Privacy Settings */}
            {activeSection === "privasi" && (
              <div className="space-y-4 text-xs text-[#6B6B8A] leading-relaxed">
                <h3 className="font-bold text-sm text-[#111827] border-b border-[#FFFBF5] pb-2">Privasi Data</h3>
                <p>
                  Keamanan privasi warga adalah prioritas utama. KataWarga menyediakan opsi anonim saat mengirimkan laporan sehingga nama Anda tidak ditampilkan di feed publik.
                </p>
                <p>
                  Lokasi koordinat GPS yang dimasukkan digunakan semata-mata untuk mengelompokkan laporan wilayah dinas pemeliharaan kota.
                </p>
              </div>
            )}

            {/* 6. Appearance Settings */}
            {activeSection === "tampilan" && (
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-[#111827] border-b border-[#FFFBF5] pb-2">Tema &amp; Tampilan</h3>
                <div>
                  <label className="block text-[10px] font-bold text-[#6B6B8A] uppercase tracking-wider mb-2">Tema Warna</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => toggleTheme("light")}
                      className={`p-3 rounded-2xl flex items-center justify-between text-left border-2 transition ${
                        currentTheme === "light"
                          ? "border-[#192126] bg-blue-50/20"
                          : "border-[#E8E2D9] bg-[#FFFBF5]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Sun size={16} className="text-orange-500" />
                        <div>
                          <span className="block font-bold text-xs text-[#111827]">Light Mode</span>
                          <span className="text-[9px] text-[#6B6B8A] mt-0.5">Cream + Blue default</span>
                        </div>
                      </div>
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        currentTheme === "light" ? "bg-[#192126] border-[#192126]" : "border-slate-300"
                      }`} />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => toggleTheme("dark")}
                      className={`p-3 rounded-2xl flex items-center justify-between text-left border-2 transition ${
                        currentTheme === "dark"
                          ? "border-[#192126] bg-[#1e293b]"
                          : "border-[#E8E2D9] bg-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Moon size={16} className="text-indigo-400" />
                        <div>
                          <span className="block font-bold text-xs text-[#111827]">Dark Mode</span>
                          <span className="text-[9px] text-[#6B6B8A] mt-0.5">Sleek slate dark theme</span>
                        </div>
                      </div>
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        currentTheme === "dark" ? "bg-[#192126] border-[#192126]" : "border-slate-300"
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 7. Language Settings */}
            {activeSection === "bahasa" && (
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-[#111827] border-b border-[#FFFBF5] pb-2">Bahasa Sistem</h3>
                <div>
                  <label className="block text-[10px] font-bold text-[#6B6B8A] uppercase tracking-wider mb-2">Bahasa Pengantar</label>
                  <select className="w-full px-3 py-2.5 bg-white border border-[#E8E2D9] rounded-xl text-xs text-[#111827] focus:outline-none">
                    <option>Bahasa Indonesia (Default)</option>
                    <option>English (Masa Depan)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Save Button for active fields */}
            {["akun", "profil", "keamanan", "notifikasi", "bahasa"].includes(activeSection) && (
              <div className="pt-4 mt-4 border-t border-[#FFFBF5] flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-[#192126] hover:bg-[#2b2e2f] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-md shadow-[#192126]/10 active:scale-95"
                >
                  <Save size={13} />
                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
