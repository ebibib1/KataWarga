"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Home, Search, Plus, Bell, User } from "lucide-react";
import { useSession } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/homepageUser",            icon: Home,   label: "Beranda"    },
  { href: "/homepageUser/jelajah",    icon: Search, label: "Jelajah"    },
  { href: "/homepageUser/notifikasi", icon: Bell,   label: "Notifikasi", badge: true },
  { href: "/homepageUser/profil",     icon: User,   label: "Profil"     },
];

export default function MobileBottomNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
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

  const isActive = (href) => {
    if (href === "/homepageUser") return pathname === "/homepageUser";
    return pathname.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8E2D9] flex items-center justify-around px-2 py-2">
      {/* Left 2 items */}
      {NAV_ITEMS.slice(0, 2).map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${
              active ? "text-[#192126]" : "text-[#6B6B8A]"
            }`}
          >
            <Icon size={20} />
            <span className="text-[9px] font-semibold">{item.label}</span>
          </Link>
        );
      })}

      {/* Center FAB — Buat Laporan */}
      <Link
        href="/homepageUser/buat-laporan"
        className="flex flex-col items-center gap-0.5 -mt-4"
      >
        <div className="w-12 h-12 rounded-full bg-[#192126] text-white flex items-center justify-center shadow-xl shadow-[#192126]/30 hover:bg-[#2b2e2f] transition">
          <Plus size={22} />
        </div>
        <span className="text-[9px] font-semibold text-[#192126] mt-0.5">
          Lapor
        </span>
      </Link>

      {/* Right 2 items */}
      {NAV_ITEMS.slice(2).map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${
              active ? "text-[#192126]" : "text-[#6B6B8A]"
            }`}
          >
            <Icon size={20} />
            <span className="text-[9px] font-semibold">{item.label}</span>
            {item.badge && unreadCount > 0 && (
              <span className="absolute -top-0.5 right-1 w-4 h-4 bg-[#192126] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
