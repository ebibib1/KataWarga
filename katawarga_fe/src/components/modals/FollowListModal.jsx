"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { X, Users, MapPin, Loader2 } from "lucide-react";
import Avatar from "@/components/ui/Avatar";

export default function FollowListModal({ userId, type, onClose }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = session?.accessToken || session?.user?.accessToken;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    if (!userId || !token) return;
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const endpoint = type === "followers" ? "followers" : "following";
        const res = await fetch(`${apiUrl}/users/${userId}/${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data.data || []);
        }
      } catch (err) {
        console.error("Fetch follow users error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [userId, type, token, apiUrl]);

  const handleUserClick = (targetId) => {
    router.push(`/homepageUser/profil?userId=${targetId}`);
    onClose();
  };

  const title = type === "followers" ? "Pengikut" : "Mengikuti";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Modal Card */}
      <div className="bg-white border border-[#E8E2D9] rounded-3xl w-full max-w-md max-h-[80vh] overflow-y-auto flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#F0EAE0] flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[#192126]" />
            <h3 className="font-bold text-sm text-[#111827]">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#F5F0E8] text-[#6B6B8A] hover:text-[#111827] transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* User list content */}
        <div className="p-4 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Loader2 className="animate-spin text-[#192126]" size={20} />
              <p className="text-[11px] text-[#6B6B8A] font-semibold">Memuat daftar...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 text-[#B0A898]">
              <Users size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold">Belum ada data</p>
              <p className="text-[10px] text-[#6B6B8A] mt-0.5">Daftar {title.toLowerCase()} kosong.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                  className="flex items-start gap-3 p-2 rounded-2xl hover:bg-[#FFFBF5] border border-transparent hover:border-[#E8E2D9] transition cursor-pointer"
                >
                  <Avatar
                    src={user.avatar}
                    initials={user.name?.substring(0, 2).toUpperCase() || "??"}
                    color="bg-[#192126]"
                    size="w-9 h-9"
                    textSize="text-xs"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-[#111827] truncate hover:text-[#192126]">
                      {user.name}
                    </h4>
                    {user.location && (
                      <p className="text-[9px] text-[#6B6B8A] flex items-center gap-0.5 mt-0.5 font-semibold">
                        <MapPin size={9} />
                        {user.location}
                      </p>
                    )}
                    {user.bio && (
                      <p className="text-[10px] text-[#3D3D5C] mt-1 line-clamp-1 leading-normal italic">
                        "{user.bio}"
                      </p>
                    )}
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
