const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function run() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'ebiiSQL',
    database: 'db_KataWarga'
  });

  try {
    const hashed = await bcrypt.hash('password123', 10);
    const [res] = await connection.query(
      "UPDATE users SET password = ? WHERE email = ?",
      [hashed, 'ebi@gmail.com']
    );
    console.log("Password updated successfully:", res);
  } catch (err) {
    console.error("Error updating password:", err);
  } finally {
    await connection.end();
  }
}

run();
