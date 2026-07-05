const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'ebiiSQL',
    database: 'db_KataWarga'
  });

  try {
    console.log('=== Draft Migration: Add "draft" to status enum ===\n');

    await connection.query(
      `ALTER TABLE public_reports MODIFY COLUMN status 
       ENUM('menunggu', 'diproses', 'selesai', 'ditolak', 'draft') 
       DEFAULT 'menunggu'`
    );
    console.log('✅ Status column altered successfully');

    const [cols] = await connection.query('SHOW COLUMNS FROM public_reports WHERE Field = "status"');
    if (cols.length > 0) {
      console.log(`   Current type: ${cols[0].Type}`);
      if (cols[0].Type.includes("'draft'")) {
        console.log('✅ Validation passed: "draft" is now in the enum');
      } else {
        console.log('❌ Validation failed: "draft" not found in enum');
      }
    }
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
  } finally {
    await connection.end();
  }
}

migrate();
