const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'ebiiSQL',
    database: 'db_KataWarga'
  });

  try {
    console.log('Adding username column to users table...');
    await connection.query(`ALTER TABLE users ADD COLUMN username varchar(100) DEFAULT NULL AFTER name`);
    console.log('Done. Populating usernames from email prefixes...');

    const [users] = await connection.query('SELECT id, email FROM users WHERE username IS NULL');
    for (const u of users) {
      const username = u.email.split('@')[0];
      await connection.query('UPDATE users SET username = ? WHERE id = ?', [username, u.id]);
      console.log(`  user ${u.id}: ${u.email} -> @${username}`);
    }

    console.log('\nMigration complete!');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists.');
    } else {
      console.error('Migration error:', err);
    }
  } finally {
    await connection.end();
  }
}

migrate();
