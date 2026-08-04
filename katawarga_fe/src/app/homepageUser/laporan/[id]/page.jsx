"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
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
  XCircle,
  Send,
  User,
  Eye,
} from "lucide-react";
import { useConfig } from "@/hooks/useConfig";
import { CATEGORY_ICONS } from "@/lib/configIcons";
import Avatar from "@/components/ui/Avatar";
import StatusBadge from "@/components/ui/StatusBadge";
import PriorityBadge from "@/components/ui/PriorityBadge";

export default function LaporanDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [report, setReport]         = useState(null);
  const [comments, setComments]     = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [comment, setComment]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked]           = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const token = session?.accessToken;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const { config } = useConfig();
  const categories = config?.categories || [];

  // ── Fetch Report ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${apiUrl}/reports/${id}`, { headers });
        if (res.ok) {
          const data = await res.json();
          const r = data.data;
          setReport(r);
          setLiked(!!r.user_liked);
          setLikesCount(r.likes_count || 0);
          setBookmarked(!!r.user_bookmarked);
          // Pre-populate comments from initial fetch
          if (r.comments && r.comments.length > 0) {
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
  }, [id, token]);

  // ── Like ─────────────────────────────────────────────────────────────────────
  const handleLike = async () => {
    if (!token) return;
    const method = liked ? "DELETE" : "POST";
    const res = await fetch(`${apiUrl}/reports/${id}/like`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setLiked(!liked);
      setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    }
  };

  // ── Bookmark ─────────────────────────────────────────────────────────────────
  const handleBookmark = async () => {
    if (!token) return;
    const res = await fetch(`${apiUrl}/reports/${id}/bookmark`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setBookmarked(!bookmarked);
  };

  // ── Resolve (mark as done) ─────────────────────────────────────────────────
  const [resolving, setResolving] = useState(false);

  const handleResolve = async () => {
    if (!token || resolving) return;
    setResolving(true);
    try {
      const res = await fetch(`${apiUrl}/reports/${id}/resolve`, {
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

  // ── Comment Submit ───────────────────────────────────────────────────
  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !token) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/reports/${id}/comments`, {
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
      }
    } catch (err) {
      console.error("Comment error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="animate-spin text-[#192126]" size={32} />
        <p className="text-sm text-[#6B6B8A] font-medium">Memuat laporan...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
          <AlertTriangle className="text-red-500" size={24} />
        </div>
        <h2 className="font-bold text-[#111827]">Laporan tidak ditemukan</h2>
        <p className="text-sm text-[#6B6B8A]">Laporan ini mungkin telah dihapus atau tidak tersedia.</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-[#192126] text-white text-sm font-bold rounded-xl hover:bg-[#2b2e2f] transition"
        >
          Kembali
        </button>
      </div>
    );
  }

  const catConfig   = categories.find((c) => c.id === report.category_id) || categories[0] || {};
  const CatIcon     = catConfig?.name ? CATEGORY_ICONS[catConfig.name] : null;
  const isOwner     = session?.user?.id ? String(report.user_id) === String(session.user.id) : false;

  return (
    <div className="flex flex-col bg-[#FFFBF5] min-h-full pb-12">
      {/* ── Sticky Header ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-[#FFFBF5]/90 backdrop-blur-md border-b border-[#E8E2D9] px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-[#F5F0E8] text-[#6B6B8A] hover:text-[#111827] transition"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-sm text-[#111827] truncate">{report.title}</h1>
          <p className="text-[10px] text-[#6B6B8A]">Detail Laporan #{report.id}</p>
        </div>
        <button
          onClick={handleBookmark}
          className={`p-2 rounded-xl transition ${
            bookmarked ? "text-[#192126] bg-blue-50" : "text-[#6B6B8A] hover:bg-[#F5F0E8]"
          }`}
        >
          <Bookmark size={18} fill={bookmarked ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="max-w-2xl mx-auto w-full p-4 flex flex-col gap-4">
        {/* ── Report Card ────────────────────────────────────────────────────── */}
        <div className="bg-white border border-[#E8E2D9] rounded-3xl overflow-hidden shadow-sm">
          {/* Author row */}
          <div className="flex items-center gap-3 p-4 pb-3">
            <Avatar
              src={report.is_anonymous ? null : report.user_avatar}
              initials={report.is_anonymous ? "AN" : (report.user_name?.substring(0, 2).toUpperCase() || "??")}
              color={report.is_anonymous ? "bg-slate-400" : "bg-[#192126]"}
              size="w-10 h-10"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#111827]">
                {report.is_anonymous ? "Anonim" : (report.user_name || "Warga")}
              </p>
              <p className="text-[11px] text-[#6B6B8A] flex items-center gap-1">
                <Calendar size={10} />
                {new Date(report.created_at).toLocaleString("id-ID", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {CatIcon && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${catConfig.bg}`}>
                <CatIcon size={10} />
                {report.category_name}
              </span>
            )}
            <StatusBadge status={report.status} />
            <PriorityBadge priority={report.priority} />
          </div>

          {/* Title & Description */}
          <div className="px-4 pb-4">
            <h2 className="font-bold text-base text-[#111827] leading-snug mb-2">
              {report.title}
            </h2>
            <p className="text-sm text-[#3D3D5C] leading-relaxed whitespace-pre-wrap">
              {report.description}
            </p>
          </div>

          {/* Image */}
          {report.image && (
            <div className="mx-4 mb-4 rounded-2xl overflow-hidden border border-[#F0EAE0]">
              <img
                src={report.image.startsWith("http") ? report.image : `http://localhost:5000/uploads/${report.image}`}
                alt={report.title}
                className="w-full object-cover max-h-80"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}

          {/* Location */}
          {(report.address || report.latitude) && (
            <div className="px-4 pb-4 flex items-start gap-2">
              <MapPin size={14} className="text-[#192126] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-[#3D3D5C] font-semibold">
                  {report.address || "Koordinat GPS tersedia"}
                </p>
                {report.latitude && report.longitude && (
                  <p className="text-[10px] text-[#B0A898] mt-0.5">
                    {parseFloat(report.latitude).toFixed(5)}, {parseFloat(report.longitude).toFixed(5)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="px-4 pb-3 flex items-center gap-4 text-[11px] text-[#B0A898]">
            <span className="flex items-center gap-1"><Eye size={11} />{report.views_count || 0} dilihat</span>
            <span className="flex items-center gap-1"><MessageCircle size={11} />{report.comments_count || 0} komentar</span>
          </div>

          {/* Action Bar */}
          <div className="border-t border-[#F0EAE0] px-4 py-2.5 flex items-center gap-1">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${
                liked ? "text-red-500 bg-red-50" : "text-[#6B6B8A] hover:text-red-500 hover:bg-red-50"
              }`}
            >
              <Heart size={14} fill={liked ? "currentColor" : "none"} />
              <span>{likesCount} Dukung</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-[#6B6B8A] hover:text-[#192126] hover:bg-[#EBF4FF] transition-all">
              <MessageCircle size={14} />
              <span>Komentar</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-[#6B6B8A] hover:text-[#22C55E] hover:bg-green-50 transition-all">
              <Share2 size={14} />
              <span>Bagikan</span>
            </button>
          </div>
        </div>

        {/* ── Resolve Button (only for owner with status ≠ selesai) ──────────── */}
        {isOwner && report.status !== "selesai" && report.status !== "draft" && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-green-800">Laporan Sudah Selesai?</p>
              <p className="text-[10px] text-green-600 mt-0.5">Konfirmasi jika masalah sudah diatasi di lapangan.</p>
            </div>
            <button
              onClick={handleResolve}
              disabled={resolving}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 flex-shrink-0"
            >
              {resolving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              Tandai Selesai
            </button>
          </div>
        )}

        {/* ── Status History Timeline ─────────────────────────────────────────── */}
        {report.status_logs && report.status_logs.length > 0 && (
          <div className="bg-white border border-[#E8E2D9] rounded-3xl p-4">
            <h3 className="font-bold text-sm text-[#111827] flex items-center gap-2 mb-3">
              <Clock size={15} className="text-[#192126]" />
              Riwayat Status
            </h3>
            <div className="flex flex-col gap-2.5">
              {report.status_logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-[#192126] mt-1.5 shrink-0" />
                  <div>
                    <p className="text-[#111827] font-semibold">
                      {log.old_status || "Dibuat"} → {log.new_status}
                    </p>
                    <p className="text-[10px] text-[#6B6B8A]">
                      {log.changed_by_name} · {new Date(log.created_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                    {log.note && (
                      <p className="text-[10px] text-[#3D3D5C] mt-0.5 italic">{log.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Comments Section ──────────────────────────────────────────────── */}
        <div className="bg-white border border-[#E8E2D9] rounded-3xl p-4 flex flex-col gap-4">
          <h3 className="font-bold text-sm text-[#111827] flex items-center gap-2">
            <MessageCircle size={15} className="text-[#192126]" />
            Tanggapan
          </h3>

          {/* Comment Form */}
          {token ? (
            <form onSubmit={handleComment} className="flex gap-2">
              <Avatar
                src={session?.user?.image}
                initials={session?.user?.name?.substring(0, 2).toUpperCase() || "??"}
                color="bg-[#192126]"
                size="w-8 h-8"
                textSize="text-xs"
              />
              <div className="flex-1 flex items-center gap-2 bg-[#FFFBF5] border border-[#E8E2D9] rounded-xl px-3 py-2 focus-within:border-[#192126] transition">
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
              <button onClick={() => router.push("/auth/login")} className="text-[#192126] font-semibold hover:underline">
                Login
              </button>{" "}
              untuk memberikan tanggapan.
            </p>
          )}

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="text-center py-6 flex flex-col items-center gap-2">
              <MessageCircle size={20} className="text-[#D1CEC8]" />
              <p className="text-xs text-[#B0A898]">Belum ada tanggapan. Jadilah yang pertama!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <Avatar
                    src={c.avatar}
                    initials={c.user_name?.substring(0, 2).toUpperCase() || "??"}
                    color="bg-slate-400"
                    size="w-7 h-7"
                    textSize="text-[10px]"
                  />
                  <div className="flex-1 bg-[#FFFBF5] border border-[#F0EAE0] rounded-xl p-2.5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-[#111827]">{c.user_name}</span>
                        {c.is_admin_response === 1 || c.is_admin_response === true ? (
                          <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">
                            Admin
                          </span>
                        ) : null}
                      </div>
                      <span className="text-[9px] text-[#B0A898]">
                        {new Date(c.created_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#3D3D5C] leading-relaxed">{c.body || c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
