const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost', user: 'root', password: 'ebiiSQL', database: 'db_KataWarga'
  });

  try {
    const [cols] = await conn.query("DESCRIBE public_reports");
    console.log("public_reports columns:");
    console.table(cols);

    const [userCols] = await conn.query("DESCRIBE users");
    console.log("users columns:");
    console.table(userCols);

    const [followCols] = await conn.query("DESCRIBE user_follows");
    console.log("user_follows columns:");
    console.table(followCols);
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await conn.end();
  }
}

run();
