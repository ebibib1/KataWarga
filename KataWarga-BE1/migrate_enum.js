const mysql = require('mysql2/promise');
async function migrate() {
    const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: 'ebiiSQL', database: 'db_KataWarga' });
    await conn.query("ALTER TABLE public_reports MODIFY COLUMN status ENUM('menunggu', 'diproses', 'ditolak', 'selesai', 'draft') DEFAULT 'menunggu';");
    console.log('✅ Altered status column');
    await conn.end();
}
migrate();
