"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  UserPlus,
  Shield,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Edit3,
  Trash2,
  Eye,
  Calendar
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";

export default function AdminManagement() {
  const { data: session } = useSession();
  const [admins, setAdmins] = useState([]);
  const [adminStats, setAdminStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [adminReports, setAdminReports] = useState([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    if (session) {
      fetchAdmins();
    }
  }, [session]);

  useEffect(() => {
    if (admins.length > 0) {
      fetchAdminStats();
    }
  }, [admins]);

  const fetchAdmins = async () => {
    const token = session.accessToken || session.user?.accessToken;
    
    try {
      const res = await fetch(`${apiUrl}/users?role=admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const result = await res.json();
        setAdmins(result.data || []);
      }
    } catch (err) {
      console.error("Error fetching admins:", err);
    }
  };

  const fetchAdminStats = async () => {
    const token = session.accessToken || session.user?.accessToken;
    
    try {
      // Fetch reports to calculate admin performance
      const res = await fetch(`${apiUrl}/reports?limit=500`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const result = await res.json();
        const reports = result.data || [];
        
        // Calculate stats per admin
        const stats = admins.map(admin => {
          const adminReports = reports.filter(r => r.assigned_admin_id === admin.id);
          const resolved = adminReports.filter(r => r.status === "selesai").length;
          const pending = adminReports.filter(r => r.status === "menunggu").length;
          const processing = adminReports.filter(r => r.status === "diproses").length;
          
          return {
            ...admin,
            totalAssigned: adminReports.length,
            resolved,
            pending,
            processing,
            resolveRate: adminReports.length > 0 ? ((resolved / adminReports.length) * 100).toFixed(1) : 0
          };
        });
        
        setAdminStats(stats);
      }
    } catch (err) {
      console.error("Error fetching admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAdmin = (admin) => {
    setEditingAdmin({...admin});
  };

  const handleViewAdminDetail = async (admin) => {
    setSelectedAdmin(admin);
    
    // Fetch specific reports for this admin
    const token = session.accessToken || session.user?.accessToken;
    try {
      const res = await fetch(`${apiUrl}/reports?assigned_admin_id=${admin.id}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const result = await res.json();
        setAdminReports(result.data || []);
      }
    } catch (err) {
      console.error("Error fetching admin reports:", err);
    }
  };

  if (!session || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#192126]" />
        <span className="ml-2 text-sm text-[#6B6B8A]">Memuat data admin...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img 
            src="/assets/KataWarga_Logo.webp" 
            alt="KataWarga" 
            className="w-12 h-12 rounded-xl"
          />
          <div>
            <h1 className="text-2xl font-bold font-display text-[#111827]">
              Manajemen Tim Admin
            </h1>
            <p className="text-sm text-[#6B6B8A]">
              Kelola admin, pantau performa, dan monitor aktivitas tim moderasi.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#192126] text-white text-sm font-semibold rounded-xl hover:bg-[#2b2e2f] transition shadow-sm"
        >
          <UserPlus size={16} />
          Tambah Admin Baru
        </button>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
              Total
            </span>
          </div>
          <h3 className="text-2xl font-bold text-[#111827]">{admins.length}</h3>
          <p className="text-xs font-semibold text-[#6B6B8A]">Admin Aktif</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              Selesai
            </span>
          </div>
          <h3 className="text-2xl font-bold text-[#111827]">
            {adminStats.reduce((sum, admin) => sum + admin.resolved, 0)}
          </h3>
          <p className="text-xs font-semibold text-[#6B6B8A]">Laporan Diselesaikan</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-amber-50 rounded-xl">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
              Proses
            </span>
          </div>
          <h3 className="text-2xl font-bold text-[#111827]">
            {adminStats.reduce((sum, admin) => sum + admin.processing, 0)}
          </h3>
          <p className="text-xs font-semibold text-[#6B6B8A]">Sedang Diproses</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
              Rata-rata
            </span>
          </div>
          <h3 className="text-2xl font-bold text-[#111827]">
            {adminStats.length > 0 ? 
              (adminStats.reduce((sum, admin) => sum + parseFloat(admin.resolveRate), 0) / adminStats.length).toFixed(1) 
              : 0}%
          </h3>
          <p className="text-xs font-semibold text-[#6B6B8A]">Tingkat Resolusi</p>
        </div>
      </div>

      {/* Admin Performance Table */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E8E2D9]">
          <h3 className="text-lg font-bold text-[#111827]">Performa Individual Admin</h3>
          <p className="text-xs text-[#6B6B8A]">Monitor statistik kerja dan efektivitas setiap admin</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FFFBF5] border-b border-[#E8E2D9] text-[#6B6B8A] text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-5">Admin</th>
                <th className="py-3.5 px-4 text-center">Total Assigned</th>
                <th className="py-3.5 px-4 text-center">Selesai</th>
                <th className="py-3.5 px-4 text-center">Proses</th>
                <th className="py-3.5 px-4 text-center">Menunggu</th>
                <th className="py-3.5 px-4 text-center">Resolusi Rate</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D9]">
              {adminStats.map((admin) => (
                <tr key={admin.id} className="hover:bg-[#FFFBF5]/50 transition duration-150 text-sm">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={admin.avatar}
                        initials={admin.name?.split(" ").map(n => n[0]).join("").substring(0, 2)}
                        color="bg-[#192126]"
                        size="w-10 h-10"
                      />
                      <div>
                        <div className="font-semibold text-[#111827]">{admin.name}</div>
                        <div className="text-xs text-[#6B6B8A]">{admin.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center font-bold text-[#111827]">
                    {admin.totalAssigned}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-emerald-600 font-bold">{admin.resolved}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-blue-600 font-bold">{admin.processing}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-amber-600 font-bold">{admin.pending}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`font-bold ${
                      parseFloat(admin.resolveRate) >= 80 ? "text-emerald-600" :
                      parseFloat(admin.resolveRate) >= 60 ? "text-amber-600" : "text-[#192126]"
                    }`}>
                      {admin.resolveRate}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      admin.is_online ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                    }`}>
                      {admin.is_online ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleViewAdminDetail(admin)}
                        className="p-1.5 rounded-lg bg-[#FFFBF5] text-[#192126] hover:bg-[#192126] hover:text-white border border-[#E8E2D9] transition shadow-sm"
                        title="Lihat Detail Aktivitas"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleEditAdmin(admin)}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-100 transition shadow-sm"
                        title="Edit Admin"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        className="p-1.5 rounded-lg bg-[#192126]/10 text-[#192126] hover:bg-[#192126] hover:text-white border border-[#192126]/20 transition shadow-sm"
                        title="Hapus Admin"
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
      </div>

      {/* Admin Activity Detail Modal */}
      {selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/55 backdrop-blur-sm"
            onClick={() => setSelectedAdmin(null)}
          />
          
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl border border-[#E8E2D9] relative z-10">
            <div className="px-6 py-4 border-b border-[#E8E2D9] bg-[#FFFBF5]">
              <h3 className="text-lg font-bold text-[#111827]">
                Aktivitas Admin: {selectedAdmin.name}
              </h3>
              <p className="text-sm text-[#6B6B8A]">
                History penanganan laporan dan statistik performa
              </p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
              {/* Performance Charts Placeholder */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#FFFBF5] p-4 rounded-xl border border-[#E8E2D9]">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-[#192126]" />
                    <span className="text-xs font-bold text-[#6B6B8A]">TOTAL DITANGANI</span>
                  </div>
                  <div className="text-2xl font-bold text-[#111827]">{selectedAdmin.totalAssigned}</div>
                </div>
                
                <div className="bg-[#FFFBF5] p-4 rounded-xl border border-[#E8E2D9]">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-[#6B6B8A]">RESOLUSI RATE</span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-600">{selectedAdmin.resolveRate}%</div>
                </div>
                
                <div className="bg-[#FFFBF5] p-4 rounded-xl border border-[#E8E2D9]">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-[#6B6B8A]">RATA-RATA WAKTU</span>
                  </div>
                  <div className="text-2xl font-bold text-amber-600">2.3 hari</div>
                </div>
              </div>

              {/* Recent Activity Timeline */}
              <div>
                <h4 className="text-sm font-bold text-[#111827] mb-3">Timeline Aktivitas Terbaru</h4>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {adminReports.length > 0 ? (
                    adminReports.slice(0, 10).map((report) => (
                      <div key={report.id} className="flex items-start gap-3 p-3 bg-[#FFFBF5] rounded-xl border border-[#E8E2D9]">
                        <div className="w-2 h-2 rounded-full bg-[#192126] mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-[#111827]">
                              Menangani laporan #{report.id}: "{report.title?.substring(0, 40)}..."
                            </span>
                            <span className="text-[#6B6B8A]">•</span>
                            <span className="text-[#6B6B8A]">
                              {new Date(report.updated_at || report.created_at).toLocaleDateString("id-ID")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              report.status === "selesai" ? "bg-emerald-100 text-emerald-800" :
                              report.status === "diproses" ? "bg-blue-100 text-blue-800" :
                              "bg-amber-100 text-amber-800"
                            }`}>
                              {report.status}
                            </span>
                            <span className="text-xs text-[#6B6B8A]">
                              Kategori: {report.category_name || "Umum"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs text-[#6B6B8A]">
                      Belum ada aktivitas untuk admin ini
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/55 backdrop-blur-sm"
            onClick={() => setEditingAdmin(null)}
          />
          
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-[#E8E2D9] relative z-10">
            <div className="px-6 py-4 border-b border-[#E8E2D9] bg-[#FFFBF5]">
              <h3 className="text-lg font-bold text-[#111827]">
                Edit Admin: {editingAdmin.name}
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#6B6B8A] mb-2">Nama Lengkap</label>
                <input
                  type="text"
                  value={editingAdmin.name}
                  onChange={(e) => setEditingAdmin({...editingAdmin, name: e.target.value})}
                  className="w-full px-3 py-2 bg-[#FFFBF5] border border-[#E8E2D9] rounded-xl text-sm focus:border-[#192126] outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-[#6B6B8A] mb-2">Email</label>
                <input
                  type="email"
                  value={editingAdmin.email}
                  onChange={(e) => setEditingAdmin({...editingAdmin, email: e.target.value})}
                  className="w-full px-3 py-2 bg-[#FFFBF5] border border-[#E8E2D9] rounded-xl text-sm focus:border-[#192126] outline-none"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    // Handle update admin logic here
                    alert("Update admin functionality - integrate with API");
                    setEditingAdmin(null);
                  }}
                  className="flex-1 py-2.5 bg-[#192126] text-white font-semibold text-sm rounded-xl hover:bg-[#2b2e2f] transition"
                >
                  Simpan Perubahan
                </button>
                <button
                  onClick={() => setEditingAdmin(null)}
                  className="px-4 py-2.5 bg-[#E8E2D9] text-[#6B6B8A] font-semibold text-sm rounded-xl hover:bg-[#D1C9B8] transition"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}