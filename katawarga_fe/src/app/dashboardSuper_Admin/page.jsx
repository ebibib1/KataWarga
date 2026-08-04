"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  FileText,
  TrendingUp,
  AlertTriangle,
  Activity,
  Loader2,
  Shield
} from "lucide-react";

export default function SuperAdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReports: 0,
    totalCategories: 0,
    resolvedRate: 0,
  });
  const [reportList, setReportList] = useState([]);
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    if (!session) return;

    const fetchSystemData = async () => {
      const token = session.accessToken || session.user?.accessToken;
      setLoading(true);

      try {
        // Fetch reports
        const reportsRes = await fetch(`${apiUrl}/reports?limit=200`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        let reportsData = [];
        if (reportsRes.ok) {
          const result = await reportsRes.json();
          reportsData = result.data || [];
        }

        // Fetch users
        const usersRes = await fetch(`${apiUrl}/users?limit=200`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        let usersData = [];
        if (usersRes.ok) {
          const result = await usersRes.json();
          usersData = result.data || [];
        }

        // Fetch categories
        const categoriesRes = await fetch(`${apiUrl}/categories`);
        let categoriesCount = 6;
        if (categoriesRes.ok) {
          const result = await categoriesRes.json();
          categoriesCount = (result.data || []).length;
        }

        // Compile stats
        const totalReports = reportsData.length;
        const totalUsers = usersData.length;
        const resolvedCount = reportsData.filter(r => r.status === "selesai").length;
        const resolvedRate = totalReports > 0 ? parseFloat(((resolvedCount / totalReports) * 100).toFixed(1)) : 0;

        setStats({
          totalUsers,
          totalReports,
          totalCategories: categoriesCount,
          resolvedRate,
        });
        setReportList(reportsData);
      } catch (err) {
        console.error("Error fetching system stats:", err);
        setStats({ totalUsers: 0, totalReports: 0, totalCategories: 0, resolvedRate: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchSystemData();
  }, [session, apiUrl]);

  if (!session) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-[#111827]">
          <Shield className="w-7 h-7 inline-block mr-2 text-[#111827]" /> Dasbor Super Admin KataWarga
        </h1>
        <p className="text-sm text-[#6B6B8A]">
          Monitor performa platform, statistik pengguna, dan tren aduan warga secara real-time.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
              Total
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-[#111827]">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.totalUsers.toLocaleString()}
            </h3>
            <p className="text-xs font-semibold text-[#6B6B8A]">Pengguna Terdaftar</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <FileText className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              Total
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-[#111827]">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.totalReports.toLocaleString()}
            </h3>
            <p className="text-xs font-semibold text-[#6B6B8A]">Laporan Aduan</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-amber-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
              Rate
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-[#111827]">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : `${stats.resolvedRate}%`}
            </h3>
            <p className="text-xs font-semibold text-[#6B6B8A]">Tingkat Resolusi</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-50 rounded-xl">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
              Active
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-[#111827]">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.totalCategories}
            </h3>
            <p className="text-xs font-semibold text-[#6B6B8A]">Kategori Aktif</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-[#111827]">Aktivitas Sistem Terkini</h3>
          <p className="text-xs text-[#6B6B8A]">Laporan aduan dan aktivitas pengguna terbaru</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#192126]" />
            <span className="ml-2 text-sm text-[#6B6B8A]">Memuat aktivitas sistem...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {reportList.slice(0, 5).map((report) => (
              <div key={report.id} className="flex items-center gap-3 p-3 bg-[#FFFBF5] rounded-xl border border-[#E8E2D9]">
                <div className="p-1.5 bg-blue-50 rounded-lg">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#111827] truncate">{report.title}</p>
                  <p className="text-[10px] text-[#6B6B8A]">
                    {report.user_name} • {new Date(report.created_at).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  report.status === "selesai" ? "bg-green-100 text-green-700" :
                  report.status === "diproses" ? "bg-blue-100 text-blue-700" :
                  "bg-amber-100 text-amber-700"
                }`}>
                  {report.status}
                </span>
              </div>
            ))}

            {reportList.length === 0 && (
              <div className="text-center py-8 text-xs text-[#6B6B8A]">
                <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-[#E8E2D9]" />
                Tidak ada aktivitas sistem terbaru
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}