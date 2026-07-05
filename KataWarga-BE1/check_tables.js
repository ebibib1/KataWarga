const mysql = require('mysql2/promise');

async function check() {
  const conn = await mysql.createConnection({
    host: 'localhost', user: 'root', password: 'ebiiSQL', database: 'db_KataWarga'
  });

  // Check report_bookmarks
  const [t1] = await conn.query("SHOW TABLES LIKE 'report_bookmarks'");
  if (t1.length === 0) {
    await conn.query(`
      CREATE TABLE report_bookmarks (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    INT NOT NULL,
        report_id  INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_bookmark (user_id, report_id),
        FOREIGN KEY (user_id)   REFERENCES users(id)           ON DELETE CASCADE,
        FOREIGN KEY (report_id) REFERENCES public_reports(id)  ON DELETE CASCADE
      )
    `);
    console.log('✅ Created report_bookmarks table');
  } else {
    console.log('✅ report_bookmarks table EXISTS');
  }

  // Check report_likes
  const [t2] = await conn.query("SHOW TABLES LIKE 'report_likes'");
  if (t2.length === 0) {
    await conn.query(`
      CREATE TABLE report_likes (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    INT NOT NULL,
        report_id  INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_like (user_id, report_id),
        FOREIGN KEY (user_id)   REFERENCES users(id)           ON DELETE CASCADE,
        FOREIGN KEY (report_id) REFERENCES public_reports(id)  ON DELETE CASCADE
      )
    `);
    console.log('✅ Created report_likes table');
  } else {
    console.log('✅ report_likes table EXISTS');
  }

  // Check comments
  const [t3] = await conn.query("SHOW TABLES LIKE 'comments'");
  console.log(`${t3.length > 0 ? '✅' : '❌'} comments table: ${t3.length > 0 ? 'EXISTS' : 'MISSING'}`);

  // Show all tables
  const [tables] = await conn.query('SHOW TABLES');
  console.log('\nAll tables:', tables.map(t => Object.values(t)[0]).join(', '));

  await conn.end();
}

check().catch(console.error);
