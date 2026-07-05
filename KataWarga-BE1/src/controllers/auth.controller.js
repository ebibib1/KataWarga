const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nama, email, dan password wajib diisi.' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email sudah terdaftar.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const username = email.split('@')[0];
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, username) VALUES (?, ?, ?, ?)',
      [name, email, hashed, username]
    );

    // Auto-create user profile row
    await db.query('INSERT INTO user_profiles (user_id) VALUES (?)', [result.insertId]);

    return res.status(201).json({
      message: 'Registrasi berhasil.',
      userId: result.insertId,
    });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi.' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    // Update status online
    await db.query(
      'UPDATE users SET is_online = 1, last_seen = NOW() WHERE id = ?',
      [user.id]
    );

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      message: 'Login berhasil.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    await db.query(
      'UPDATE users SET is_online = 0, last_seen = NOW() WHERE id = ?',
      [req.user.id]
    );
    return res.status(200).json({ message: 'Logout berhasil.' });
  } catch (err) {
    console.error('logout error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/auth/me
const me = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, username, email, role, avatar, is_online, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User tidak ditemukan.' });
    return res.status(200).json({ user: rows[0] });
  } catch (err) {
    console.error('me error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { register, login, logout, me };
