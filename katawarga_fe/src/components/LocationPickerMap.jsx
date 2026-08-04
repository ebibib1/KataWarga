"use client";

/**
 * LocationPickerMap — Leaflet map untuk memilih titik koordinat saat membuat laporan.
 * - Klik pada peta untuk memilih lokasi
 * - Tombol "Gunakan GPS" untuk auto-detect posisi pengguna
 * - Memanggil onLocationSelect({ lat, lng, addressText }) setiap kali titik berubah
 */

import React, { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom pin icon (SVG inline, no emoji)
function buildPickerIcon(isUser = false) {
  const color = isUser ? "#192126" : "#EF4444";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.625 14 22 14 22S28 23.625 28 14C28 6.268 21.732 0 14 0z" fill="${color}" opacity="0.95"/>
      <circle cx="14" cy="14" r="6" fill="white"/>
      <circle cx="14" cy="14" r="3.5" fill="${color}"/>
    </svg>`;

  return L.divIcon({
    className: "kw-picker-marker",
    html: `<div style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.25))">${svg}</div>`,
    iconSize:   [28, 36],
    iconAnchor: [14, 36],
    popupAnchor:[0, -38],
  });
}

export default function LocationPickerMap({ onLocationSelect, initialCoords }) {
  const containerRef  = useRef(null);
  const mapRef        = useRef(null);
  const markerRef     = useRef(null);
  const userMarkerRef = useRef(null);

  // Inject minimal CSS once
  useEffect(() => {
    if (document.getElementById("kw-picker-styles")) return;
    const style = document.createElement("style");
    style.id = "kw-picker-styles";
    style.textContent = `
      .kw-picker-marker { background:none!important; border:none!important; }
      .leaflet-popup-content-wrapper {
        border-radius:14px!important;
        box-shadow:0 4px 20px rgba(0,0,0,0.10)!important;
        border:1px solid #E8E2D9!important;
        padding:0!important;
      }
      .leaflet-popup-content { margin:10px 12px!important; font-size:11px!important; color:#111827; font-weight:600; }
      .leaflet-popup-tip-container { display:none!important; }
    `;
    document.head.appendChild(style);
  }, []);

  // Reverse-geocode via Nominatim (free, no API key needed)
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=id`,
        { headers: { "Accept-Language": "id" } }
      );
      if (!res.ok) return null;
      const data = await res.json();
      return data.display_name || null;
    } catch {
      return null;
    }
  }, []);

  // Place or move the selection marker
  const placeMarker = useCallback(async (lat, lng) => {
    if (!mapRef.current) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { icon: buildPickerIcon(false), draggable: true })
        .addTo(mapRef.current);

      // Dragging also updates location
      markerRef.current.on("dragend", async () => {
        const { lat: newLat, lng: newLng } = markerRef.current.getLatLng();
        const addressText = await reverseGeocode(newLat, newLng);
        onLocationSelect({ lat: newLat, lng: newLng, addressText });
        markerRef.current
          .bindPopup(addressText ? `<span>${addressText}</span>` : `<span>${newLat.toFixed(5)}, ${newLng.toFixed(5)}</span>`)
          .openPopup();
      });
    }

    const addressText = await reverseGeocode(lat, lng);
    onLocationSelect({ lat, lng, addressText });

    markerRef.current
      .bindPopup(addressText ? `<span>${addressText}</span>` : `<span>${lat.toFixed(5)}, ${lng.toFixed(5)}</span>`)
      .openPopup();
  }, [onLocationSelect, reverseGeocode]);

  // Initialize map
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([-6.2088, 106.8456], 12);

    L.control.zoom({ position: "bottomright" }).addTo(mapRef.current);
    L.control.attribution({ prefix: false }).addTo(mapRef.current);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(mapRef.current);

    // Click to pick location
    mapRef.current.on("click", (e) => {
      placeMarker(e.latlng.lat, e.latlng.lng);
    });

    // Show initial coords if passed
    if (initialCoords?.lat && initialCoords?.lng) {
      placeMarker(initialCoords.lat, initialCoords.lng);
      mapRef.current.setView([initialCoords.lat, initialCoords.lng], 15);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current   = null;
        markerRef.current     = null;
        userMarkerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // GPS locate
  const handleGPS = useCallback(() => {
    if (!mapRef.current) return;
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung GPS.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;

        if (userMarkerRef.current) {
          mapRef.current.removeLayer(userMarkerRef.current);
        }
        userMarkerRef.current = L.marker([lat, lng], {
          icon: buildPickerIcon(true),
          draggable: false,
        }).addTo(mapRef.current);

        mapRef.current.setView([lat, lng], 16, { animate: true });
        placeMarker(lat, lng);
      },
      () => alert("Izin lokasi GPS ditolak oleh browser."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [placeMarker]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* GPS Button */}
      <button
        type="button"
        onClick={handleGPS}
        title="Gunakan lokasi GPS saya"
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: "5px",
          padding: "6px 10px",
          background: "white",
          border: "1px solid #E8E2D9",
          borderRadius: "10px",
          fontSize: "11px",
          fontWeight: 700,
          color: "#192126",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          <path d="m16.95 7.05-1.41 1.41M8.46 15.54l-1.41 1.41M7.05 7.05l1.41 1.41M15.54 15.54l1.41 1.41"/>
        </svg>
        Gunakan GPS
      </button>

      {/* Instruction overlay — shown before any marker is placed */}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          background: "rgba(17,24,39,0.75)",
          color: "white",
          fontSize: "10px",
          fontWeight: 600,
          padding: "4px 12px",
          borderRadius: "999px",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        Klik peta untuk menentukan titik lokasi · Seret pin untuk menyesuaikan
      </div>
    </div>
  );
}
