"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import DevelopmentBanner from "@/components/ui/DevelopmentBanner";
import Avatar from "@/components/ui/Avatar";
import { emitProfileUpdated } from "@/hooks/useUserProfile";
import ReportCard from "@/components/feed/ReportCard";
import ReportDetailModal from "@/components/modals/ReportDetailModal";
import FollowListModal from "@/components/modals/FollowListModal";
import {
  MapPin,
  Calendar,
  Star,
  MessageSquare,
  ThumbsUp,
  FileText,
  Bookmark,
  Edit2,
  X,
  Save,
  Globe,
  Loader2,
  UserPlus,
  UserCheck
} from "lucide-react";

function ProfilContent() {
  const { data: session, update } = useSession();
  const searchParams = useSearchParams();
  const queryUserId = searchParams.get("userId");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const token = session?.accessToken || session?.user?.accessToken;
  const currentUserId = session?.user?.id;
  
  const targetUserId = queryUserId || currentUserId;
  const isOwnProfile = !queryUserId || String(queryUserId) === String(currentUserId);

  const [activeTab, setActiveTab] = useState("laporan");

  // Profile data states
  const [profileUser, setProfileUser] = useState(null);
  const [profileInfo, setProfileInfo] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Lists and loaders
  const [userReports, setUserReports] = useState([]);
  const [likedReports, setLikedReports] = useState([]);
  const [userComments, setUserComments] = useState([]);
  
  const [reportsLoading, setReportsLoading] = useState(false);
  const [likesLoading, setLikesLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Edit fields
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLoc, setEditLoc] = useState("");
  const [editWeb, setEditWeb] = useState("");

  const [selectedReportId, setSelectedReportId] = useState(null);

  // Follow list modal states
  const [showFollowList, setShowFollowList] = useState(false);
  const [followListType, setFollowListType] = useState("followers");

  const openFollowList = (type) => {
    setFollowListType(type);
    setShowFollowList(true);
  };

  // Fetch target profile from API
  const fetchProfile = useCallback(async () => {
    if (!targetUserId || !token) return;
    setProfileLoading(true);
    try {
      const res = await fetch(`${apiUrl}/users/${targetUserId}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfileUser(data.data.user || {});
        setProfileInfo(data.data.profile || {});
        setIsFollowing(data.data.is_following || false);
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
    } finally {
      setProfileLoading(false);
    }
  }, [targetUserId, token, apiUrl]);

  // Fetch target user's reports
  const fetchUserReports = useCallback(async () => {
    if (!targetUserId || !token) return;
    setReportsLoading(true);
    try {
      const queryStr = isOwnProfile ? "mine=true" : `user_id=${targetUserId}`;
      const res = await fetch(`${apiUrl}/reports?${queryStr}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUserReports(data.data || []);
      }
    } catch (err) {
      console.error("Fetch reports error:", err);
    } finally {
      setReportsLoading(false);
    }
  }, [targetUserId, token, isOwnProfile, apiUrl]);

  // Fetch target user's liked reports
  const fetchLikedReports = useCallback(async () => {
    if (!targetUserId || !token) return;
    setLikesLoading(true);
    try {
      const res = await fetch(`${apiUrl}/reports?user_id=${targetUserId}&liked=true&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLikedReports(data.data || []);
      }
    } catch (err) {
      console.error("Fetch liked reports error:", err);
    } finally {
      setLikesLoading(false);
    }
  }, [targetUserId, token, apiUrl]);

  // Fetch comments written by target user
  const fetchUserComments = useCallback(async () => {
    if (!targetUserId || !token) return;
    setCommentsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/users/${targetUserId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUserComments(data.data || []);
      }
    } catch (err) {
      console.error("Fetch user comments error:", err);
    } finally {
      setCommentsLoading(false);
    }
  }, [targetUserId, token, apiUrl]);

  // Trigger loads
  useEffect(() => {
    if (token && targetUserId) {
      fetchProfile();
      fetchUserReports();
    }
  }, [targetUserId, token, fetchProfile, fetchUserReports]);

  useEffect(() => {
    if (token && targetUserId) {
      if (activeTab === "postingan") {
        fetchLikedReports();
      } else if (activeTab === "komentar") {
        fetchUserComments();
      }
    }
  }, [activeTab, targetUserId, token, fetchLikedReports, fetchUserComments]);

  // Sync state values with fetched profile details
  useEffect(() => {
    if (profileInfo) {
      setBio(profileInfo.bio || "");
      setLocation(profileInfo.location || "");
      setWebsite(profileInfo.website || "");
    }
    if (profileUser) {
      setFullName(profileUser.name || "");
      setUsername(profileUser.username || profileUser.email?.split("@")[0] || "");
      if (profileUser.avatar) {
        setAvatarPreview(profileUser.avatar);
      }
    }
  }, [profileInfo, profileUser]);

  // Local storage fallback only for own profile name cache
  useEffect(() => {
    if (isOwnProfile) {
      const customProfile = localStorage.getItem("user_profile_custom");
      if (customProfile) {
        try {
          const parsed = JSON.parse(customProfile);
          if (parsed.fullName && !profileUser) setFullName(parsed.fullName);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [isOwnProfile, profileUser]);

  const openEditModal = () => {
    setEditName(fullName);
    setEditBio(bio);
    setEditLoc(location);
    setEditWeb(website);
    setShowEditModal(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!token || !currentUserId) return;

    setFullName(editName);
    setBio(editBio);
    setLocation(editLoc);
    setWebsite(editWeb);

    try {
      const res = await fetch(`${apiUrl}/users/${currentUserId}/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bio: editBio,
          location: editLoc,
          website: editWeb,
          name: editName,
        }),
      });

      if (res.ok) {
        if (update) {
          await update({ name: editName, avatar: avatarPreview });
        }
        emitProfileUpdated();
        setShowEditModal(false);
        alert("Profil berhasil diperbarui!");
        fetchProfile();
      }
    } catch (err) {
      console.error("Save profile API error:", err);
    }
  };

  const handleFollowToggle = async () => {
    if (!token || !targetUserId) return;
    const method = isFollowing ? "DELETE" : "POST";
    try {
      const res = await fetch(`${apiUrl}/users/${targetUserId}/follow`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setIsFollowing(!isFollowing);
        setProfileInfo(prev => ({
          ...prev,
          followers_count: isFollowing
            ? Math.max(0, (prev.followers_count || 0) - 1)
            : (prev.followers_count || 0) + 1
        }));
      }
    } catch (err) {
      console.error("Follow toggle error:", err);
    }
  };

  const handleLikeReport = async (id) => {
    if (!token) return;
    try {
      const report = [...userReports, ...likedReports].find(r => r.id === id);
      if (!report) return;
      const method = report.user_liked ? "DELETE" : "POST";
      const res = await fetch(`${apiUrl}/reports/${id}/like`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const updater = (prev) =>
          prev.map(r => r.id === id ? {
            ...r,
            likes_count: r.user_liked ? r.likes_count - 1 : r.likes_count + 1,
            user_liked: !r.user_liked
          } : r);
        setUserReports(updater);
        setLikedReports(updater);
      }
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleBookmarkReport = async (id) => {
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/reports/${id}/bookmark`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const updater = (prev) =>
          prev.map(r => r.id === id ? { ...r, user_bookmarked: !r.user_bookmarked } : r);
        setUserReports(updater);
        setLikedReports(updater);
      }
    } catch (err) {
      console.error("Bookmark error:", err);
    }
  };

  const handleShareReport = (id) => {
    const updater = (prev) =>
      prev.map(r => (r.id === id ? { ...r, shares_count: (r.shares_count || 0) + 1 } : r));
    setUserReports(updater);
    setLikedReports(updater);
    if (navigator.share) {
      navigator.share({ title: "Laporan KataWarga", url: `${window.location.origin}/homepageUser/laporan/${id}` });
    }
  };

  if (profileLoading) {
    return (
      <div className="flex-1 bg-[#FFFBF5] flex flex-col items-center justify-center gap-2 py-20">
        <Loader2 size={24} className="text-[#192126] animate-spin" />
        <p className="text-xs font-semibold text-[#6B6B8A]">Memuat profil warga...</p>
      </div>
    );
  }

  // Fallbacks and derived values
  const displayName = profileUser?.name || fullName || "Warga KataWarga";
  const displayUsername = username || (profileUser?.email ? profileUser.email.split("@")[0] : "");
  const displayBio = profileInfo?.bio || "Belum menulis biodata singkat.";
  const displayLoc = profileInfo?.location || "Lokasi belum ditentukan";
  const displayWeb = profileInfo?.website || "";
  const joinDate = profileUser?.created_at
    ? new Date(profileUser.created_at).toLocaleDateString("id-ID", { month: "long", year: "numeric" })
    : new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const stats = {
    reportsCreated: userReports.length,
    commentsCount: profileInfo?.comments_count || 0,
    likesReceived: userReports.reduce((acc, r) => acc + (r.likes_count || 0), 0),
    resolvedCount: profileInfo?.resolved_count || 0,
  };

  return (
    <div className="flex flex-col h-full bg-[#FFFBF5]">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between px-5 py-3.5 bg-[#FFFBF5]/80 backdrop-blur-md sticky top-0 z-20 border-b border-[#E8E2D9]">
        <div>
          <h1 className="font-bold text-base text-[#111827]">Profil Warga</h1>
          <p className="text-[11px] text-[#6B6B8A]">
            {isOwnProfile ? "Reputasi dan kontribusi sosial Anda" : `Profil publik ${displayName}`}
          </p>
        </div>
      </div>

      <div className="p-4 md:p-6 flex flex-col gap-4 max-w-3xl mx-auto w-full">
        {/* Development Banner */}
        <DevelopmentBanner featureName="Profil Pengguna &amp; Sistem Sosial" />

        {/* Profile Card Main Layout (Twitter/X style) */}
        <div className="bg-white border border-[#E8E2D9] rounded-3xl overflow-hidden shadow-sm">
          {/* Cover Banner Mockup */}
          <div className="h-32 bg-gradient-to-r from-[#192126]/20 to-[#60A5FA]/20 relative flex items-center justify-center">
            <span className="text-[10px] font-bold text-[#192126]/60 uppercase tracking-widest">KATAWARGA BANNER</span>
          </div>

          {/* Profile Header details */}
          <div className="px-5 pb-5 relative">
            {/* Avatar positioning */}
            <div className="absolute -top-10 left-5 border-4 border-white rounded-2xl overflow-hidden shadow-md bg-white">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={displayName}
                  className="w-20 h-20 object-cover"
                />
              ) : (
                <Avatar
                  initials={displayName.substring(0, 2).toUpperCase()}
                  color="bg-[#192126]"
                  size="w-20 h-20"
                  textSize="text-xl"
                />
              )}
            </div>

            {/* Action edit / follow profile */}
            <div className="flex justify-end pt-3">
              {isOwnProfile ? (
                <button
                  onClick={openEditModal}
                  className="px-4 py-2 border border-[#E8E2D9] hover:bg-[#F5F0E8] text-xs font-bold rounded-xl text-[#3D3D5C] transition flex items-center gap-1.5 active:scale-95"
                >
                  <Edit2 size={13} />
                  Edit Profil
                </button>
              ) : (
                <button
                  onClick={handleFollowToggle}
                  className={`px-4 py-2 border rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 ${
                    isFollowing
                      ? "bg-white border-[#E8E2D9] text-[#3D3D5C] hover:bg-[#F5F0E8]"
                      : "bg-[#192126] border-[#192126] text-white hover:bg-[#2b2e2f]"
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck size={13} />
                      Mengikuti
                    </>
                  ) : (
                    <>
                      <UserPlus size={13} />
                      Ikuti
                    </>
                  )}
                </button>
              )}
            </div>

            {/* User Meta info */}
            <div className="mt-4">
              <h2 className="text-lg font-bold text-[#111827]">{displayName}</h2>
              <p className="text-xs text-[#6B6B8A] font-medium">{displayUsername ? `@${displayUsername}` : ""}</p>
              
              <p className="text-xs text-[#3D3D5C] mt-3 leading-relaxed">
                {displayBio}
              </p>

              {/* Location, Join Date, Website */}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3.5 text-xs text-[#6B6B8A] font-semibold">
                <span className="flex items-center gap-1">
                  <MapPin size={13} />
                  {displayLoc}
                </span>
                {displayWeb && (
                  <a href={displayWeb} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#192126] hover:underline">
                    <Globe size={13} />
                    {displayWeb.replace(/(^\w+:|^)\/\//, "")}
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <Calendar size={13} />
                  Bergabung {joinDate}
                </span>
              </div>

              {/* Stats Followers, Following */}
              <div className="flex gap-4 mt-4 pt-4 border-t border-[#FFFBF5] text-xs text-[#111827]">
                <button
                  onClick={() => openFollowList("following")}
                  className="hover:underline focus:outline-none flex gap-1 items-center cursor-pointer"
                >
                  <strong className="font-bold text-[#192126]">{profileInfo?.following_count || 0}</strong>{" "}
                  <span className="text-[#6B6B8A] font-semibold">Mengikuti</span>
                </button>
                <button
                  onClick={() => openFollowList("followers")}
                  className="hover:underline focus:outline-none flex gap-1 items-center cursor-pointer"
                >
                  <strong className="font-bold text-[#192126]">{profileInfo?.followers_count || 0}</strong>{" "}
                  <span className="text-[#6B6B8A] font-semibold">Pengikut</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Laporan Dibuat", val: stats.reportsCreated, icon: FileText, color: "text-[#192126] bg-[#192126]/5" },
            { label: "Komentar Dikirim", val: stats.commentsCount, icon: MessageSquare, color: "text-[#6B6B8A] bg-slate-50" },
            { label: "Dukungan Diterima", val: stats.likesReceived, icon: ThumbsUp, color: "text-orange-500 bg-orange-50" },
            { label: "Laporan Selesai", val: stats.resolvedCount, icon: Star, color: "text-green-600 bg-green-50" },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-white border border-[#E8E2D9] rounded-2xl p-3 flex flex-col justify-between shadow-sm">
                <div className={`w-7 h-7 rounded-lg ${item.color} flex items-center justify-center mb-1.5`}>
                  <Icon size={14} />
                </div>
                <div>
                  <p className="text-lg font-black text-[#111827] leading-none">{item.val}</p>
                  <p className="text-[10px] text-[#6B6B8A] font-bold mt-1.5">{item.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Activity Section */}
        <div className="flex flex-col gap-3.5 w-full">
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-1 shadow-sm flex text-xs w-full">
            {[
              { val: "laporan", label: isOwnProfile ? "Laporan Saya" : "Laporan" },
              { val: "postingan", label: "Disukai" },
              { val: "komentar", label: "Komentar" },
            ].map((tab) => (
              <button
                key={tab.val}
                onClick={() => setActiveTab(tab.val)}
                className={`flex-1 py-2 font-bold rounded-xl transition ${
                  activeTab === tab.val
                    ? "bg-[#192126] text-white shadow-sm"
                    : "text-[#6B6B8A] hover:bg-[#F5F0E8] hover:text-[#111827]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dynamic Activity List */}
          <div className="flex flex-col gap-3 w-full">
            {activeTab === "laporan" && (
              reportsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-[#192126]" size={20} />
                </div>
              ) : userReports.length > 0 ? (
                userReports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onLike={handleLikeReport}
                    onBookmark={handleBookmarkReport}
                    onShare={handleShareReport}
                    onDetailClick={(id) => setSelectedReportId(id)}
                  />
                ))
              ) : (
                <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 shadow-sm text-center py-10 flex flex-col items-center justify-center">
                  <FileText size={22} className="text-[#B0A898] mb-2" />
                  <h3 className="font-bold text-xs text-[#111827]">Belum ada laporan</h3>
                  <p className="text-[10px] text-[#6B6B8A] mt-1 max-w-xs">
                    Pengguna belum mempublikasikan laporan pengaduan.
                  </p>
                </div>
              )
            )}

            {activeTab === "postingan" && (
              likesLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-[#192126]" size={20} />
                </div>
              ) : likedReports.length > 0 ? (
                likedReports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onLike={handleLikeReport}
                    onBookmark={handleBookmarkReport}
                    onShare={handleShareReport}
                    onDetailClick={(id) => setSelectedReportId(id)}
                  />
                ))
              ) : (
                <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 shadow-sm text-center py-10 flex flex-col items-center justify-center">
                  <ThumbsUp size={22} className="text-[#B0A898] mb-2" />
                  <h3 className="font-bold text-xs text-[#111827]">Belum menyukai laporan</h3>
                  <p className="text-[10px] text-[#6B6B8A] mt-1 max-w-xs">
                    Laporan yang disukai oleh pengguna akan ditampilkan di sini.
                  </p>
                </div>
              )
            )}

            {activeTab === "komentar" && (
              commentsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-[#192126]" size={20} />
                </div>
              ) : userComments.length > 0 ? (
                userComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-sm flex flex-col gap-2 transition hover:shadow-md cursor-pointer"
                    onClick={() => setSelectedReportId(comment.report_id)}
                  >
                    <div className="flex justify-between items-center text-[10px] text-[#6B6B8A] font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(comment.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                      <span className="text-[#192126] font-bold hover:underline">
                        Lihat Laporan &rarr;
                      </span>
                    </div>
                    <p className="text-xs text-[#3D3D5C] font-semibold italic bg-[#FFFBF5] p-2.5 rounded-xl border border-[#E8E2D9]/60 leading-relaxed">
                      "{comment.body}"
                    </p>
                    <p className="text-[10px] text-[#6B6B8A] font-medium">
                      Pada laporan: <span className="font-bold text-[#111827]">{comment.report_title}</span>
                    </p>
                  </div>
                ))
              ) : (
                <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 shadow-sm text-center py-10 flex flex-col items-center justify-center">
                  <MessageSquare size={22} className="text-[#B0A898] mb-2" />
                  <h3 className="font-bold text-xs text-[#111827]">Belum menulis komentar</h3>
                  <p className="text-[10px] text-[#6B6B8A] mt-1 max-w-xs">
                    Komentar yang ditulis pengguna pada laporan akan ditampilkan di sini.
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-[#E8E2D9] rounded-3xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[#E8E2D9] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#111827]">Edit Profil Anda</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 hover:bg-[#F5F0E8] rounded-lg text-[#6B6B8A] hover:text-[#111827] transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#6B6B8A] uppercase tracking-wider mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E8E2D9] rounded-xl text-xs focus:outline-none focus:border-[#192126]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6B6B8A] uppercase tracking-wider mb-1">Biodata Singkat</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-[#E8E2D9] rounded-xl text-xs focus:outline-none focus:border-[#192126] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#6B6B8A] uppercase tracking-wider mb-1">Lokasi</label>
                  <input
                    type="text"
                    value={editLoc}
                    onChange={(e) => setEditLoc(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E8E2D9] rounded-xl text-xs focus:outline-none focus:border-[#192126]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#6B6B8A] uppercase tracking-wider mb-1">Website</label>
                  <input
                    type="text"
                    value={editWeb}
                    onChange={(e) => setEditWeb(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E8E2D9] rounded-xl text-xs focus:outline-none focus:border-[#192126]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#FFFBF5] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-[#E8E2D9] hover:bg-[#F5F0E8] text-xs font-bold rounded-xl text-[#3D3D5C] transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#192126] hover:bg-[#2b2e2f] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-md shadow-[#192126]/10"
                >
                  <Save size={13} />
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Popup Modal */}
      {selectedReportId && (
        <ReportDetailModal
          reportId={selectedReportId}
          onClose={() => {
            setSelectedReportId(null);
            fetchProfile();
            fetchUserReports();
            if (activeTab === "postingan") fetchLikedReports();
            if (activeTab === "komentar") fetchUserComments();
          }}
        />
      )}

      {/* Follow List Modal */}
      {showFollowList && (
        <FollowListModal
          userId={targetUserId}
          type={followListType}
          onClose={() => {
            setShowFollowList(false);
            fetchProfile();
          }}
        />
      )}
    </div>
  );
}

export default function ProfilPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 bg-[#FFFBF5] flex items-center justify-center text-xs font-semibold text-[#6B6B8A] py-12">
          Memuat halaman profil...
        </div>
      }
    >
      <ProfilContent />
    </Suspense>
  );
}
