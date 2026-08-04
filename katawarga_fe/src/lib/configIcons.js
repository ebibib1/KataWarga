// configIcons.js — Lucide icon map for categories and statuses
// This file is the ONLY place icons are mapped. Pages get category data from
// the API (/api/config), then use this map to resolve the icon component.
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

/** Map category name (from DB) → Lucide icon component */
export const CATEGORY_ICONS = {
  "Jalan Rusak":      AlertTriangle,
  "Sampah":           Layers,
  "Banjir":           Activity,
  "Penerangan Jalan": Zap,
  "Vandalisme":       ShieldCheck,
  "Fasilitas Umum":   Globe,
};

/** Map status key → Lucide icon component */
export const STATUS_ICONS = {
  menunggu: Clock,
  diproses: Loader2,
  selesai:  CheckCircle2,
  ditolak:  XCircle,
  draft:    Clock,
};
