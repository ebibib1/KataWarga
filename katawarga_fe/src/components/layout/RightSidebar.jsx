"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Search, BarChart3, Flame, Users, MapPin, ChevronRight,
  TrendingUp, FileText, CheckCircle2, Loader2,
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-pink-500", "bg-emerald-500",
  "bg-orange-500", "bg-cyan-500", "bg-rose-500", "bg-teal-500",
];

export default function RightSidebar() {
  const router = useRouter();
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");

  // ── Real data from API ───────────────────────────────────────────────────────
  const [platformStats,    setPlatformStats]    = useState([]);
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [nearbyUsers,      setNearbyUsers]      = useState([]);
  const [followStates,     setFollowStates]     = useState({});
  const [isLoading,        setIsLoading]        = useState(true);
  const [showMore,         setShowMore]         = useState(false);

  const token  = session?.accessToken || session?.user?.accessToken;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  // ── Fetch sidebar analytics ────────────────────────────────────────────────
  const fetchSidebar = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/analytics/sidebar`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPlatformStats(data.platformStats || []);
        setTrendingHashtags(data.trendingHashtags || []);
        setNearbyUsers(data.nearbyUsers || []);
        // Seed follow states from API response
        const states = {};
        (data.nearbyUsers || []).forEach((u) => {
          states[u.id] = u.is_following;
        });
        setFollowStates(states);
      }
    } catch (err) {
      console.error("RightSidebar fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token, apiUrl]);

  useEffect(() => {
    fetchSidebar();
  }, [fetchSidebar]);

  // ── Follow / Unfollow ───────────────────────────────────────────────────────
  const toggleFollow = async (userId) => {
    if (!token) return;
    const isFollowing = followStates[userId];
    const method = isFollowing ? "DELETE" : "POST";

    // Optimistic update
    setFollowStates((prev) => ({ ...prev, [userId]: !isFollowing }));

    try {
      const res = await fetch(`${apiUrl}/users/${userId}/follow`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // Revert on error
        setFollowStates((prev) => ({ ...prev, [userId]: isFollowing }));
      }
    } catch {
      setFollowStates((prev) => ({ ...prev, [userId]: isFollowing }));
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/homepageUser/jelajah?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const statIcons = [FileText, CheckCircle2, TrendingUp, MapPin];
  const statColors = [
    "text-[#192126] bg-blue-50",
    "text-green-600 bg-green-50",
    "text-amber-600 bg-amber-50",
    "text-violet-600 bg-violet-50",
  ];

  // Group nearby users by area
  const areaGroups = nearbyUsers.reduce((acc, user) => {
    const area = user.area || "Area Lain";
    if (!acc[area]) acc[area] = [];
    acc[area].push(user);
    return acc;
  }, {});

  const displayedUsers = showMore ? nearbyUsers : nearbyUsers.slice(0, 4);

  return (
    <div className="flex flex-col gap-4">
      {/* Search Bar Form */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B0A898]" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari laporan, hashtag, warga..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E8E2D9] rounded-xl text-sm text-[#111827] placeholder:text-[#B0A898] focus:outline-none focus:border-[#192126] focus:ring-2 focus:ring-[#192126]/10 transition"
        />
      </form>

      {/* Platform Stats */}
      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4">
        <h3 className="font-semibold text-sm text-[#111827] mb-3 flex items-center gap-2">
          <BarChart3 size={15} className="text-[#192126]" />
          Statistik Platform
        </h3>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[#F5F0E8] border border-[#F0EAE0] rounded-xl p-2.5 animate-pulse h-14" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {platformStats.map((stat, i) => {
              const Icon = statIcons[i];
              return (
                <div key={stat.label} className="bg-[#FFFBF5] border border-[#F0EAE0] rounded-xl p-2.5">
                  <div className={`w-7 h-7 rounded-lg ${statColors[i]} flex items-center justify-center mb-1.5`}>
                    {Icon && <Icon size={13} />}
                  </div>
                  <p className="font-bold text-sm text-[#111827]">{stat.value}</p>
                  <p className="text-[10px] text-[#6B6B8A] leading-tight">{stat.label}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Trending Hashtags */}
      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4">
        <h3 className="font-semibold text-sm text-[#111827] mb-3 flex items-center gap-2">
          <Flame size={15} className="text-orange-500" />
          Trending Minggu Ini
        </h3>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 bg-[#F5F0E8] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : trendingHashtags.length === 0 ? (
          <p className="text-xs text-[#B0A898] text-center py-3">Belum ada tren hashtag.</p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {trendingHashtags.map((tag, i) => (
              <Link
                key={tag.name}
                href={`/homepageUser/jelajah?q=${encodeURIComponent(tag.name)}`}
                className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-[#F5F0E8] transition group text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#B0A898] w-4">{i + 1}</span>
                  <div>
                    <p className="text-xs font-semibold text-[#192126] group-hover:underline">
                      #{tag.name}
                    </p>
                    <p className="text-[10px] text-[#6B6B8A]">
                      {tag.count} laporan
                    </p>
                  </div>
                </div>
                <TrendingUp size={12} className="text-[#B0A898] group-hover:text-orange-500 transition" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Active Users Nearby */}
      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4">
        <h3 className="font-semibold text-sm text-[#111827] mb-3 flex items-center gap-2">
          <Users size={15} className="text-[#60A5FA]" />
          Warga Aktif di Sekitar
        </h3>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2.5 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-[#F5F0E8]" />
                <div className="flex-1">
                  <div className="h-3 bg-[#F5F0E8] rounded w-24 mb-1.5" />
                  <div className="h-2.5 bg-[#F5F0E8] rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : nearbyUsers.length === 0 ? (
          <p className="text-xs text-[#B0A898] text-center py-3">Belum ada warga aktif di sekitar.</p>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {displayedUsers.map((reporter, idx) => (
                <div key={reporter.id} className="flex items-center gap-2.5">
                  <button
                    onClick={() => router.push(`/homepageUser/profil?userId=${reporter.id}`)}
                    className="flex-shrink-0"
                  >
                    <Avatar
                      src={reporter.avatar}
                      initials={reporter.initials}
                      color={AVATAR_COLORS[idx % AVATAR_COLORS.length]}
                      size="w-9 h-9"
                      textSize="text-xs"
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => router.push(`/homepageUser/profil?userId=${reporter.id}`)}
                      className="text-xs font-semibold text-[#111827] truncate hover:text-[#192126] transition block text-left w-full"
                    >
                      {reporter.name}
                    </button>
                    <p className="text-[10px] text-[#6B6B8A] flex items-center gap-1">
                      <MapPin size={9} />
                      {reporter.area || reporter.location || "—"} · {reporter.reports} laporan
                    </p>
                  </div>
                  <button
                    onClick={() => toggleFollow(reporter.id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all flex-shrink-0 ${
                      followStates[reporter.id]
                        ? "bg-[#F5F0E8] text-[#3D3D5C] border border-[#E8E2D9] hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                        : "bg-[#192126] text-white hover:bg-[#2b2e2f]"
                    }`}
                  >
                    {followStates[reporter.id] ? "Mengikuti" : "Ikuti"}
                  </button>
                </div>
              ))}
            </div>

            {nearbyUsers.length > 4 && (
              <button
                onClick={() => setShowMore(!showMore)}
                className="mt-3 w-full text-[11px] font-semibold text-[#192126] hover:underline flex items-center justify-center gap-1"
              >
                {showMore ? "Tampilkan lebih sedikit" : `Lihat ${nearbyUsers.length - 4} lagi`}
                <ChevronRight size={12} className={`transition-transform ${showMore ? "rotate-90" : ""}`} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <p className="text-[10px] text-[#B0A898] leading-relaxed px-1">
        © {new Date().getFullYear()} KataWarga · Kebijakan Privasi · Syarat &amp; Ketentuan
      </p>
    </div>
  );
}
