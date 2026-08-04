"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";

export function useUserProfile() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState({
    name: "Memuat...",
    username: "user",
    email: "",
    avatarUrl: null,
    initials: "?",
  });

  const fetchProfile = () => {
    if (!session?.accessToken) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

    fetch(`${apiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const u = data?.user;
        if (!u) return;

        const displayName = u.name || "Pengguna";
        const initials = displayName
          .split(" ")
          .slice(0, 2)
          .map((w) => w[0] || "")
          .join("")
          .toUpperCase() || "?";

        setProfile({
          name: displayName,
          username: u.username || u.email?.split("@")[0] || "user",
          email: u.email || "",
          avatarUrl: u.avatar || null,
          initials,
        });
      })
      .catch(() => {
        // fallback: session data
        const sessionName = session?.user?.name || "Pengguna";
        setProfile(prev => ({
          ...prev,
          name: sessionName,
          initials: sessionName.substring(0, 2).toUpperCase() || "?",
        }));
      });
  };

  useEffect(() => {
    fetchProfile();
    window.addEventListener("profile-updated", fetchProfile);
    return () => window.removeEventListener("profile-updated", fetchProfile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  return profile;
}

export function emitProfileUpdated() {
  window.dispatchEvent(new Event("profile-updated"));
}
