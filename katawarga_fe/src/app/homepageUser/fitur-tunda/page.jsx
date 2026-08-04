"use client";

import React, { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  MapPin,
  Search,
  SlidersHorizontal,
  Bookmark,
  Settings,
  FileText,
  Bell,
  User,
  Plus,
  Code,
  ArrowRight,
  ExternalLink,
  Map,
  Loader2,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";

// ── Leaflet harus dynamic (SSR disabled) ───────────────────────────────────
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[320px] bg-[#EDE7D9]/40 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-[#6B6B8A]">
      <Loader2 size={18} className="animate-spin text-[#192126]" />
      Memuat peta demo...
    </div>
  ),
});

const features = [
  {
    id: "buat-laporan",
    title: "Pembuatan Laporan",
    description: "Formulir interaktif untuk mengirim aduan warga dengan geolokasi dan lampiran foto.",
    icon: Plus,
    status: "Completed",
    statusColor: "bg-green-50 text-green-600 border-green-200",
    progress: 100,
    link: "/homepageUser/buat-laporan",
    technicalIssues: [
      "Upload Gambar — membutuhkan multer middleware dan S3/local storage di backend.",
      "Reverse Geocoding — pemanggilan Nominatim/Mapbox API untuk konversi koordinat ke alamat.",
      "Validasi Form — Zod client-side + server-side untuk deskripsi & koordinat.",
    ],
  },
  {
    id: "pencarian",
    title: "Pencarian & Eksplorasi",
    description: "Temukan laporan warga sekitar secara cepat berdasarkan judul, teks, atau kata kunci.",
    icon: Search,
    status: "Completed",
    statusColor: "bg-green-50 text-green-600 border-green-200",
    progress: 100,
    link: "/homepageUser/jelajah",
    technicalIssues: [
      "Full-Text Search — indeks pencarian MySQL pada tabel `public_reports`.",
      "Recent Searches — riwayat pencarian di localStorage atau sesi pengguna.",
    ],
  },
  {
    id: "filter",
    title: "Filter & Pengurutan Konten",
    description: "Menyaring laporan berdasarkan Kategori, Status, Prioritas, dan Jarak Lokasi.",
    icon: SlidersHorizontal,
    status: "Completed",
    statusColor: "bg-green-50 text-green-600 border-green-200",
    progress: 100,
    link: "/homepageUser/jelajah",
    technicalIssues: [
      "Backend Filtering — parameter query di endpoint `GET /api/reports` (category_id, priority).",
      "Haversine Distance — logika sorting jarak terdekat di MySQL berdasarkan koordinat GPS.",
    ],
  },
  {
    id: "laporan-saya",
    title: "Laporan Saya",
    description: "Daftar riwayat laporan pribadi pengguna dengan status terkini.",
    icon: FileText,
    status: "Completed",
    statusColor: "bg-green-50 text-green-600 border-green-200",
    progress: 100,
    link: "/homepageUser/laporan",
    technicalIssues: [
      "Endpoint Khusus — `GET /api/reports/my-reports` dengan JWT Bearer Token.",
      "Tombol Selesai — hanya pembuat laporan yang dapat mengubah status ke selesai.",
    ],
  },
  {
    id: "notifikasi",
    title: "Notifikasi Real-time",
    description: "Pemberitahuan saat laporan ditanggapi, diproses, atau diselesaikan admin.",
    icon: Bell,
    status: "Completed",
    statusColor: "bg-green-50 text-green-600 border-green-200",
    progress: 100,
    link: "/homepageUser/notifikasi",
    technicalIssues: [
      "WebSocket / SSE — push notification tanpa polling atau reload halaman.",
      "Status Trigger — event emitter backend saat status laporan berubah.",
    ],
  },
  {
    id: "tersimpan",
    title: "Bookmarks / Tersimpan",
    description: "Menyimpan laporan penting warga lain agar mudah dipantau.",
    icon: Bookmark,
    status: "Completed",
    statusColor: "bg-green-50 text-green-600 border-green-200",
    progress: 100,
    link: "/homepageUser/tersimpan",
    technicalIssues: [
      "Junction Table — tabel `report_bookmarks` menghubungkan `users` & `public_reports`.",
      "Cache Syncing — sinkronisasi status bookmark di feed beranda secara dinamis.",
    ],
  },
  {
    id: "profil",
    title: "Profil Warga Sosial",
    description: "Halaman personal dengan biodata, statistik reputasi, dan daftar postingan.",
    icon: User,
    status: "Completed",
    statusColor: "bg-green-50 text-green-600 border-green-200",
    progress: 100,
    link: "/homepageUser/profil",
    technicalIssues: [
      "Dynamic Profile — `GET /api/users/:id/profile` relasi pengikut & reputasi.",
      "Achievement Badges — logika gamifikasi lencana otomatis dari backend.",
    ],
  },
  {
    id: "pengaturan",
    title: "Pengaturan Akun",
    description: "Panel kustomisasi untuk profil, password, dan kontrol sesi login.",
    icon: Settings,
    status: "Completed",
    statusColor: "bg-green-50 text-green-600 border-green-200",
    progress: 100,
    link: "/homepageUser/pengaturan",
    technicalIssues: [
      "Session Management — history login & pencabutan token JWT sesi lain.",
      "bcrypt Handler — verifikasi password lama sebelum menyimpan password baru.",
    ],
  },
];

export default function FiturTundaPage() {
  const { data: session } = useSession();
  const [expandedId, setExpandedId] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [reports, setReports] = useState([]);

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  // Fetch real reports for map demo
  React.useEffect(() => {
    const token = session?.accessToken || session?.user?.accessToken;
    if (!token) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    fetch(`${apiUrl}/reports?limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.data) {
          setReports(data.data.map((r) => ({
            ...r,
            lat: parseFloat(r.latitude) || (-6.18 + ((r.id * 7919) % 100) / 100 * 0.18 - 0.09),
            lng: parseFloat(r.longitude) || (106.82 + ((r.id * 7919) % 100) / 100 * 0.18 - 0.09),
          })));
        }
      })
      .catch((err) => console.error("Fiturdemo fetch error:", err));
  }, [session]);

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFBF5]">

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="px-5 py-6 bg-white border-b border-[#E8E2D9]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#192126] mb-2">
            <Code size={14} />
            <span>KONTROL PENGEMBANGAN PLATFORM</span>
          </div>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
            Roadmap & Fitur Pending
          </h1>
          <p className="text-sm text-[#6B6B8A] mt-1">
            Daftar modul yang masih dalam pengembangan beserta demo peta interaktif Leaflet.js.
          </p>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full flex flex-col gap-6">

        {/* ── LIVE MAP DEMO SECTION ─────────────────────────────────────────── */}
        <div className="bg-white border border-[#E8E2D9] rounded-3xl overflow-hidden shadow-sm">
          {/* Map Header */}
          <div className="px-5 py-4 border-b border-[#E8E2D9] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#192126] flex items-center justify-center">
                <Map size={20} />
              </div>
              <div>
                <h2 className="font-bold text-sm text-[#111827] flex items-center gap-2">
                  Demo Peta Interaktif Leaflet.js
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                    LIVE <CheckCircle size={10} className="inline ml-0.5" />
                  </span>
                </h2>
                <p className="text-[11px] text-[#6B6B8A]">
                  Marker warna = kategori · Klik marker untuk detail · <MapPin size={10} className="inline text-[#192126]" /> = lokasi GPS
                </p>
              </div>
            </div>
            <Link
              href="/homepageUser/peta"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#192126] hover:bg-[#2b2e2f] text-white text-xs font-bold rounded-xl transition"
            >
              Buka Peta Penuh
              <ArrowRight size={12} />
            </Link>
          </div>

          {/* Map */}
          <div className="relative" style={{ height: "340px", zIndex: 0 }}>
            <MapComponent
              markers={reports}
              onMarkerClick={(r) => setSelectedMarker(r === selectedMarker ? null : r)}
            />
          </div>

          {/* Marker detail */}
          <AnimatePresence>
            {selectedMarker && (
              <motion.div
                key="marker-detail"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-[#E8E2D9] overflow-hidden"
              >
                <div className="px-5 py-4 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#192126] border border-blue-100">
                      {selectedMarker.category}
                    </span>
                    <h4 className="font-bold text-sm text-[#111827] mt-1.5 leading-snug">
                      {selectedMarker.title}
                    </h4>
                    <p className="text-xs text-[#6B6B8A] mt-1 flex items-center gap-1">
                      <MapPin size={11} />
                      {selectedMarker.location}
                      <span className="ml-2 capitalize font-bold text-[#192126]">{selectedMarker.status}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedMarker(null)}
                    className="text-[10px] font-bold text-[#B0A898] hover:text-red-500 transition flex-shrink-0 mt-1"
                  >
                    Tutup <X size={10} className="inline ml-0.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info */}
          <div className="px-5 py-3 bg-[#FFFBF5] border-t border-[#F0EAE0] flex items-center gap-2 text-[10px] text-[#6B6B8A] font-semibold">
            <Info size={12} className="text-[#192126]" />
            Data laporan real-time dari database · {reports.length} laporan di peta
          </div>
        </div>

        {/* ── Info Banner ───────────────────────────────────────────────────── */}
        <div className="p-4 bg-blue-50/70 border border-blue-200/60 rounded-2xl flex gap-3 text-sm text-[#3D3D5C]">
          <AlertTriangle className="text-[#192126] flex-shrink-0 mt-0.5" size={18} />
          <div>
            <span className="font-semibold text-[#111827]">Info Pengujian:</span>{" "}
            Sub-halaman di bawah dapat diakses dari sidebar. Halaman mockup menggunakan desain cream-blue premium. Tekan{" "}
            <strong>Lihat Mockup UI</strong> untuk melihat implementasinya.
          </div>
        </div>

        {/* ── Feature Cards ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {features.map((feature, idx) => {
            const Icon       = feature.icon;
            const isExpanded = expandedId === feature.id;
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
                className="bg-white border border-[#E8E2D9] rounded-2xl overflow-hidden hover:border-[#192126]/30 transition shadow-sm"
              >
                {/* Card Header — always visible */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex gap-3 flex-1">
                    <div className="w-11 h-11 rounded-xl bg-[#FFFBF5] border border-[#E8E2D9] flex items-center justify-center text-[#192126] flex-shrink-0">
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-sm text-[#111827]">{feature.title}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${feature.statusColor}`}>
                          {feature.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B6B8A] mt-0.5 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0">
                    <Link
                      href={feature.link}
                      className="px-3.5 py-1.5 bg-[#FFFBF5] hover:bg-[#F5F0E8] border border-[#E8E2D9] text-xs font-semibold rounded-xl text-[#192126] transition flex items-center gap-1.5"
                    >
                      Lihat UI
                      <ExternalLink size={11} />
                    </Link>
                    <button
                      onClick={() => toggleExpand(feature.id)}
                      className="p-1.5 hover:bg-[#F5F0E8] rounded-xl text-[#6B6B8A] transition"
                    >
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="px-4 pb-3">
                  <div className="flex justify-between text-[10px] font-semibold text-[#6B6B8A] mb-1">
                    <span>Progres Implementasi</span>
                    <span>{feature.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#F5F0E8] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#192126] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${feature.progress}%` }}
                      transition={{ delay: idx * 0.05 + 0.2, duration: 0.6 }}
                    />
                  </div>
                </div>

                {/* Expandable Technical Issues */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      key="issues"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-[#F5F0E8] overflow-hidden"
                    >
                      <div className="px-4 py-3 bg-[#FFFBF5]">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#111827] mb-2">
                          <Code size={12} className="text-[#6B6B8A]" />
                          <span>Kendala Teknis / Tugas Backend:</span>
                        </div>
                        <ul className="space-y-1.5">
                          {feature.technicalIssues.map((issue, i) => (
                            <li key={i} className="flex gap-2 text-[11px] text-[#6B6B8A] leading-relaxed">
                              <span className="text-[#192126] font-bold mt-0.5">•</span>
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* ── Back CTA ──────────────────────────────────────────────────────── */}
        <div className="text-center pb-6">
          <Link
            href="/homepageUser"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#192126] hover:underline"
          >
            Kembali ke Beranda
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
