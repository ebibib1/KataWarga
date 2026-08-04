// ─────────────────────────────────────────────────────────────────────────────
// KataWarga — Shared Constants & Mock Data
// ─────────────────────────────────────────────────────────────────────────────

import {
  AlertTriangle,
  Zap,
  Layers,
  Globe,
  Activity,
  ShieldCheck,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

export const CATEGORIES = [
  {
    id: 1,
    name: "Jalan Rusak",
    icon: AlertTriangle,
    color: "#EF4444",
    bg: "bg-red-500/10 text-red-500",
    border: "border-red-200",
  },
  {
    id: 2,
    name: "Sampah",
    icon: Layers,
    color: "#22C55E",
    bg: "bg-green-500/10 text-green-600",
    border: "border-green-200",
  },
  {
    id: 3,
    name: "Banjir",
    icon: Activity,
    color: "#6366F1",
    bg: "bg-indigo-500/10 text-indigo-500",
    border: "border-indigo-200",
  },
  {
    id: 4,
    name: "Penerangan Jalan",
    icon: Zap,
    color: "#F59E0B",
    bg: "bg-amber-500/10 text-amber-500",
    border: "border-amber-200",
  },
  {
    id: 5,
    name: "Vandalisme",
    icon: ShieldCheck,
    color: "#8B5CF6",
    bg: "bg-violet-500/10 text-violet-500",
    border: "border-violet-200",
  },
  {
    id: 6,
    name: "Fasilitas Umum",
    icon: Globe,
    color: "#3B82F6",
    bg: "bg-blue-500/10 text-blue-500",
    border: "border-blue-200",
  },
];

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────

export const STATUS_CONFIG = {
  menunggu: {
    label: "Menunggu",
    icon: Clock,
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  diproses: {
    label: "Diproses",
    icon: Loader2,
    className: "bg-blue-50 text-blue-700 border-blue-200",
    spin: true,
  },
  selesai: {
    label: "Selesai",
    icon: CheckCircle2,
    className: "bg-green-50 text-green-700 border-green-200",
  },
  ditolak: {
    label: "Ditolak",
    icon: XCircle,
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

// ─── PRIORITY CONFIG ──────────────────────────────────────────────────────────

export const PRIORITY_CONFIG = {
  tinggi: {
    label: "Prioritas Tinggi",
    className: "bg-red-100 text-red-600",
    dot: "bg-red-500",
  },
  sedang: {
    label: "Prioritas Sedang",
    className: "bg-orange-100 text-orange-600",
    dot: "bg-orange-500",
  },
  rendah: {
    label: "Prioritas Rendah",
    className: "bg-slate-100 text-slate-500",
    dot: "bg-slate-400",
  },
};

// ─── FLAG REASONS ─────────────────────────────────────────────────────────────

export const FLAG_REASONS = {
  spam: "Spam",
  hoax: "Hoax / Informasi Palsu",
  tidak_relevan: "Tidak Relevan",
  konten_ofensif: "Konten Ofensif",
  lainnya: "Lainnya",
};

// (All mock data removed — the app now uses real API data exclusively)
