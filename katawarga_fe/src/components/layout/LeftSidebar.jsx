"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Bell,
  FileText,
  Bookmark,
  Map,
  User,
  Settings,
  Plus,
  LogOut,
  UserCircle,
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useState, useEffect } from "react";


const NAV_ITEMS = [
  { href: "/homepageUser",            icon: Home,     label: "Beranda"      },
  { href: "/homepageUser/jelajah",    icon: Search,   label: "Jelajahi"     },
  { href: "/homepageUser/notifikasi", icon: Bell,     label: "Notifikasi",  badge: true },
  { href: "/homepageUser/laporan",    icon: FileText, label: "Laporan Saya" },
  { href: "/homepageUser/tersimpan",  icon: Bookmark, label: "Tersimpan"    },
  { href: "/homepageUser/peta",       icon: Map,      label: "Peta"         },
  { href: "/homepageUser/profil",     icon: User,     label: "Profil"       },
  { href: "/homepageUser/pengaturan", icon: Settings, label: "Pengaturan"   },
];

export default function LeftSidebar() {
  const pathname    = usePathname();
  const profile     = useUserProfile();

  // Dynamic unread count — synced with localStorage via kw_notif_update event
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    const getCount = () => {
      const stored = localStorage.getItem('kw_unread_notif_count');
      // If never set, fall back to a default count
      setUnreadCount(stored !== null ? parseInt(stored, 10) : 0);
    };
    getCount();
    window.addEventListener('kw_notif_update', getCount);
    return () => window.removeEventListener('kw_notif_update', getCount);
  }, []);

  const isActive = (href) => {
    if (href === "/homepageUser") return pathname === "/homepageUser";
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden md:flex flex-col sticky top-0 h-screen w-56 xl:w-64 flex-shrink-0 border-r border-[#E8E2D9] bg-[#FFFBF5] pt-4 pb-6 px-3">
      {/* Logo */}
      <div className="px-2 mb-6">
        <Link href="/homepageUser" className="flex items-center gap-2.5">
          <div className="w-9 h-9 relative flex-shrink-0">
            <Image
              src="/assets/KataWarga_Logo.webp"
              alt="KataWarga"
              width={36}
              height={36}
              className="rounded-xl object-contain"
            />
          </div>
          <span className="font-bold text-[#111827] text-base tracking-tight font-display">
            KataWarga
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {NAV_ITEMS.map((item) => {
          const Icon   = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-[#192126] text-white shadow-md shadow-[#192126]/20"
                  : "text-[#3D3D5C] hover:bg-[#EDE7D9] hover:text-[#111827]"
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.badge && unreadCount > 0 && (
                <span
                  className={`ml-auto text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                    active ? "bg-white text-[#192126]" : "bg-[#192126] text-white"
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Create Report CTA */}
      <Link
        href="/homepageUser/buat-laporan"
        className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#192126] text-white font-semibold text-sm rounded-xl hover:bg-[#2b2e2f] transition active:scale-[0.98] shadow-lg shadow-[#192126]/20 mb-4"
      >
        <Plus size={17} />
        Buat Laporan
      </Link>

      {/* User mini card — shows real avatar & name from useUserProfile */}
      <Link
        href="/homepageUser/profil"
        className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-[#EDE7D9] transition group"
      >
        <Avatar
          src={profile.avatarUrl}
          initials={profile.initials}
          color="bg-[#192126]"
          size="w-9 h-9"
          textSize="text-xs"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#111827] truncate group-hover:text-[#192126] transition">
            {profile.name}
          </p>
          <p className="text-[10px] text-[#6B6B8A] truncate">
            {profile.email || `@${profile.username}`}
          </p>
        </div>
        <LogOut
          onClick={(e) => {
            e.preventDefault();
            localStorage.removeItem("user_profile_custom");
            localStorage.removeItem("user_avatar_custom");
            signOut({ callbackUrl: "/auth/login" });
          }}
          size={14}
          className="text-[#6B6B8A] flex-shrink-0 hover:text-red-500 transition"
        />
      </Link>
    </aside>
  );
}
