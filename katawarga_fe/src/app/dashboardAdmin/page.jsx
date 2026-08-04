"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  FileText,
  Clock,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Calendar,
  User,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";

// Dynamically import MapComponent to avoid SSR errors
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[350px] bg-slate-100 flex items-center justify-center rounded-2xl border border-[#E8E2D9]">
      <Loader2 className="w-8 h-8 animate-spin text-[#192126]" />
      <span className="ml-2 text-sm text-[#6B6B8A] font-medium">Memuat peta...</span>
    </div>
  ),
});

export default function AdminOverview() {
  const { data: session } = useSession();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    resolved: 0,
    rejected: 0,
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const calculateStats = (items) => {
    const counts = {
      total: items.length,
      pending: items.filter((r) => r.status === "menunggu").length,
      processing: items.filter((r) => r.status === "diproses").length,
      resolved: items.filter((r) => r.status === "selesai").length,
      rejected: items.filter((r) => r.status === "ditolak").length,
    };
    setStats(counts);
  };

  useEffect(() => {
    async function fetchDashboardData() {
      if (!session) return;
      const token = session.accessToken || session.user?.accessToken;

      if (!token) {
        console.warn("No token available for admin dashboard");
        setReports([]);
        calculateStats([]);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/reports?limit=100`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const result = await res.json();
          const dataList = result?.data || [];
          setReports(dataList);
          calculateStats(dataList);
        } else {
          console.warn("Failed to fetch reports:", res.status);
          setReports([]);
          calculateStats([]);
        }
      } catch (err) {
        console.error("Error fetching admin reports:", err);
        setReports([]);
        calculateStats([]);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [session, apiUrl]);

  const getPriorityColor = (prio) => {
    switch (prio) {
      case "tinggi":
        return "bg-red-50 text-red-700 border-red-100";
      case "sedang":
        return "bg-amber-50 text-amber-700 border-amber-100";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "menunggu":
        return { bg: "bg-amber-100 text-amber-800", label: "Menunggu" };
      case "diproses":
        return { bg: "bg-blue-100 text-blue-800", label: "Diproses" };
      case "selesai":
        return { bg: "bg-emerald-100 text-emerald-800", label: "Selesai" };
      default:
        return { bg: "bg-rose-100 text-rose-800", label: "Ditolak" };
    }
  };

  // Pre-calculate weekly stats for custom SVG line chart
  const weeklyData = [
    { name: "Sen", count: 4 },
    { name: "Sel", count: 9 },
    { name: "Rab", count: 7 },
    { name: "Kam", count: 12 },
    { name: "Jum", count: 15 },
    { name: "Sab", count: 8 },
    { name: "Min", count: 6 },
  ];
  const maxWeeklyVal = Math.max(...weeklyData.map((d) => d.count)) || 10;
  const chartHeight = 120;
  const chartWidth = 420;

  // Pre-calculate category breakdown for custom SVG bar chart
  const categoryCounts = reports.reduce((acc, item) => {
    const cat = item.category || "Fasilitas Umum";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const categoryData = Object.entries(categoryCounts).map(([name, count]) => ({
    name,
    count,
  })).slice(0, 4);

  const maxCatCount = Math.max(...categoryData.map((d) => d.count)) || 5;

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#111827]">
            Ringkasan Operasional
          </h1>
          <p className="text-sm text-[#6B6B8A]">
            Pantau status aduan warga, sla penyelesaian, dan sebaran laporan wilayah.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#6B6B8A] bg-white border border-[#E8E2D9] px-3.5 py-2 rounded-xl shadow-sm">
          <Calendar size={14} className="text-[#192126]" />
          <span>Update Terakhir: {new Date().toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Grid Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Card */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B6B8A]">Total Laporan</span>
            <div className="p-2 rounded-lg bg-indigo-55 bg-opacity-10 text-[#192126] bg-blue-50">
              <FileText size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold font-display text-[#111827]">{stats.total}</h3>
            <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5 mt-1">
              <TrendingUp size={10} />
              <span>Semua aduan masuk</span>
            </p>
          </div>
        </motion.div>

        {/* Menunggu Card */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-4 rounded-2xl border border-amber-200 border-l-4 border-l-amber-500 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B6B8A]">Menunggu</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold font-display text-amber-700">{stats.pending}</h3>
            <p className="text-[10px] text-amber-600 font-medium mt-1">Butuh verifikasi segera</p>
          </div>
        </motion.div>

        {/* Diproses Card */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-4 rounded-2xl border border-blue-200 border-l-4 border-l-blue-500 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B6B8A]">Sedang Diproses</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Activity size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold font-display text-blue-700">{stats.processing}</h3>
            <p className="text-[10px] text-blue-600 font-medium mt-1">Dalam pengerjaan lapangan</p>
          </div>
        </motion.div>

        {/* Selesai Card */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-4 rounded-2xl border border-emerald-200 border-l-4 border-l-emerald-500 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B6B8A]">Laporan Selesai</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold font-display text-emerald-700">{stats.resolved}</h3>
            <p className="text-[10px] text-emerald-600 font-medium mt-1">Dikonfirmasi selesai warga</p>
          </div>
        </motion.div>

        {/* Ditolak Card */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-4 rounded-2xl border border-rose-200 border-l-4 border-l-rose-500 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B6B8A]">Laporan Ditolak</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold font-display text-rose-700">{stats.rejected}</h3>
            <p className="text-[10px] text-[#6B6B8A] font-medium mt-1">Aduan tidak valid/hoax</p>
          </div>
        </motion.div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Laporan (Line Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-[#111827]">Tren Aktivitas Harian</h4>
              <p className="text-xs text-[#6B6B8A]">Jumlah aduan masuk seminggu terakhir</p>
            </div>
            <span className="text-[10px] font-bold text-[#192126] bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
              SLA Tepat Waktu
            </span>
          </div>

          {/* SVG Line Chart */}
          <div className="flex-1 flex items-end justify-center py-2 h-44">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((val, idx) => (
                <line
                  key={idx}
                  x1="0"
                  y1={chartHeight - val * chartHeight}
                  x2={chartWidth}
                  y2={chartHeight - val * chartHeight}
                  stroke="#EDE7D9"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              ))}

              {/* Coordinates Path generator */}
              {(() => {
                const points = weeklyData.map((d, i) => {
                  const x = (i * chartWidth) / (weeklyData.length - 1);
                  const y = chartHeight - (d.count / maxWeeklyVal) * chartHeight * 0.8;
                  return { x, y };
                });

                const dPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
                const dArea = `${dPath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

                return (
                  <>
                    {/* Area fill */}
                    <path d={dArea} fill="url(#blueGradient)" opacity="0.15" />
                    {/* Line path */}
                    <path d={dPath} fill="none" stroke="#192126" strokeWidth="3" strokeLinecap="round" />

                    {/* Gradient Def */}
                    <defs>
                      <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#192126" />
                        <stop offset="100%" stopColor="#192126" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Interactive dots */}
                    {points.map((p, i) => (
                      <g key={i} className="group cursor-pointer">
                        <circle cx={p.x} cy={p.y} r="5" fill="#192126" stroke="white" strokeWidth="2" />
                        <circle cx={p.x} cy={p.y} r="9" fill="#192126" opacity="0" className="hover:opacity-20 transition-opacity" />
                        <text x={p.x} y={p.y - 12} textAnchor="middle" className="text-[10px] font-bold fill-[#111827] hidden group-hover:block bg-white px-1">
                          {weeklyData[i].count}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>

          {/* Labels */}
          <div className="flex justify-between px-2 pt-2 border-t border-[#E8E2D9] text-[10px] font-semibold text-[#6B6B8A]">
            {weeklyData.map((d, idx) => (
              <span key={idx}>{d.name}</span>
            ))}
          </div>
        </div>

        {/* Distribusi Kategori (Bar Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-[#111827]">Topik Masalah Terbanyak</h4>
              <p className="text-xs text-[#6B6B8A]">Distribusi aduan warga berdasarkan kategori</p>
            </div>
            <Link
              href="/dashboardAdmin/kategori"
              className="text-xs font-semibold text-[#192126] hover:underline flex items-center gap-0.5"
            >
              Kelola
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-3">
            {categoryData.length > 0 ? (
              categoryData.map((item, idx) => {
                const percent = (item.count / maxCatCount) * 100;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#3D3D5C]">{item.name}</span>
                      <span className="text-[#111827]">{item.count} Laporan</span>
                    </div>
                    <div className="w-full h-3.5 bg-[#FFFBF5] rounded-full overflow-hidden border border-[#E8E2D9]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                        className="h-full bg-[#192126] rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-[#6B6B8A]">Data kategori belum tersedia.</div>
            )}
          </div>
        </div>
      </div>

      {/* Map and Recent Activity Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Map Container */}
        <div className="xl:col-span-2 bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-[#111827]">Peta Sebaran Aduan</h4>
              <p className="text-xs text-[#6B6B8A]">Lokasi geografis laporan warga di wilayah perkotaan</p>
            </div>
            <Link
              href="/dashboardAdmin/laporan"
              className="text-xs font-semibold text-[#192126] hover:underline flex items-center gap-0.5"
            >
              Lihat Detail
              <ArrowRight size={12} />
            </Link>
          </div>

          {/* Leaflet Map component */}
          <div className="h-[350px] w-full rounded-xl overflow-hidden border border-[#E8E2D9]">
            <MapComponent markers={reports} />
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm flex flex-col h-[430px]">
          <div className="flex items-center justify-between mb-4 border-b border-[#E8E2D9] pb-3">
            <div>
              <h4 className="text-sm font-bold text-[#111827]">Aduan Masuk Terbaru</h4>
              <p className="text-xs text-[#6B6B8A]">5 laporan warga paling mutakhir</p>
            </div>
            <Link
              href="/dashboardAdmin/laporan"
              className="text-xs font-semibold text-[#192126] hover:underline flex items-center gap-0.5"
            >
              Semua
              <ArrowRight size={12} />
            </Link>
          </div>

          {/* Activity List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {reports.slice(0, 5).map((item) => {
              const statusCfg = getStatusStyle(item.status);
              return (
                <div
                  key={item.id}
                  className="p-3 bg-[#FFFBF5] rounded-xl border border-[#E8E2D9] hover:border-[#192126] transition duration-250 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-[#111827] line-clamp-1 flex-1">
                      {item.title}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusCfg.bg}`}>
                      {statusCfg.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#6B6B8A] font-semibold mt-1">
                    <div className="flex items-center gap-1">
                      <User size={12} className="text-[#192126]" />
                      <span className="truncate max-w-[80px]">{item.user_name || "Warga"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={12} className="text-[#22C55E]" />
                      <span className="truncate max-w-[100px]">{item.location || "Jakarta"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
