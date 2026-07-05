const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function migrate() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'ebiiSQL',
    database: 'db_KataWarga'
  });

  try {
    console.log('=== KataWarga DB Migration ===\n');

    // 1. Add missing columns to public_reports
    console.log('1. Adding missing columns to public_reports...');
    try {
      await connection.query(`ALTER TABLE public_reports ADD COLUMN is_resolved_by_user TINYINT(1) DEFAULT 0`);
      console.log('   ✅ Added is_resolved_by_user');
    } catch(e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('   ℹ️  is_resolved_by_user already exists');
      else throw e;
    }
    try {
      await connection.query(`ALTER TABLE public_reports ADD COLUMN resolved_at TIMESTAMP NULL DEFAULT NULL`);
      console.log('   ✅ Added resolved_at');
    } catch(e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('   ℹ️  resolved_at already exists');
      else throw e;
    }

    // 2. Ensure all users have bcrypt-hashed passwords
    console.log('\n2. Hashing passwords for all users...');
    const [users] = await connection.query('SELECT id, email, password FROM users');
    for (const user of users) {
      // Check if already bcrypt hash (starts with $2a$ or $2b$)
      if (!user.password.startsWith('$2')) {
        const hashed = await bcrypt.hash(user.password, 10);
        await connection.query('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id]);
        console.log(`   ✅ Hashed password for ${user.email}`);
      } else {
        console.log(`   ℹ️  ${user.email} already has hashed password`);
      }
    }

    // 3. Ensure test users have known passwords
    console.log('\n3. Setting known passwords for test accounts...');
    const testUsers = [
      { email: 'ebi@gmail.com',         password: 'password123' },
      { email: 'ebi1@gmail.com',        password: 'password123' },
      { email: 'ebi2@gmail.com',        password: 'password123' },
      { email: 'superadmin@gmail.com',  password: 'admin123' },
      { email: 'admin1@gmail.com',      password: 'admin123' },
      { email: 'admin2gmail.com',       password: 'admin123' },
      { email: 'adminkata@gmail.com',   password: 'admin123' },
    ];
    for (const u of testUsers) {
      const hashed = await bcrypt.hash(u.password, 10);
      const [res] = await connection.query('UPDATE users SET password = ? WHERE email = ?', [hashed, u.email]);
      if (res.affectedRows > 0) console.log(`   ✅ Reset password for ${u.email} → ${u.password}`);
    }

    console.log('\n=== Migration Complete ===');

    // Final summary
    const [cols] = await connection.query('SHOW COLUMNS FROM public_reports');
    console.log('\nCurrent public_reports columns:');
    cols.forEach(c => console.log(`  - ${c.Field} (${c.Type})`));

    const [allUsers] = await connection.query('SELECT id, name, email, role FROM users');
    console.log('\nCurrent users:');
    allUsers.forEach(u => console.log(`  [${u.id}] ${u.email} — ${u.role}`));

  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
  } finally {
    await connection.end();
  }
}

migrate();
