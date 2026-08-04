import React from "react";
import Link from "next/link";
import { AlertTriangle, ExternalLink } from "lucide-react";

export default function DevelopmentBanner({ featureName }) {
  return (
    <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm text-[#3D3D5C] shadow-sm">
      <div className="flex gap-2.5 items-start">
        <AlertTriangle className="text-[#192126] flex-shrink-0 mt-0.5" size={18} />
        <div>
          <span className="font-bold text-[#111827]">Fitur Belum Berfungsi:</span> Halaman <span className="font-semibold text-[#192126]">{featureName}</span> ini adalah mockup UI interaktif. Integrasi fungsional backend masih dalam pengembangan.
        </div>
      </div>
      <Link
        href="/homepageUser/fitur-tunda"
        className="px-3.5 py-1.5 bg-white border border-[#E8E2D9] text-xs font-bold rounded-xl text-[#192126] hover:bg-[#F5F0E8] transition flex items-center gap-1.5 self-start sm:self-auto shrink-0"
      >
        Lihat Kendala &amp; Roadmap
        <ExternalLink size={12} />
      </Link>
    </div>
  );
}
