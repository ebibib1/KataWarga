"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Check,
  HelpCircle,
  Tag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_CATEGORIES = [
  { id: 1, category_name: "Jalan Rusak", icon: "road" },
  { id: 2, category_name: "Penerangan Jalan", icon: "light" },
  { id: 3, category_name: "Sampah & Kebersihan", icon: "trash" },
  { id: 4, category_name: "Fasilitas Umum", icon: "building" },
  { id: 5, category_name: "Banjir & Drainase", icon: "water" },
  { id: 6, category_name: "Keamanan", icon: "shield" }
];

export default function AdminCategories() {
  const { data: session } = useSession();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [categoryName, setCategoryName] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("tag");
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/categories`);
      if (res.ok) {
        const result = await res.json();
        setCategories(result.data || DEFAULT_CATEGORIES);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleEditClick = (cat) => {
    setEditingId(cat.id);
    setCategoryName(cat.category_name);
    setCategoryIcon(cat.icon || "tag");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setCategoryName("");
    setCategoryIcon("tag");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setIsSubmitting(true);
    const token = session.accessToken || session.user?.accessToken;

    try {
      if (editingId) {
        // Edit Category: PUT /categories/:id
        const res = await fetch(`${apiUrl}/categories/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            category_name: categoryName,
            icon: categoryIcon,
          }),
        });

        if (res.ok) {
          alert("Kategori berhasil diperbarui.");
          setEditingId(null);
          setCategoryName("");
          setCategoryIcon("tag");
          fetchCategories();
        } else {
          alert("Gagal memperbarui kategori.");
        }
      } else {
        // Create Category: POST /categories
        const res = await fetch(`${apiUrl}/categories`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            category_name: categoryName,
            icon: categoryIcon,
          }),
        });

        if (res.ok) {
          alert("Kategori baru berhasil ditambahkan.");
          setCategoryName("");
          setCategoryIcon("tag");
          fetchCategories();
        } else {
          alert("Gagal menambahkan kategori baru.");
        }
      }
    } catch (err) {
      console.error("Error submitting category:", err);
      // Fallback offline simulation
      if (editingId) {
        setCategories(categories.map(c => c.id === editingId ? { ...c, category_name: categoryName, icon: categoryIcon } : c));
        setEditingId(null);
      } else {
        setCategories([...categories, { id: Date.now(), category_name: categoryName, icon: categoryIcon }]);
      }
      setCategoryName("");
      setCategoryIcon("tag");
      alert("Mode Offline: Aksi kategori disimulasikan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-[#111827]">
          Kelola Kategori Masalah
        </h1>
        <p className="text-sm text-[#6B6B8A]">
          Konfigurasi jenis aduan warga, penanda ikon, dan parameter kategorisasi sistem.
        </p>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories List (Left - Column 2) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#111827]">Daftar Kategori Aktif</h3>

          {loading ? (
            <div className="py-16 flex items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#192126]" />
              <span className="text-xs text-[#6B6B8A]">Memuat kategori...</span>
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-4 bg-[#FFFBF5] rounded-xl border border-[#E8E2D9] flex items-center justify-between hover:border-[#192126] transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#192126] flex items-center justify-center">
                      <Layers size={18} />
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-[#111827]">{cat.category_name}</span>
                      <span className="block text-[10px] text-[#6B6B8A] font-mono">Ikon: {cat.icon || "default"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Edit */}
                    <button
                      onClick={() => handleEditClick(cat)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-[#6B6B8A] hover:text-[#192126] transition"
                      title="Edit Kategori"
                    >
                      <Edit2 size={13} />
                    </button>

                    {/* Delete (Disabled for admin, showing Super Admin notice) */}
                    <button
                      className="p-1.5 rounded-lg text-rose-350 hover:bg-rose-50 text-rose-300 opacity-50 cursor-not-allowed"
                      title="Hapus Kategori (Hanya Super Admin)"
                      onClick={() => alert("Menghapus kategori secara permanen memerlukan hak akses Super Admin.")}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-[#6B6B8A]">Kategori belum tersedia.</div>
          )}
        </div>

        {/* Category Form (Right - Column 1) */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm h-fit">
          <h3 className="text-sm font-bold text-[#111827] mb-4">
            {editingId ? "Edit Kategori" : "Tambah Kategori Baru"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#6B6B8A] mb-1.5">Nama Kategori</label>
              <input
                type="text"
                placeholder="Contoh: Lampu Padam"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-[#FFFBF5] rounded-xl border border-[#E8E2D9] outline-none text-xs text-[#111827] focus:border-[#192126] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6B6B8A] mb-1.5">Kode Ikon (Font/Lucide)</label>
              <input
                type="text"
                placeholder="Contoh: road, shield, trash, water"
                value={categoryIcon}
                onChange={(e) => setCategoryIcon(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-[#FFFBF5] rounded-xl border border-[#E8E2D9] outline-none text-xs text-[#111827] focus:border-[#192126] transition"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-[#192126] text-white font-semibold text-xs rounded-xl hover:bg-[#2b2e2f] transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : editingId ? (
                  <Check size={14} />
                ) : (
                  <Plus size={14} />
                )}
                <span>{editingId ? "Simpan" : "Tambah"}</span>
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-2.5 bg-[#FFFBF5] text-[#3D3D5C] font-semibold text-xs rounded-xl border border-[#E8E2D9] hover:bg-[#EDE7D9] transition"
                >
                  Batal
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 border-t border-[#E8E2D9] pt-4 text-[10px] text-[#6B6B8A] flex items-start gap-1.5 font-medium leading-relaxed">
            <HelpCircle size={14} className="text-[#192126] shrink-0 mt-0.5" />
            <span>Pastikan kode ikon yang dimasukkan sesuai dengan nama modul ikon Lucide-react (seperti: road, trash, light, building, water, shield).</span>
          </div>
        </div>
      </div>
    </div>
  );
}
