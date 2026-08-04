"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, CheckCircle2, XCircle, Radio, ChevronRight } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function MyReportSummary() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({ total: 0, diproses: 0, selesai: 0, ditolak: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const token = session?.accessToken || session?.user?.accessToken;
      if (!token) { setIsLoading(false); return; }

      try {
        const res = await fetch(`${API_URL}/reports?mine=true&limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const reports = data.data || [];
          setStats({
            total:    reports.length,
            diproses: reports.filter(r => r.status === "diproses").length,
            selesai:  reports.filter(r => r.status === "selesai").length,
            ditolak:  reports.filter(r => r.status === "ditolak").length,
          });
        }
      } catch (err) {
        console.error("MyReportSummary fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [session]);

  const STAT_ITEMS = [
    { label: "Total",   count: stats.total,    icon: FileText,     color: "text-[#192126] bg-blue-50",  borderColor: "border-blue-100" },
    { label: "Proses",  count: stats.diproses, icon: Loader2,      color: "text-amber-600 bg-amber-50", borderColor: "border-amber-100" },
    { label: "Selesai", count: stats.selesai,  icon: CheckCircle2, color: "text-green-600 bg-green-50", borderColor: "border-green-100" },
    { label: "Ditolak", count: stats.ditolak,  icon: XCircle,      color: "text-red-500 bg-red-50",     borderColor: "border-red-100" },
  ];

  return (
    <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-[#111827] flex items-center gap-2">
          <Radio size={13} className="text-[#22C55E] animate-pulse" />
          Status Laporan Saya
        </h3>
        <button
          onClick={() => router.push("/homepageUser/laporan")}
          className="text-[11px] text-[#192126] font-semibold hover:underline flex items-center gap-1"
        >
          Lihat semua <ChevronRight size={12} />
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-[#F0EAE0] animate-pulse bg-[#F5F0E8] h-20" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {STAT_ITEMS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                onClick={() => router.push("/homepageUser/laporan")}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border ${stat.borderColor} cursor-pointer hover:shadow-sm transition`}
              >
                <div className={`w-8 h-8 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <Icon size={14} className={stat.label === "Proses" ? "animate-spin" : ""} />
                </div>
                <span className="font-bold text-base text-[#111827]">{stat.count}</span>
                <span className="text-[10px] text-[#6B6B8A] font-medium">{stat.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
