"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useConfig } from "@/hooks/useConfig";
import {
  ImageIcon,
  MapPin,
  Tag,
  AlertTriangle,
  X,
  Send,
  Save,
  CheckCircle2,
  Loader2,
  Navigation,
  RotateCcw,
} from "lucide-react";

const LocationPickerMap = dynamic(() => import("@/components/LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-40 rounded-2xl bg-[#F5F0E8] flex items-center justify-center border border-[#E8E2D9]">
      <div className="flex flex-col items-center gap-1.5 text-xs font-semibold text-[#6B6B8A]">
        <Loader2 size={18} className="animate-spin text-[#192126]" />
        Memuat peta lokasi...
      </div>
    </div>
  ),
});

const MAX_CHARS = 500;

function BuatLaporanContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");

  const [title,        setTitle]        = useState("");
  const [description,  setDescription]  = useState("");
  const [category,     setCategory]     = useState("");
  const [priority,     setPriority]     = useState("sedang");
  const [tags,         setTags]         = useState("");
  const [address,      setAddress]      = useState("");
  const [coords,       setCoords]       = useState(null);

  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [isUploading,  setIsUploading]  = useState(false);

  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [submitError,   setSubmitError]   = useState("");
  const [isLoadingDraft, setIsLoadingDraft] = useState(!!draftId);

  const fileInputRef = useRef(null);

  const token = session?.accessToken;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const { config } = useConfig();
  const categories = config?.categories || [];

  // ── Fetch draft if draftId exists ──────────────────────────────────────────
  useEffect(() => {
    if (!draftId || !token) return;
    setIsLoadingDraft(true);
    fetch(`${apiUrl}/reports/${draftId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Draft tidak ditemukan");
        return res.json();
      })
      .then((data) => {
        const r = data.data;
        setTitle(r.title || "");
        setDescription(r.description || "");
        setCategory(r.category_id ? String(r.category_id) : "");
        setPriority(r.priority || "sedang");
        setAddress(r.address || "");
        if (r.latitude && r.longitude) {
          setCoords({ lat: parseFloat(r.latitude), lng: parseFloat(r.longitude) });
        }
        if (r.hashtags) {
          setTags(r.hashtags.map((h) => h.replace("#", "")).join(", "));
        }
        if (r.image) {
          setExistingImage(r.image);
          setImagePreview(r.image);
        }
      })
      .catch((err) => {
        console.error("Fetch draft error:", err);
        setSubmitError("Gagal memuat draft.");
      })
      .finally(() => setIsLoadingDraft(false));
  }, [draftId, token, apiUrl]);

  // Redirect ke login jika belum login
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    }
  }, [status, router]);

  // Guard: loading session
  if (status === "loading") {
    return (
      <div className="flex flex-col h-full items-center justify-center min-h-[400px] gap-3">
        <Loader2 size={28} className="animate-spin text-[#192126]" />
        <p className="text-sm text-[#6B6B8A]">Memeriksa sesi login...</p>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  // ── Image selection ───────────────────────────────────────────────────────
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file maksimum adalah 5MB.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setImageFile(file);
      setExistingImage(null);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setExistingImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLocationSelect = ({ lat, lng, addressText }) => {
    setCoords({ lat, lng });
    if (addressText) setAddress(addressText);
  };

  // ── API call helper ──────────────────────────────────────────────────────
  const sendReport = async (statusValue) => {
    setSubmitError("");

    if (!token) {
      setSubmitError("Sesi login habis. Silakan logout lalu login ulang.");
      return;
    }

    if (!title.trim()) {
      setSubmitError("Judul laporan wajib diisi.");
      return;
    }

    // For publish, require more fields
    if (statusValue !== "draft") {
      if (!category) {
        setSubmitError("Pilih kategori laporan terlebih dahulu.");
        return;
      }
      if (!description.trim() || description.trim().length < 20) {
        setSubmitError("Deskripsi minimal 20 karakter.");
        return;
      }
    }

    const isUpdate = !!draftId;
    const method = isUpdate ? "PUT" : "POST";
    const url = isUpdate ? `${apiUrl}/reports/${draftId}` : `${apiUrl}/reports`;

    if (statusValue !== "draft") {
      setIsSubmitting(true);
    } else {
      setIsSavingDraft(true);
    }

    try {
      const formData = new FormData();
      formData.append("title",       title.trim());
      formData.append("description", description.trim());
      formData.append("category_id", category);
      formData.append("priority",    priority);
      formData.append("address",     address.trim());
      formData.append("hashtags",    tags.trim());
      formData.append("status",      statusValue);
      if (coords) {
        formData.append("latitude",  coords.lat);
        formData.append("longitude", coords.lng);
      }
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const msg = statusValue === "draft" ? "Draft berhasil disimpan." : "Laporan berhasil dikirim!";
        setSuccessMessage(msg);
        setSubmitSuccess(true);

        setTimeout(() => {
          router.push("/homepageUser/laporan");
        }, 2000);
      } else {
        const errData = await res.json().catch(() => ({}));
        setSubmitError(errData.message || `Gagal (${res.status}). Pastikan backend berjalan.`);
      }
    } catch (err) {
      console.error("Submit report error:", err);
      setSubmitError("Tidak dapat terhubung ke server. Pastikan backend berjalan di port 5000.");
    } finally {
      setIsSubmitting(false);
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendReport("menunggu");
  };

  const handleSaveDraft = () => {
    sendReport("draft");
  };

  if (submitSuccess) {
    return (
      <div className="flex flex-col h-full bg-[#FFFBF5] items-center justify-center p-8 text-center gap-4 min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center border border-green-200">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h2 className="font-bold text-lg text-[#111827]">{successMessage}</h2>
        <p className="text-xs text-[#B0A898]">Mengalihkan...</p>
      </div>
    );
  }

  if (isLoadingDraft) {
    return (
      <div className="flex flex-col h-full bg-[#FFFBF5] items-center justify-center min-h-[400px] gap-3">
        <Loader2 size={28} className="animate-spin text-[#192126]" />
        <p className="text-sm text-[#6B6B8A]">Memuat draft...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#FFFBF5]">
      <div className="hidden md:flex items-center justify-between px-5 py-3.5 bg-[#FFFBF5]/80 backdrop-blur-md sticky top-0 z-20 border-b border-[#E8E2D9]">
        <div>
          <h1 className="font-bold text-base text-[#111827]">
            {draftId ? "Edit Draft Laporan" : "Buat Laporan Baru"}
          </h1>
          <p className="text-[11px] text-[#6B6B8A]">
            Suarakan keluhan Anda untuk kota yang lebih baik
          </p>
        </div>
      </div>

      <div className="p-4 md:p-6 flex flex-col gap-4 max-w-2xl mx-auto w-full">
        <div className="bg-white border border-[#E8E2D9] rounded-3xl p-5 md:p-6 shadow-sm">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {submitError && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700">
                <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider mb-1.5">
                Judul Laporan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tuliskan ringkasan masalah (contoh: Jalan Berlubang Parah di RT 03)"
                className="w-full px-4 py-3 bg-white border border-[#E8E2D9] rounded-xl text-sm text-[#111827] placeholder-[#B0A898] focus:outline-none focus:border-[#192126] focus:ring-2 focus:ring-[#192126]/10 transition"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider mb-1.5">
                  Kategori Laporan <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-[#E8E2D9] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#192126] focus:ring-2 focus:ring-[#192126]/10 transition appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "1.25rem",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  <option value="">Pilih Kategori...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider mb-1.5">
                  Tingkat Prioritas
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: "rendah", label: "Rendah", color: "bg-slate-400" },
                    { val: "sedang", label: "Sedang", color: "bg-orange-500" },
                    { val: "tinggi", label: "Tinggi", color: "bg-red-500" },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setPriority(p.val)}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-1.5 ${
                        priority === p.val
                          ? "bg-[#192126] text-white border-[#192126] shadow-md shadow-blue-500/15"
                          : "bg-[#FFFBF5] text-[#3D3D5C] border-[#E8E2D9] hover:bg-[#F5F0E8]"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${priority === p.val ? "bg-white" : p.color}`} />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                  Deskripsi Masalah <span className="text-red-500">*</span>
                </label>
                <span className={`text-[10px] font-semibold ${description.length > MAX_CHARS - 20 ? "text-red-500" : "text-[#B0A898]"}`}>
                  {description.length}/{MAX_CHARS}
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, MAX_CHARS))}
                placeholder="Tuliskan secara detail: apa masalahnya, kapan terjadi, dan mengapa memerlukan penanganan segera..."
                rows={4}
                className="w-full px-4 py-3 bg-white border border-[#E8E2D9] rounded-xl text-sm text-[#111827] placeholder-[#B0A898] focus:outline-none focus:border-[#192126] focus:ring-2 focus:ring-[#192126]/10 transition resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider mb-1.5">
                Foto Bukti Masalah (Opsional)
              </label>
              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-[#E8E2D9] bg-[#FFFBF5] h-48">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#E8E2D9] hover:border-[#192126]/40 bg-[#FFFBF5]/50 hover:bg-white rounded-2xl p-6 cursor-pointer group transition">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    disabled={isUploading}
                  />
                  {isUploading ? (
                    <div className="flex flex-col items-center py-2 gap-2">
                      <Loader2 size={22} className="animate-spin text-[#192126]" />
                      <span className="text-xs font-semibold text-[#6B6B8A]">Memproses foto...</span>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="text-[#B0A898] group-hover:text-[#192126] mb-2 transition" size={26} />
                      <span className="text-xs font-bold text-[#111827]">Klik untuk memilih foto</span>
                      <span className="text-[10px] text-[#6B6B8A] mt-1">PNG, JPG, JPEG hingga 5MB</span>
                    </>
                  )}
                </label>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MapPin size={13} className="text-[#192126]" />
                Pilih Lokasi Kejadian
                {coords && (
                  <span className="ml-auto text-[10px] font-normal text-green-600 flex items-center gap-1">
                    <CheckCircle2 size={10} />
                    Lokasi dipilih
                  </span>
                )}
              </label>

              <div className="rounded-2xl overflow-hidden border border-[#E8E2D9]" style={{ height: "200px" }}>
                <LocationPickerMap
                  onLocationSelect={handleLocationSelect}
                  initialCoords={coords}
                />
              </div>

              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ketik alamat atau klik peta untuk memilih titik lokasi..."
                className="w-full px-4 py-3 bg-white border border-[#E8E2D9] rounded-xl text-sm text-[#111827] placeholder-[#B0A898] focus:outline-none focus:border-[#192126] focus:ring-2 focus:ring-[#192126]/10 transition mt-2.5"
              />

              {coords && (
                <p className="text-[10px] text-[#6B6B8A] mt-1 flex items-center gap-1">
                  <Navigation size={10} className="text-[#192126]" />
                  Koordinat: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                  <button
                    type="button"
                    onClick={() => { setCoords(null); setAddress(""); }}
                    className="ml-auto text-red-400 hover:text-red-600 flex items-center gap-0.5 transition"
                  >
                    <RotateCcw size={9} /> Reset
                  </button>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider mb-1.5">
                Topik / Tags (Pisahkan dengan Koma)
              </label>
              <div className="relative">
                <Tag size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B0A898]" />
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="jalanrusak, lobang, jaksel (tanpa tanda #)"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#E8E2D9] rounded-xl text-sm text-[#111827] placeholder-[#B0A898] focus:outline-none focus:border-[#192126] focus:ring-2 focus:ring-[#192126]/10 transition"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-[#FFFBF5]">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSavingDraft || isSubmitting}
                className={`flex-1 py-3 border text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                  isSavingDraft
                    ? "bg-[#F5F0E8] text-[#6B6B8A] border-[#E8E2D9] cursor-not-allowed"
                    : "bg-[#FFFBF5] hover:bg-[#F5F0E8] border-[#E8E2D9] text-[#3D3D5C]"
                }`}
              >
                {isSavingDraft ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Simpan Draft
                  </>
                )}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isSavingDraft}
                className={`flex-1 py-3 font-bold rounded-xl transition flex items-center justify-center gap-1.5 text-xs shadow-md ${
                  isSubmitting
                    ? "bg-[#192126]/60 text-white cursor-not-allowed"
                    : "bg-[#192126] hover:bg-[#2b2e2f] text-white shadow-[#192126]/20 active:scale-[0.98]"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    {draftId ? "Publikasikan Draft" : "Kirim Laporan"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function BuatLaporanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 bg-[#FFFBF5] flex items-center justify-center text-xs font-semibold text-[#6B6B8A] py-12">
          Memuat halaman buat laporan...
        </div>
      }
    >
      <BuatLaporanContent />
    </Suspense>
  );
}
