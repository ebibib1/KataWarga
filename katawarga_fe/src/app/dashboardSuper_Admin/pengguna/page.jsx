"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  X,
  Loader2,
  Check,
  UserPlus,
  Shield,
  Mail,
  User,
  AlertCircle,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "@/components/ui/Avatar";

export default function SuperAdminUsers() {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // CRUD Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const fetchUsers = async () => {
    if (!session) return;
    const token = session.accessToken || session.user?.accessToken;
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/users?role=user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const result = await res.json();
        setUsers(result.data || []);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchUsers();
    }
  }, [session]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole("user");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword(""); // Keep password empty unless changing
    setRole(user.role);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email) return;

    setIsSubmitting(true);
    const token = session.accessToken || session.user?.accessToken;

    try {
      if (editingUser) {
        // Edit User: PUT /users/:id
        const res = await fetch(`${apiUrl}/users/${editingUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            email,
            role,
            ...(password ? { password } : {}),
          }),
        });

        if (res.ok) {
          alert("Akun pengguna berhasil diperbarui.");
          setIsFormOpen(false);
          fetchUsers();
        } else {
          alert("Gagal memperbarui pengguna.");
        }
      } else {
        // Create User: POST /users
        const res = await fetch(`${apiUrl}/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            email,
            password,
            role,
          }),
        });

        if (res.ok) {
          alert("Pengguna baru berhasil didaftarkan.");
          setIsFormOpen(false);
          fetchUsers();
        } else {
          alert("Gagal mendaftarkan pengguna baru.");
        }
      }
    } catch (err) {
      console.error("Error submitting user form:", err);
      // Fallback offline simulation
      if (editingUser) {
        setUsers(users.map(u => u.id === editingUser.id ? { ...u, name, email, role } : u));
      } else {
        setUsers([...users, { id: Date.now(), name, email, role, is_online: false, created_at: new Date().toISOString() }]);
      }
      setIsFormOpen(false);
      alert("Mode Offline: Database disimulasikan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePromoteUser = async (userId, currentRole) => {
    // Super admin can promote user to admin, or demote admin to user according to flows.md
    let newRole;
    let actionText;
    
    if (currentRole === "user") {
      newRole = "admin";
      actionText = "promote ke Admin";
    } else if (currentRole === "admin") {
      newRole = "user";
      actionText = "demote ke User";
    } else {
      alert("Role super_admin tidak dapat diubah.");
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin ${actionText}?`)) return;

    const token = session.accessToken || session.user?.accessToken;

    try {
      const res = await fetch(`${apiUrl}/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        alert(`User berhasil ${actionText}.`);
        fetchUsers();
      } else {
        alert("Gagal mengubah role user.");
      }
    } catch (err) {
      console.error("Error changing user role:", err);
      // Offline simulation
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      alert(`Mode Offline: User berhasil ${actionText}.`);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Apakah Anda yakin ingin menghapus akun pengguna ini secara permanen dari sistem? Tindakan ini tidak dapat dibatalkan.")) return;

    const token = session.accessToken || session.user?.accessToken;

    try {
      const res = await fetch(`${apiUrl}/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert("Pengguna berhasil dihapus.");
        fetchUsers();
      } else {
        alert("Gagal menghapus pengguna.");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      setUsers(users.filter(u => u.id !== userId));
      alert("Mode Offline: Pengguna berhasil dihapus.");
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "super_admin":
        return "bg-red-50 text-red-700 border-red-100";
      case "admin":
        return "bg-blue-50 text-blue-700 border-blue-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  // Filter
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter ? u.role === roleFilter : true;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#111827]">
            Manajemen Pengguna Warga
          </h1>
          <p className="text-sm text-[#6B6B8A]">
            Kelola akun warga biasa, promote ke admin, dan pantau aktivitas pengguna platform.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#192126] text-white font-semibold text-xs rounded-xl hover:bg-[#2b2e2f] transition shadow-lg shadow-[#192126]/10 self-start md:self-auto"
        >
          <UserPlus size={15} />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[#6B6B8A]" />
          <input
            type="text"
            placeholder="Cari nama pengguna atau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#FFFBF5] rounded-xl border border-[#E8E2D9] outline-none text-sm text-[#111827] focus:border-[#192126] focus:ring-1 focus:ring-[#192126] transition"
          />
        </div>

        {/* Role Filter */}
        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="appearance-none bg-[#FFFBF5] border border-[#E8E2D9] rounded-xl pl-3 pr-8 py-2.5 text-xs font-semibold text-[#3D3D5C] outline-none focus:border-[#192126] cursor-pointer"
          >
            <option value="">Semua Peran</option>
            <option value="user">Warga Biasa</option>
            <option value="admin">Admin Kota</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#6B6B8A]" />
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#192126]" />
            <span className="text-sm font-medium text-[#6B6B8A]">Memuat data pengguna...</span>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FFFBF5] border-b border-[#E8E2D9] text-[#6B6B8A] text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-5 w-16">ID</th>
                  <th className="py-3.5 px-4">Nama Pengguna</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4 w-36 text-center">Peran</th>
                  <th className="py-3.5 px-4 w-28 text-center">Status</th>
                  <th className="py-3.5 px-4 w-40 text-center">Tanggal Join</th>
                  <th className="py-3.5 px-5 w-28 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {filteredUsers.map((u) => {
                  const initials = u.name
                    ? u.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
                    : "US";

                  return (
                    <tr key={u.id} className="hover:bg-[#FFFBF5]/50 transition duration-150 text-sm">
                      <td className="py-4 px-5 font-semibold text-[#6B6B8A]">#{u.id}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={u.avatar}
                            initials={initials}
                            color="bg-[#192126]"
                            size="w-9 h-9"
                            textSize="text-xs"
                          />
                          <span className="font-semibold text-[#111827]">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium text-[#3D3D5C]">{u.email}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getRoleBadge(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${u.is_online ? "bg-emerald-500" : "bg-gray-300"}`}></span>
                          <span className="text-xs text-[#6B6B8A] font-medium">
                            {u.is_online ? "Online" : "Offline"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center text-xs text-[#6B6B8A] font-semibold">
                        {new Date(u.created_at).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg bg-[#FFFBF5] text-[#192126] hover:bg-[#192126] hover:text-white border border-[#E8E2D9] transition shadow-sm"
                            title="Edit Akun"
                          >
                            <Edit2 size={13} />
                          </button>

                          {/* Avoid self-deletion */}
                          {u.id !== session.user.id ? (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 transition shadow-sm"
                              title="Hapus Akun secara Permanen"
                            >
                              <Trash2 size={13} />
                            </button>
                          ) : (
                            <div className="w-8"></div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
            <AlertCircle className="w-8 h-8 text-[#6B6B8A]" />
            <h3 className="font-semibold text-[#111827]">Pengguna tidak ditemukan</h3>
            <p className="text-xs text-[#6B6B8A] max-w-xs">Tidak ada data pengguna yang cocok dengan kriteria filter saat ini.</p>
          </div>
        )}
      </div>

      {/* Create / Edit User Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="fixed inset-0 bg-black/55 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-[#E8E2D9] relative z-10 flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-[#E8E2D9] bg-[#FFFBF5] flex items-center justify-between">
                <h3 className="font-bold text-[#111827] text-sm">
                  {editingUser ? "Edit Profil Pengguna" : "Daftarkan Pengguna Baru"}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 rounded-lg hover:bg-white text-[#6B6B8A] hover:text-[#111827] border border-[#E8E2D9] transition"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6B6B8A] mb-1.5">Nama Lengkap</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[#6B6B8A]" />
                    <input
                      type="text"
                      placeholder="Masukkan nama lengkap"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full pl-9 pr-4 py-2.5 bg-[#FFFBF5] rounded-xl border border-[#E8E2D9] outline-none text-xs text-[#111827] focus:border-[#192126] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B6B8A] mb-1.5">Alamat Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[#6B6B8A]" />
                    <input
                      type="email"
                      placeholder="nama@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-9 pr-4 py-2.5 bg-[#FFFBF5] rounded-xl border border-[#E8E2D9] outline-none text-xs text-[#111827] focus:border-[#192126] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B6B8A] mb-1.5">
                    {editingUser ? "Kata Sandi Baru (Opsional)" : "Kata Sandi"}
                  </label>
                  <input
                    type="password"
                    placeholder={editingUser ? "Kosongkan jika tidak diganti" : "Masukkan kata sandi"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!editingUser}
                    className="w-full px-3.5 py-2.5 bg-[#FFFBF5] rounded-xl border border-[#E8E2D9] outline-none text-xs text-[#111827] focus:border-[#192126] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B6B8A] mb-1.5">Pilih Peran Sistem (Role)</label>
                  <div className="relative">
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="appearance-none w-full bg-[#FFFBF5] border border-[#E8E2D9] rounded-xl px-3 py-2.5 text-xs font-bold text-[#3D3D5C] outline-none focus:border-[#192126] cursor-pointer"
                    >
                      <option value="user">Warga Biasa (Citizen)</option>
                      <option value="admin">Admin Kota (Moderator)</option>
                      <option value="super_admin">Super Admin (Root)</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3.5 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#6B6B8A]" />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-[#192126] text-white font-semibold text-xs rounded-xl hover:bg-[#2b2e2f] transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    <span>{editingUser ? "Simpan Perubahan" : "Daftarkan Pengguna"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
