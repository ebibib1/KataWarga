"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  FileText,
  Flag,
  Layers,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  Shield,
  Home
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";

const NAV_ITEMS = [
  { href: "/dashboardAdmin",           icon: LayoutDashboard, label: "Ringkasan" },
  { href: "/dashboardAdmin/laporan",   icon: FileText,        label: "Laporan" },
  { href: "/dashboardAdmin/moderasi",  icon: Flag,            label: "Moderasi Flag" },
  { href: "/dashboardAdmin/pengaturan",icon: Settings,        label: "Pengaturan" },
];

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (
      status === "authenticated" &&
      session?.user?.role !== "admin" &&
      session?.user?.role !== "super_admin"
    ) {
      router.push("/homepageUser");
    }
  }, [status, session, router]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#192126] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#3D3D5C] text-sm font-medium">Memverifikasi otorisasi admin...</p>
        </div>
      </div>
    );
  }

  const isActive = (href) => {
    if (href === "/dashboardAdmin") return pathname === "/dashboardAdmin";
    return pathname.startsWith(href);
  };

  const userInitials = session.user.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "AD";

  const handleLogout = () => {
    signOut({ callbackUrl: "/auth/login" });
  };

  return (
    <div className="min-h-screen bg-[#FFFBF5] text-[#111827] flex">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#E8E2D9] bg-white h-screen sticky top-0 flex-shrink-0">
        {/* Header/Logo */}
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-[#E8E2D9]">
          <div className="w-8 h-8 relative flex-shrink-0 bg-[#192126] rounded-lg flex items-center justify-center text-white">
            <Shield size={18} />
          </div>
          <div>
            <span className="font-bold text-[#111827] text-base tracking-tight font-display">
              KataWarga
            </span>
            <span className="block text-[10px] text-[#192126] font-bold tracking-wider uppercase">
              Dashboard Admin
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-[#192126] text-white shadow-md shadow-[#192126]/10"
                    : "text-[#3D3D5C] hover:bg-[#FFFBF5] hover:text-[#192126]"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Footer Card */}
        <div className="p-4 border-t border-[#E8E2D9] bg-[#FFFBF5]">
          <div className="flex items-center gap-3">
            <Avatar
              src={session.user.image}
              initials={userInitials}
              color="bg-[#192126]"
              size="w-9 h-9"
              textSize="text-xs"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#111827] truncate">
                {session.user.name}
              </p>
              <p className="text-[10px] text-[#6B6B8A] truncate">
                {session.user.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 text-[#6B6B8A] transition"
              title="Keluar"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (Overlay and Menu) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40 transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          {/* Sidebar Drawer */}
          <div className="relative w-64 max-w-xs bg-white h-full flex flex-col z-10 border-r border-[#E8E2D9] animate-in slide-in-from-left duration-200">
            <div className="h-16 flex items-center justify-between px-6 border-b border-[#E8E2D9]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#192126] rounded-lg flex items-center justify-center text-white">
                  <Shield size={18} />
                </div>
                <div>
                  <span className="font-bold text-[#111827] text-base font-display">
                    KataWarga
                  </span>
                  <span className="block text-[10px] text-[#192126] font-bold">
                    Admin
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-lg hover:bg-[#FFFBF5] text-[#3D3D5C]"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? "bg-[#192126] text-white shadow-md shadow-[#192126]/10"
                        : "text-[#3D3D5C] hover:bg-[#FFFBF5] hover:text-[#192126]"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-[#E8E2D9] bg-[#FFFBF5]">
              <div className="flex items-center gap-3">
                <Avatar
                  src={session.user.image}
                  initials={userInitials}
                  color="bg-[#192126]"
                  size="w-9 h-9"
                  textSize="text-xs"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#111827] truncate">
                    {session.user.name}
                  </p>
                  <p className="text-[10px] text-[#6B6B8A] truncate">
                    {session.user.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 text-[#6B6B8A] transition"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-[#E8E2D9] bg-white px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-lg hover:bg-[#FFFBF5] text-[#3D3D5C] md:hidden transition"
            >
              <Menu size={20} />
            </button>
            <div className="hidden md:flex flex-col">
              <span className="text-xs text-[#6B6B8A]">Selamat datang kembali,</span>
              <span className="text-sm font-semibold text-[#111827]">{session.user.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Back to Citizen Homepage */}
            <Link
              href="/homepageUser"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFBF5] text-[#3D3D5C] text-xs font-medium rounded-lg border border-[#E8E2D9] hover:bg-[#EDE7D9] transition"
            >
              <Home size={14} />
              <span>Halaman Warga</span>
            </Link>

            <button className="p-1.5 rounded-lg hover:bg-[#FFFBF5] text-[#3D3D5C] relative transition">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="h-8 w-[1px] bg-[#E8E2D9]"></div>

            <Link href="/dashboardAdmin/pengaturan" className="flex items-center gap-2">
              <Avatar
                src={session.user.image}
                initials={userInitials}
                color="bg-[#192126]"
                size="w-8 h-8"
                textSize="text-[10px]"
              />
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
