"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  X,
  MapPin,
  Calendar,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  Flag,
} from "lucide-react";
import { useConfig } from "@/hooks/useConfig";
import { CATEGORY_ICONS } from "@/lib/configIcons";
import Avatar from "@/components/ui/Avatar";
import StatusBadge from "@/components/ui/StatusBadge";
import PriorityBadge from "@/components/ui/PriorityBadge";
import FlagModal from "@/components/modals/FlagModal";

export default function ReportDetailModal({ reportId, onClose }) {
  const { data: session } = useSession();

  const [report, setReport]         = useState(null);
  const [comments, setComments]     = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [comment, setComment]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked]           = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [resolving, setResolving]   = useState(false);
  const [showFlag, setShowFlag]     = useState(false);

  const token = session?.accessToken || session?.user?.accessToken;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const { config } = useConfig();
  const categories = config?.categories || [];

  // Fetch Report Detail
  useEffect(() => {
    if (!reportId) return;
    const fetchReport = async () => {
      setIsLoading(true);
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${apiUrl}/reports/${reportId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          const r = data.data;
          setReport(r);
          setLiked(!!r.user_liked);
          setLikesCount(r.likes_count || 0);
          setBookmarked(!!r.user_bookmarked);
          if (r.comments) {
            setComments(r.comments);
          }
        }
      } catch (err) {
        console.error("Fetch report detail error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [reportId, token, apiUrl]);

  // Like Toggle
  const handleLike = async () => {
    if (!token) return;
    const method = liked ? "DELETE" : "POST";
    const res = await fetch(`${apiUrl}/reports/${reportId}/like`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setLiked(!liked);
      setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    }
  };

  // Bookmark Toggle
  const handleBookmark = async () => {
    if (!token) return;
    const res = await fetch(`${apiUrl}/reports/${reportId}/bookmark`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setBookmarked(!bookmarked);
  };

  // Resolve (Mark as Done)
  const handleResolve = async () => {
    if (!token || resolving) return;
    setResolving(true);
    try {
      const res = await fetch(`${apiUrl}/reports/${reportId}/resolve`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirmed: true }),
      });
      if (res.ok) {
        setReport((prev) => ({ ...prev, status: "selesai", is_resolved_by_user: true }));
      }
    } catch (err) {
      console.error("Resolve error:", err);
    } finally {
      setResolving(false);
    }
  };

  // Comment Submit
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !token) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/reports/${reportId}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: comment }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [
          ...prev,
          {
            id: data.commentId || Date.now(),
            body: comment,
            user_name: session?.user?.name || "Anda",
            created_at: new Date().toISOString(),
          },
        ]);
        setComment("");
        // Optionally update report.comments_count locally
        if (report) {
          setReport(prev => ({ ...prev, comments_count: (prev.comments_count || 0) + 1 }));
        }
      }
    } catch (err) {
      console.error("Comment submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Share handler
  const handleShare = () => {
    if (report) {
      if (navigator.share) {
        navigator.share({
          title: report.title,
          text: report.description,
          url: `${window.location.origin}/homepageUser/laporan/${report.id}`,
        });
      } else {
        navigator.clipboard.writeText(`${window.location.origin}/homepageUser/laporan/${report.id}`);
        alert("Link laporan disalin ke clipboard!");
      }
    }
  };

  const catConfig   = report ? (categories.find((c) => c.id === report.category_id) || categories[0] || {}) : {};
  const CatIcon     = catConfig?.name ? CATEGORY_ICONS[catConfig.name] : null;
  const isOwner     = session?.user?.id && report ? String(report.user_id) === String(session.user.id) : false;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Modal Box */}
      <div className="bg-white border border-[#E8E2D9] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-[#F5F0E8] text-[#6B6B8A] hover:text-[#111827] transition z-10"
        >
          <X size={18} />
        </button>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-[#192126]" size={32} />
            <p className="text-sm text-[#6B6B8A] font-medium">Memuat rincian laporan...</p>
          </div>
        ) : !report ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 p-8 text-center">
            <AlertTriangle className="text-red-500" size={32} />
            <h2 className="font-bold text-[#111827] text-base">Laporan tidak ditemukan</h2>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#192126] text-white text-xs font-bold rounded-xl hover:bg-[#2b2e2f] transition"
            >
              Tutup
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Header / Meta */}
            <div className="p-5 pb-3 border-b border-[#F0EAE0]">
              <div className="flex items-center gap-3">
                <Avatar
                  src={report.is_anonymous ? null : report.user_avatar}
                  initials={report.is_anonymous ? "AN" : (report.user_name?.substring(0, 2).toUpperCase() || "??")}
                  color={report.is_anonymous ? "bg-slate-400" : "bg-[#192126]"}
                  size="w-10 h-10"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111827] truncate">
                    {report.is_anonymous ? "Anonim" : (report.user_name || "Warga")}
                  </p>
                  <p className="text-[10px] text-[#6B6B8A] flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(report.created_at).toLocaleString("id-ID", {
                      dateStyle: "long",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {CatIcon && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${catConfig.bg}`}>
                    <CatIcon size={9} />
                    {report.category_name}
                  </span>
                )}
                <StatusBadge status={report.status} />
                <PriorityBadge priority={report.priority} />
              </div>
            </div>

            {/* Main Content */}
            <div className="p-5 flex-1 flex flex-col gap-4">
              <div>
                <h2 className="font-bold text-base text-[#111827] leading-snug mb-2">
                  {report.title}
                </h2>
                <p className="text-xs sm:text-sm text-[#3D3D5C] leading-relaxed whitespace-pre-wrap">
                  {report.description}
                </p>
              </div>

              {/* Image */}
              {report.image && (
                <div className="rounded-2xl overflow-hidden border border-[#F0EAE0] max-h-80 bg-slate-50 flex items-center justify-center">
                  <img
                    src={report.image.startsWith("http") ? report.image : `http://localhost:5000/uploads/${report.image}`}
                    alt={report.title}
                    className="w-full object-cover max-h-80"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              )}

              {/* Location */}
              {(report.address || report.latitude) && (
                <div className="flex items-start gap-2 text-xs">
                  <MapPin size={14} className="text-[#192126] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[#3D3D5C] font-semibold">
                      {report.address || "Koordinat GPS"}
                    </p>
                    {report.latitude && report.longitude && (
                      <p className="text-[10px] text-[#B0A898] mt-0.5">
                        {parseFloat(report.latitude).toFixed(6)}, {parseFloat(report.longitude).toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-[10px] text-[#B0A898] font-bold">
                <span className="flex items-center gap-1"><Eye size={11} />{report.views_count || 0} dilihat</span>
                <span className="flex items-center gap-1"><MessageCircle size={11} />{report.comments_count || 0} tanggapan</span>
              </div>

              {/* Action Bar */}
              <div className="border-t border-b border-[#F0EAE0] py-1 flex items-center gap-1">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    liked ? "text-red-500 bg-red-50" : "text-[#6B6B8A] hover:text-red-500 hover:bg-red-50"
                  }`}
                >
                  <Heart size={14} fill={liked ? "currentColor" : "none"} />
                  <span>{likesCount} Dukung</span>
                </button>
                <button
                  onClick={handleBookmark}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    bookmarked ? "text-[#192126] bg-[#192126]/10" : "text-[#6B6B8A] hover:text-[#192126] hover:bg-[#192126]/5"
                  }`}
                >
                  <Bookmark size={14} fill={bookmarked ? "currentColor" : "none"} />
                  <span>Simpan</span>
                </button>
                 <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#6B6B8A] hover:text-[#22C55E] hover:bg-green-50 transition-all"
                >
                  <Share2 size={14} />
                  <span>Bagikan</span>
                </button>
                <button
                  onClick={() => setShowFlag(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#6B6B8A] hover:text-red-500 hover:bg-red-50 transition-all ml-auto cursor-pointer"
                >
                  <Flag size={14} />
                  <span>Laporkan</span>
                </button>
              </div>

              {/* Owner Resolve Action */}
              {isOwner && report.status !== "selesai" && report.status !== "draft" && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-green-800">Masalah sudah selesai diatasi?</p>
                    <p className="text-[10px] text-green-600 mt-0.5">Berikan konfirmasi agar status laporan berubah menjadi selesai.</p>
                  </div>
                  <button
                    onClick={handleResolve}
                    disabled={resolving}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shrink-0"
                  >
                    {resolving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                    Tandai Selesai
                  </button>
                </div>
              )}

              {/* Status Timeline */}
              {report.status_logs && report.status_logs.length > 0 && (
                <div className="bg-[#FFFBF5]/60 border border-[#E8E2D9] rounded-2xl p-3">
                  <h3 className="font-bold text-xs text-[#111827] flex items-center gap-1.5 mb-2.5">
                    <Clock size={14} className="text-[#192126]" />
                    Riwayat Status
                  </h3>
                  <div className="flex flex-col gap-2">
                    {report.status_logs.map((log) => (
                      <div key={log.id} className="flex items-start gap-2 text-[11px]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#192126] mt-1 shrink-0" />
                        <div>
                          <p className="text-[#111827] font-semibold">
                            {log.old_status || "Dibuat"} &rarr; {log.new_status}
                          </p>
                          <p className="text-[9px] text-[#6B6B8A]">
                            {log.changed_by_name} · {new Date(log.created_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                          </p>
                          {log.note && (
                            <p className="text-[9px] text-[#3D3D5C] mt-0.5 italic">{log.note}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Discussion / Comments */}
              <div className="flex flex-col gap-3">
                <h3 className="font-bold text-xs text-[#111827] flex items-center gap-1.5">
                  <MessageCircle size={14} className="text-[#192126]" />
                  Tanggapan Diskusi
                </h3>

                {/* Comment Form */}
                {token ? (
                  <form onSubmit={handleCommentSubmit} className="flex gap-2.5">
                    <Avatar
                      src={session?.user?.image}
                      initials={session?.user?.name?.substring(0, 2).toUpperCase() || "??"}
                      color="bg-[#192126]"
                      size="w-8 h-8"
                      textSize="text-xs"
                    />
                    <div className="flex-1 flex items-center gap-2 bg-[#FFFBF5] border border-[#E8E2D9] rounded-xl px-3 py-1.5 focus-within:border-[#192126] transition">
                      <input
                        type="text"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Tulis tanggapan Anda..."
                        className="flex-1 bg-transparent text-xs text-[#111827] placeholder-[#B0A898] focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!comment.trim() || submitting}
                        className="p-1.5 rounded-lg bg-[#192126] text-white disabled:opacity-40 transition hover:bg-[#2b2e2f]"
                      >
                        {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-xs text-[#6B6B8A] text-center py-2">
                    Silakan login untuk memberikan tanggapan.
                  </p>
                )}

                {/* Comment List */}
                {comments.length === 0 ? (
                  <div className="text-center py-4 flex flex-col items-center gap-1.5 text-[#B0A898]">
                    <MessageCircle size={18} />
                    <p className="text-[11px]">Belum ada tanggapan.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
                    {comments.map((c) => (
                      <div key={c.id} className="flex gap-2">
                        <Avatar
                          src={c.avatar}
                          initials={c.user_name?.substring(0, 2).toUpperCase() || "??"}
                          color="bg-slate-400"
                          size="w-7 h-7"
                          textSize="text-[9px]"
                        />
                        <div className="flex-1 bg-[#FFFBF5] border border-[#F0EAE0] rounded-xl p-2">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-bold text-[#111827]">{c.user_name}</span>
                              {(c.is_admin_response === 1 || c.is_admin_response === true) && (
                                <span className="text-[8px] px-1 bg-blue-100 text-blue-700 rounded-full font-bold">
                                  Admin
                                </span>
                              )}
                            </div>
                            <span className="text-[8px] text-[#B0A898]">
                              {new Date(c.created_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#3D3D5C] leading-normal">{c.body || c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Flag Modal */}
      {showFlag && (
        <FlagModal reportId={report.id} onClose={() => setShowFlag(false)} />
      )}
    </div>
  );
}
