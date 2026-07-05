require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrateImageColumn() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔄 Mengubah kolom image ke LONGBLOB...');
    await db.query('ALTER TABLE public_reports MODIFY COLUMN image LONGBLOB');
    console.log('✅ Kolom image berhasil diubah ke LONGBLOB');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.end();
  }
}

migrateImageColumn();