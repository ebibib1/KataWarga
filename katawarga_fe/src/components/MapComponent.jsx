"use client";

import React, { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ── Category → color ────────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  "Jalan Rusak":      "#EF4444",
  "Sampah":           "#22C55E",
  "Banjir":           "#6366F1",
  "Penerangan Jalan": "#F59E0B",
  "Vandalisme":       "#8B5CF6",
  "Fasilitas Umum":   "#3B82F6",
};

// ── Status config ───────────────────────────────────────────────────────────
const STATUS_STYLE = {
  menunggu: { bg: "#FEF3C7", text: "#92400E", label: "Menunggu" },
  diproses: { bg: "#DBEAFE", text: "#1E40AF", label: "Diproses" },
  selesai:  { bg: "#D1FAE5", text: "#065F46", label: "Selesai"  },
  ditolak:  { bg: "#FEE2E2", text: "#991B1B", label: "Ditolak"  },
};

// ── SVG pin marker (no emoji) ───────────────────────────────────────────────
function buildMarkerIcon(category, priority) {
  const color = CATEGORY_COLORS[category] || "#192126";
  const isPulse = priority === "tinggi";
  const size    = isPulse ? 30 : 24;

  const pulseSvg = isPulse
    ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${color}" opacity="0.2">
         <animate attributeName="r" from="${size / 2}" to="${size}" dur="1.5s" repeatCount="indefinite"/>
         <animate attributeName="opacity" from="0.25" to="0" dur="1.5s" repeatCount="indefinite"/>
       </circle>`
    : "";

  const pinSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 6}" viewBox="0 0 ${size} ${size + 6}" style="overflow:visible">
      ${pulseSvg}
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="${color}" stroke="white" stroke-width="2.5"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 4}" fill="white"/>
    </svg>`;

  return L.divIcon({
    className: "kw-map-marker",
    html: `<div style="filter:drop-shadow(0 2px 5px rgba(0,0,0,0.3))">${pinSvg}</div>`,
    iconSize:   [size, size + 6],
    iconAnchor: [size / 2, size / 2],
    popupAnchor:[0, -(size / 2) - 4],
  });
}

// ── User location marker (GPS dot, no emoji) ────────────────────────────────
function buildUserIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="overflow:visible">
      <circle cx="12" cy="12" r="12" fill="#192126" opacity="0.15">
        <animate attributeName="r" from="10" to="18" dur="1.8s" repeatCount="indefinite"/>
        <animate attributeName="opacity" from="0.2" to="0" dur="1.8s" repeatCount="indefinite"/>
      </circle>
      <circle cx="12" cy="12" r="8" fill="#192126" stroke="white" stroke-width="3"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
    </svg>`;

  return L.divIcon({
    className: "kw-user-marker",
    html: `<div style="filter:drop-shadow(0 2px 8px rgba(37,99,235,0.45))">${svg}</div>`,
    iconSize:   [24, 24],
    iconAnchor: [12, 12],
    popupAnchor:[0, -16],
  });
}

// ── Popup HTML ──────────────────────────────────────────────────────────────
function buildPopupHtml(item) {
  const statusCfg = STATUS_STYLE[item.status] || STATUS_STYLE.menunggu;
  const color     = CATEGORY_COLORS[item.category] || "#192126";

  return `
    <div style="font-family:'Segoe UI',system-ui,sans-serif;min-width:210px;max-width:240px;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap;">
        <span style="flex:1;font-size:10px;font-weight:700;color:${color};background:${color}18;border:1px solid ${color}30;padding:2px 8px;border-radius:999px;">
          ${item.category || "Umum"}
        </span>
        <span style="font-size:9px;font-weight:700;background:${statusCfg.bg};color:${statusCfg.text};padding:2px 7px;border-radius:999px;">
          ${statusCfg.label}
        </span>
      </div>
      <strong style="display:block;font-size:12px;color:#111827;line-height:1.4;margin-bottom:5px;">
        ${item.title || "Laporan"}
      </strong>
      <p style="font-size:10px;color:#6B6B8A;margin:0 0 4px;line-height:1.5;display:flex;align-items:center;gap:3px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        ${item.location || item.address || "Lokasi tidak diketahui"}
      </p>
      ${item.user_name
        ? `<p style="font-size:10px;color:#9CA3AF;margin:0 0 8px 0;">
             Dilaporkan oleh <strong style="color:#374151;">${item.user_name}</strong>
           </p>`
        : ""}
      <a href="#" onclick="window.showReportDetail(${item.id}); return false;" style="display:block;text-align:center;padding:6px 0;background:#192126;color:white;text-decoration:none;font-weight:700;font-size:10px;border-radius:8px;margin-top:6px;transition:background 0.2s;" onmouseover="this.style.background='#2b2e2f'" onmouseout="this.style.background='#192126'">
        Lihat Detail Laporan &rarr;
      </a>
    </div>`;
}

// ── GPS locate button SVG ───────────────────────────────────────────────────
const LOCATE_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#192126" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
  </svg>`;

export default function MapComponent({ markers = [], onMarkerClick }) {
  const mapContainerRef = useRef(null);
  const mapRef          = useRef(null);
  const markerGroupRef  = useRef(null);
  const userMarkerRef   = useRef(null);

  // Inject CSS once
  useEffect(() => {
    if (document.getElementById("kw-map-styles")) return;
    const style = document.createElement("style");
    style.id = "kw-map-styles";
    style.textContent = `
      .kw-map-marker, .kw-user-marker, .kw-picker-marker { background:none!important; border:none!important; }
      .leaflet-popup-content-wrapper {
        border-radius:16px!important;
        box-shadow:0 8px 32px rgba(0,0,0,0.12)!important;
        border:1px solid #E8E2D9!important;
        padding:0!important;
      }
      .leaflet-popup-content { margin:14px 14px!important; }
      .leaflet-popup-tip-container { display:none!important; }
    `;
    document.head.appendChild(style);
  }, []);

  // Initialize map once
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current, { zoomControl: false })
      .setView([-6.2088, 106.8456], 12);

    L.control.zoom({ position: "bottomright" }).addTo(mapRef.current);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapRef.current);

    markerGroupRef.current = L.featureGroup().addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current      = null;
        markerGroupRef.current = null;
      }
    };
  }, []);

  // Sync markers
  useEffect(() => {
    if (!mapRef.current || !markerGroupRef.current) return;

    markerGroupRef.current.clearLayers();

    markers.forEach((item) => {
      const lat = parseFloat(item.latitude ?? item.lat);
      const lng = parseFloat(item.longitude ?? item.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      const marker = L.marker([lat, lng], {
        icon: buildMarkerIcon(item.category, item.priority),
      });

      marker.bindPopup(buildPopupHtml(item), { maxWidth: 260, minWidth: 220 });
      marker.on("click", () => { if (onMarkerClick) onMarkerClick(item); });

      markerGroupRef.current.addLayer(marker);
    });

    if (markers.length > 0 && markerGroupRef.current.getLayers().length > 0) {
      try {
        mapRef.current.fitBounds(markerGroupRef.current.getBounds(), {
          padding: [60, 60],
          maxZoom: 14,
        });
      } catch (_) {}
    }
  }, [markers, onMarkerClick]);

  // GPS locate user
  const locateUser = useCallback(() => {
    if (!mapRef.current) return;
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung GPS.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        if (userMarkerRef.current) mapRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = L.marker([lat, lng], { icon: buildUserIcon() })
          .addTo(mapRef.current)
          .bindPopup(
            `<div style="font-size:11px;font-weight:700;color:#192126;white-space:nowrap;">Lokasi Anda Sekarang</div>`,
            { maxWidth: 180 }
          )
          .openPopup();
        mapRef.current.setView([lat, lng], 15, { animate: true });
      },
      () => alert("Tidak dapat mengakses GPS. Pastikan izin lokasi browser sudah diaktifkan."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%", minHeight: "350px" }} />

      {/* Locate Me Button — SVG icon, no emoji */}
      <button
        onClick={locateUser}
        title="Temukan lokasi saya"
        style={{
          position: "absolute",
          bottom: "52px",
          right: "12px",
          zIndex: 1000,
          background: "white",
          border: "1px solid #E8E2D9",
          borderRadius: "10px",
          width: "36px",
          height: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        }}
        dangerouslySetInnerHTML={{ __html: LOCATE_SVG }}
      />
    </div>
  );
}
