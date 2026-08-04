"use client";

import { Clock, Flame, Star, CheckCircle2, SlidersHorizontal } from "lucide-react";
import { useConfig } from "@/hooks/useConfig";
import { CATEGORY_ICONS } from "@/lib/configIcons";

const TABS = [
  { id: "terbaru",  label: "Terbaru",  icon: Clock        },
  { id: "trending", label: "Trending", icon: Flame        },
  { id: "populer",  label: "Populer",  icon: Star         },
  { id: "selesai",  label: "Selesai",  icon: CheckCircle2 },
];

export default function FeedFilters({
  activeFilter,
  setActiveFilter,
  activeCategory,
  setActiveCategory,
}) {
  const { config } = useConfig();
  const categories = config?.categories || [];

  return (
    <div className="bg-white border-b border-[#E8E2D9] sticky top-0 z-10">
      {/* Tabs */}
      <div className="flex overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                active
                  ? "text-[#192126] border-[#192126]"
                  : "text-[#6B6B8A] border-transparent hover:text-[#111827] hover:bg-[#FFFBF5]"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
        <div className="ml-auto flex items-center px-3">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E2D9] text-xs font-semibold text-[#6B6B8A] hover:bg-[#F5F0E8] transition">
            <SlidersHorizontal size={13} />
            Filter
          </button>
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none px-4 py-2">
        <button
          onClick={() => setActiveCategory("semua")}
          className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition ${
            activeCategory === "semua"
              ? "bg-[#111827] text-white"
              : "bg-[#F5F0E8] text-[#6B6B8A] hover:bg-[#E8E2D9]"
          }`}
        >
          Semua
        </button>
        {categories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.name];
          const active = activeCategory === cat.name;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.name)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition ${
                active
                  ? `${cat.bg} border border-opacity-30`
                  : "bg-[#F5F0E8] text-[#6B6B8A] hover:bg-[#E8E2D9]"
              }`}
            >
              {Icon && <Icon size={11} />}
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
