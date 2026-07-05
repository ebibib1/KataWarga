const db = require('../config/db');

// GET /api/categories
const getAllCategories = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY category_name ASC');
    return res.status(200).json({ data: rows });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/categories — admin+
const createCategory = async (req, res) => {
  try {
    const { category_name, icon } = req.body;
    if (!category_name) return res.status(400).json({ message: 'Nama kategori wajib diisi.' });

    const [result] = await db.query(
      'INSERT INTO categories (category_name, icon) VALUES (?, ?)',
      [category_name, icon || null]
    );
    return res.status(201).json({ message: 'Kategori berhasil ditambahkan.', categoryId: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Kategori sudah ada.' });
    return res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/categories/:id — admin+
const updateCategory = async (req, res) => {
  try {
    const { category_name, icon } = req.body;
    await db.query('UPDATE categories SET category_name = ?, icon = ? WHERE id = ?', [category_name, icon, req.params.id]);
    return res.status(200).json({ message: 'Kategori berhasil diperbarui.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/categories/:id — super_admin
const deleteCategory = async (req, res) => {
  try {
    await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    return res.status(200).json({ message: 'Kategori berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getAllCategories, createCategory, updateCategory, deleteCategory };
