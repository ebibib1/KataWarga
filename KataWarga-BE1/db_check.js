const mysql = require('mysql2/promise');

async function checkDb() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'ebiiSQL',
    database: 'db_KataWarga'
  });

  try {
    const [triggers] = await connection.query("SHOW TRIGGERS");
    console.log("=== TRIGGERS ===");
    console.log(triggers);
  } catch (err) {
    console.error("Error checking DB:", err);
  } finally {
    await connection.end();
  }
}

checkDb();
