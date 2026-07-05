const db = require('../config/db');

/**
 * GET /api/config — public config: categories, statuses, priorities, flagReasons
 * Used by frontend to avoid hardcoded data in constants.js
 */
const getConfig = async (req, res) => {
  try {
    const [categories] = await db.query(
      'SELECT id, category_name AS name, icon, color FROM categories ORDER BY id'
    );

    // Map icon strings to Tailwind bg classes (since DB stores name, not Tailwind class)
    const CATEGORY_STYLES = {
      'Jalan Rusak':      { bg: 'bg-red-500/10 text-red-500',       border: 'border-red-200',    color: '#EF4444' },
      'Sampah':           { bg: 'bg-green-500/10 text-green-600',    border: 'border-green-200',  color: '#22C55E' },
      'Banjir':           { bg: 'bg-indigo-500/10 text-indigo-500',  border: 'border-indigo-200', color: '#6366F1' },
      'Penerangan Jalan': { bg: 'bg-amber-500/10 text-amber-500',    border: 'border-amber-200',  color: '#F59E0B' },
      'Vandalisme':       { bg: 'bg-violet-500/10 text-violet-500',  border: 'border-violet-200', color: '#8B5CF6' },
      'Fasilitas Umum':   { bg: 'bg-blue-500/10 text-blue-500',      border: 'border-blue-200',   color: '#3B82F6' },
    };

    const enrichedCategories = categories.map(cat => ({
      ...cat,
      ...(CATEGORY_STYLES[cat.name] || { bg: 'bg-gray-100 text-gray-600', border: 'border-gray-200', color: '#6B7280' }),
    }));

    const statuses = {
      menunggu: { label: 'Menunggu', className: 'bg-yellow-50 text-yellow-700 border-yellow-200', spin: false },
      diproses: { label: 'Diproses', className: 'bg-blue-50 text-blue-700 border-blue-200',       spin: true  },
      selesai:  { label: 'Selesai',  className: 'bg-green-50 text-green-700 border-green-200',    spin: false },
      ditolak:  { label: 'Ditolak',  className: 'bg-red-50 text-red-700 border-red-200',          spin: false },
      draft:    { label: 'Draft',    className: 'bg-gray-50 text-gray-600 border-gray-200',        spin: false },
    };

    const priorities = {
      tinggi: { label: 'Prioritas Tinggi', className: 'bg-red-100 text-red-600',     dot: 'bg-red-500'    },
      sedang: { label: 'Prioritas Sedang', className: 'bg-orange-100 text-orange-600', dot: 'bg-orange-500' },
      rendah: { label: 'Prioritas Rendah', className: 'bg-slate-100 text-slate-500',  dot: 'bg-slate-400'  },
    };

    const flagReasons = {
      spam:           'Spam',
      hoax:           'Hoax / Informasi Palsu',
      tidak_relevan:  'Tidak Relevan',
      konten_ofensif: 'Konten Ofensif',
      lainnya:        'Lainnya',
    };

    return res.json({ categories: enrichedCategories, statuses, priorities, flagReasons });
  } catch (err) {
    console.error('getConfig error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getConfig };
