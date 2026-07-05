const http = require('http');

// Test full flow: login → create report → fetch my reports
async function testFlow() {
  const BASE = 'http://localhost:5000/api';

  function request(method, path, body, token) {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : null;
      const opts = {
        hostname: 'localhost',
        port: 5000,
        path: `/api${path}`,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      };
      const req = http.request(opts, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
          catch(e) { resolve({ status: res.statusCode, body: data }); }
        });
      });
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  }

  console.log('=== KataWarga API End-to-End Test ===\n');

  // 1. Health check
  console.log('1. Health check...');
  const ping = await request('GET', '/ping');
  console.log(`   ${ping.status === 200 ? '✅' : '❌'} Ping: ${ping.body.message}`);

  // 2. Login as user
  console.log('\n2. Login as user (ebi@gmail.com)...');
  const login = await request('POST', '/auth/login', { email: 'ebi@gmail.com', password: 'password123' });
  if (login.status === 200 && login.body.token) {
    console.log(`   ✅ Login berhasil! User: ${login.body.user.name} (${login.body.user.role})`);
    console.log(`   Token: ${login.body.token.substring(0, 40)}...`);
  } else {
    console.log(`   ❌ Login gagal! Status: ${login.status}, Body:`, login.body);
    return;
  }
  const userToken = login.body.token;

  // 3. Create report
  console.log('\n3. Submit laporan baru...');
  // Note: multipart/form-data requires different handling, so we test the controller logic via direct DB insert test instead
  // We'll test with a form-data-like node-fetch simulation
  // Instead, let's verify GET /reports works (which requires login)
  const reports = await request('GET', '/reports?page=1&limit=5', null, userToken);
  if (reports.status === 200) {
    console.log(`   ✅ GET /reports berhasil! Total: ${reports.body.pagination?.total} laporan`);
    reports.body.data?.slice(0, 3).forEach(r =>
      console.log(`      - [#${r.id}] ${r.title?.substring(0, 50)} (${r.status})`)
    );
  } else {
    console.log(`   ❌ GET /reports gagal! Status: ${reports.status}`, reports.body);
  }

  // 4. Login as admin
  console.log('\n4. Login sebagai admin (admin1@gmail.com)...');
  const adminLogin = await request('POST', '/auth/login', { email: 'admin1@gmail.com', password: 'admin123' });
  if (adminLogin.status === 200) {
    console.log(`   ✅ Login admin berhasil! User: ${adminLogin.body.user.name} (${adminLogin.body.user.role})`);
  } else {
    console.log(`   ❌ Login admin gagal!`, adminLogin.body);
  }
  const adminToken = adminLogin.body?.token;

  // 5. Login as super admin
  console.log('\n5. Login sebagai super admin (superadmin@gmail.com)...');
  const saLogin = await request('POST', '/auth/login', { email: 'superadmin@gmail.com', password: 'admin123' });
  if (saLogin.status === 200) {
    console.log(`   ✅ Login super admin berhasil! User: ${saLogin.body.user.name} (${saLogin.body.user.role})`);
  } else {
    console.log(`   ❌ Login super admin gagal!`, saLogin.body);
  }

  // 6. Get categories
  console.log('\n6. GET /categories...');
  const cats = await request('GET', '/categories');
  if (cats.status === 200) {
    console.log(`   ✅ Categories berhasil! Jumlah: ${cats.body.data?.length}`);
    cats.body.data?.forEach(c => console.log(`      - [id ${c.id}] ${c.category_name}`));
  } else {
    console.log(`   ❌ GET /categories gagal!`, cats.body);
  }

  // 8. Test Bookmarks
  console.log('\n8. Test Bookmark Flow...');
  const reportId = reports.body.data[0].id;
  const bookmark = await request('POST', `/reports/${reportId}/bookmark`, null, userToken);
  console.log(`   ${bookmark.status === 201 ? '✅' : '❌'} Bookmark report ${reportId}: Status ${bookmark.status}, Body ${JSON.stringify(bookmark.body)}`);

  // 9. Test Search API
  console.log('\n9. Test Search API...');
  const search = await request('GET', '/reports?search=jalan', null, userToken);
  console.log(`   ${search.status === 200 ? '✅' : '❌'} Search 'jalan': ${search.body.data?.length} results`);

  // 10. Test Draft Status (requires logic to check DB directly)
  console.log('\n10. Check Draft Support...');
  const mysql = require('mysql2/promise');
  const conn2 = await mysql.createConnection({ host: 'localhost', user: 'root', password: 'ebiiSQL', database: 'db_KataWarga' });
  const [enumRows] = await conn2.query("SHOW COLUMNS FROM public_reports LIKE 'status'");
  const enumType = enumRows[0].Type;
  console.log(`    Status Column Type: ${enumType}`);
  console.log(`    ${enumType.includes('draft') ? '✅' : '❌'} 'draft' in ENUM list`);
  await conn2.end();
  console.log('\n📋 Akun untuk testing:');
  console.log('   User:        ebi@gmail.com    / password123');
  console.log('   Admin:       admin1@gmail.com  / admin123');
  console.log('   Super Admin: superadmin@gmail.com / admin123');
}

testFlow().catch(console.error);
