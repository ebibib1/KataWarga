"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import Avatar from "@/components/ui/Avatar";
import NotificationPanel from "@/components/layout/NotificationPanel";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSession } from "next-auth/react";

export default function MobileTopBar() {
  const { data: session } = useSession();
  const profile     = useUserProfile();
  const [showNotif, setShowNotif] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    if (!session) return;
    const token = session.accessToken || session.user?.accessToken;
    async function fetchUnread() {
      try {
        const res = await fetch(`${apiUrl}/notifications?is_read=0&limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setUnreadCount(json.data?.length ?? 0);
        }
      } catch { /* ignore */ }
    }
    fetchUnread();
  }, [session, apiUrl]);

  return (
    <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#FFFBF5]/95 backdrop-blur-sm border-b border-[#E8E2D9] sticky top-0 z-30">
      {/* Logo */}
      <Link href="/homepageUser" className="flex items-center gap-2">
        <div className="w-7 h-7 relative">
          <Image
            src="/assets/KataWarga_Logo.webp"
            alt="KataWarga"
            width={28}
            height={28}
            className="rounded-lg object-contain"
          />
        </div>
        <span className="font-bold text-[#111827] text-base font-display">
          KataWarga
        </span>
      </Link>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative p-2 rounded-full hover:bg-[#EDE7D9] transition text-[#3D3D5C]"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#192126] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {showNotif && (
              <NotificationPanel onClose={() => setShowNotif(false)} />
            )}
          </AnimatePresence>
        </div>

        {/* Profile avatar — shows real photo from useUserProfile */}
        <Link href="/homepageUser/profil">
          <Avatar
            src={profile.avatarUrl}
            initials={profile.initials}
            color="bg-[#192126]"
            size="w-8 h-8"
            textSize="text-xs"
          />
        </Link>
      </div>
    </div>
  );
}
