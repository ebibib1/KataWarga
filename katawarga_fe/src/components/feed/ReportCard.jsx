"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Flag,
  X,
  Activity,
  AlertTriangle,
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import StatusBadge from "@/components/ui/StatusBadge";
import PriorityBadge from "@/components/ui/PriorityBadge";
import FlagModal from "@/components/modals/FlagModal";
import { getImageUrl } from '../../utils/imageUrl';

export default function ReportCard({ report, onLike, onBookmark, onShare, onDetailClick }) {
  const router = useRouter();
  const [showOptions, setShowOptions] = useState(false);
  const [showFlag, setShowFlag] = useState(false);

  const CatIcon = report.categoryConfig?.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-[#E8E2D9] rounded-2xl overflow-hidden hover:border-[#C8C0B4] hover:shadow-md transition-all duration-200 group"
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <button 
          onClick={() => !report.is_anonymous && report.user_id && router.push(`/homepageUser/profil?userId=${report.user_id}`)}
          className="cursor-pointer"
          disabled={report.is_anonymous}
        >
          <Avatar
            src={report.is_anonymous ? null : report.user_avatar}
            initials={report.is_anonymous ? "AN" : report.user_initials}
            color={report.is_anonymous ? "bg-slate-400" : "bg-[#192126]"}
            size="w-10 h-10"
          />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => !report.is_anonymous && report.user_id && router.push(`/homepageUser/profil?userId=${report.user_id}`)}
                  className={`font-semibold text-sm ${
                    report.is_anonymous ? "text-[#111827]" : "text-[#111827] hover:text-[#192126] cursor-pointer"
                  }`}
                  disabled={report.is_anonymous}
                >
                  {report.is_anonymous ? "Anonim" : report.user_name}
                </button>
                <span className="text-[#6B6B8A] text-xs">{report.time}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {CatIcon && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${report.categoryConfig?.bg}`}
                  >
                    <CatIcon size={9} />
                    {report.category}
                  </span>
                )}
                <StatusBadge status={report.status} />
                <PriorityBadge priority={report.priority} />
              </div>
            </div>

            {/* Options menu */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="p-1.5 rounded-full text-[#6B6B8A] hover:bg-[#F5F0E8] hover:text-[#111827] transition"
              >
                <MoreHorizontal size={16} />
              </button>
              <AnimatePresence>
                {showOptions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    className="absolute right-0 top-8 bg-white border border-[#E8E2D9] rounded-xl shadow-xl z-20 py-1 w-40"
                  >
                    {[
                      { icon: Eye,      label: "Lihat Detail" },
                      { icon: Bookmark, label: "Simpan"       },
                      { icon: Share2,   label: "Bagikan"      },
                      { icon: Flag,     label: "Laporkan", danger: true },
                    ].map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (opt.label === "Lihat Detail") {
                            if (onDetailClick) onDetailClick(report.id);
                            else router.push(`/homepageUser/laporan/${report.id}`);
                          }
                          if (opt.label === "Laporkan") setShowFlag(true);
                          if (opt.label === "Simpan") onBookmark(report.id);
                          if (opt.label === "Bagikan") onShare(report.id);
                          setShowOptions(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-[#F5F0E8] transition ${
                          opt.danger ? "text-red-500" : "text-[#111827]"
                        }`}
                      >
                        <opt.icon size={13} />
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <h3
          onClick={() => {
            if (onDetailClick) onDetailClick(report.id);
            else router.push(`/homepageUser/laporan/${report.id}`);
          }}
          className="font-semibold text-[#111827] text-sm leading-snug mb-2 hover:text-[#192126] transition-colors cursor-pointer line-clamp-2"
        >
          {report.title}
        </h3>
        <p className="text-xs text-[#6B6B8A] leading-relaxed line-clamp-2">
          {report.description}
        </p>

        {/* Report Image dari filename */}
        {report.image && (
          <div className="mt-3 rounded-xl overflow-hidden border border-[#F0EAE0] aspect-video">
            <img
              src={getImageUrl(report.image)}
              alt={report.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
              onError={(e) => e.currentTarget.style.display = 'none'}
            />
          </div>
        )}

        {/* Location */}
        <div className="flex items-center gap-1 mt-2">
          <MapPin size={11} className="text-[#192126] flex-shrink-0" />
          <span className="text-[11px] text-[#6B6B8A]">{report.location}</span>
        </div>

        {/* Hashtags */}
        {report.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {report.hashtags.map((tag) => (
              <button
                key={tag}
                className="text-[#192126] text-[11px] font-medium hover:underline"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* View count */}
      <div className="px-4 pb-2 flex items-center gap-3 text-[11px] text-[#B0A898]">
        <span className="flex items-center gap-1">
          <Eye size={11} />
          {report.views_count} dilihat
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle size={11} />
          {report.comments_count} komentar
        </span>
      </div>

      {/* Action Bar */}
      <div className="border-t border-[#F0EAE0] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* Like */}
          <button
            onClick={() => onLike(report.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              report.user_liked
                ? "text-red-500 bg-red-50"
                : "text-[#6B6B8A] hover:text-red-500 hover:bg-red-50"
            }`}
          >
            <Heart size={14} fill={report.user_liked ? "currentColor" : "none"} />
            <span
              onClick={(e) => { e.stopPropagation(); router.push('/homepageUser/profil?tab=disukai'); }}
              className="hover:underline cursor-pointer"
            >
              {report.likes_count}
            </span>
          </button>

          {/* Comment */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#6B6B8A] hover:text-[#192126] hover:bg-[#EBF4FF] transition-all">
            <MessageCircle size={14} />
            <span>{report.comments_count}</span>
          </button>

          {/* Share */}
          <button
            onClick={() => onShare(report.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#6B6B8A] hover:text-[#22C55E] hover:bg-green-50 transition-all"
          >
            <Share2 size={14} />
            <span>{report.shares_count}</span>
          </button>
        </div>

        {/* Bookmark */}
        <button
          onClick={() => onBookmark(report.id)}
          className={`p-1.5 rounded-full transition-all ${
            report.user_bookmarked
              ? "text-[#192126] bg-blue-50"
              : "text-[#6B6B8A] hover:text-[#192126] hover:bg-[#EBF4FF]"
          }`}
        >
          <Bookmark
            size={14}
            fill={report.user_bookmarked ? "currentColor" : "none"}
          />
        </button>
      </div>

      {/* Flag Modal */}
      <AnimatePresence>
        {showFlag && (
          <FlagModal reportId={report.id} onClose={() => setShowFlag(false)} />
        )}
      </AnimatePresence>
    </motion.article>
  );
}
