const reportCtrl = require('./src/controllers/report.controller');

const req = {
  body: {
    title: 'Laporan Test Jalan Rusak',
    description: 'Jalan rusak berlubang parah di sekitar RT 03, tolong diperbaiki.',
    category_id: 1,
    priority: 'sedang',
    hashtags: 'jalanrusak, lobang, test',
    latitude: -6.200000,
    longitude: 106.816666,
    address: 'Jl. Jenderal Sudirman No. 1'
  },
  user: {
    id: 17,
    role: 'user'
  }
};

const res = {
  status: (code) => {
    console.log('HTTP Status Code:', code);
    return {
      json: (data) => console.log('Response JSON:', data)
    };
  }
};

async function run() {
  try {
    await reportCtrl.createReport(req, res);
  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    process.exit();
  }
}

run();
