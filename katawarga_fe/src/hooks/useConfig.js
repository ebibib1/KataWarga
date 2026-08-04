'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Module-level cache: config is the same for all users (not user-specific)
let cachedConfig = null;
let fetchPromise = null;

function fetchConfig(token) {
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch(`${API_URL}/config`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
    .then((r) => {
      if (!r.ok) throw new Error('Config fetch failed');
      return r.json();
    })
    .then((data) => {
      cachedConfig = data;
      return data;
    })
    .catch(() => {
      // Fallback hardcoded config so the UI never fully breaks
      const fallback = {
        categories: [
          { id: 1, name: 'Jalan Rusak',      bg: 'bg-red-500/10 text-red-500',       border: 'border-red-200',    color: '#EF4444' },
          { id: 2, name: 'Sampah',            bg: 'bg-green-500/10 text-green-600',   border: 'border-green-200',  color: '#22C55E' },
          { id: 3, name: 'Banjir',            bg: 'bg-indigo-500/10 text-indigo-500', border: 'border-indigo-200', color: '#6366F1' },
          { id: 4, name: 'Penerangan Jalan',  bg: 'bg-amber-500/10 text-amber-500',   border: 'border-amber-200',  color: '#F59E0B' },
          { id: 5, name: 'Vandalisme',        bg: 'bg-violet-500/10 text-violet-500', border: 'border-violet-200', color: '#8B5CF6' },
          { id: 6, name: 'Fasilitas Umum',    bg: 'bg-blue-500/10 text-blue-500',     border: 'border-blue-200',   color: '#3B82F6' },
        ],
        statuses: {
          menunggu: { label: 'Menunggu', className: 'bg-yellow-50 text-yellow-700 border-yellow-200', spin: false },
          diproses: { label: 'Diproses', className: 'bg-blue-50 text-blue-700 border-blue-200',       spin: true  },
          selesai:  { label: 'Selesai',  className: 'bg-green-50 text-green-700 border-green-200',    spin: false },
          ditolak:  { label: 'Ditolak',  className: 'bg-red-50 text-red-700 border-red-200',          spin: false },
          draft:    { label: 'Draft',    className: 'bg-gray-50 text-gray-600 border-gray-200',        spin: false },
        },
        priorities: {
          tinggi: { label: 'Prioritas Tinggi', className: 'bg-red-100 text-red-600',      dot: 'bg-red-500'    },
          sedang: { label: 'Prioritas Sedang', className: 'bg-orange-100 text-orange-600', dot: 'bg-orange-500' },
          rendah: { label: 'Prioritas Rendah', className: 'bg-slate-100 text-slate-500',   dot: 'bg-slate-400'  },
        },
        flagReasons: {
          spam:           'Spam',
          hoax:           'Hoax / Informasi Palsu',
          tidak_relevan:  'Tidak Relevan',
          konten_ofensif: 'Konten Ofensif',
          lainnya:        'Lainnya',
        },
      };
      cachedConfig = fallback;
      fetchPromise = null; // allow retry on next mount
      return fallback;
    });

  return fetchPromise;
}

/**
 * useConfig — fetches /api/config once per browser session and caches it.
 * Falls back to hardcoded values if API is unreachable.
 *
 * Returns: { config, loading }
 *   config.categories  → Array<{ id, name, bg, border, color }>
 *   config.statuses    → Record<string, { label, className, spin }>
 *   config.priorities  → Record<string, { label, className, dot }>
 *   config.flagReasons → Record<string, string>
 */
export function useConfig() {
  const { data: session } = useSession();
  const [config, setConfig]   = useState(cachedConfig);
  const [loading, setLoading] = useState(!cachedConfig);

  useEffect(() => {
    if (cachedConfig) {
      setConfig(cachedConfig);
      setLoading(false);
      return;
    }

    const token = session?.accessToken;
    fetchConfig(token).then((data) => {
      setConfig(data);
      setLoading(false);
    });
  }, [session?.accessToken]);

  return { config, loading };
}
