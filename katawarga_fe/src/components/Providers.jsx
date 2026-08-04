"use client";

import React, { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";

function SSEListener() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.accessToken) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const eventSource = new EventSource(`${apiUrl}/sse/events?token=${session.accessToken}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      alert(`Notifikasi: ${data.title} - ${data.message}`);
      // Di sini bisa dipasang sistem toast notification
    };

    return () => eventSource.close();
  }, [session]);

  return null;
}

export function Providers({ children }) {
  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <SessionProvider>
      <SSEListener />
      {children}
    </SessionProvider>
  );
}
