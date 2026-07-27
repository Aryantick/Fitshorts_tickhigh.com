// const telecomClient = require('./integrations/telecom/telecom.client');

// async function test() {
//   try {
//     const result = await telecomClient.checksub('211911961169');
//     console.log('Checksub response:', result);
//   } catch (err) {
//     console.error('Error:', err.response?.data || err.message);
//   }
// }

// test();
const pool = require('./config/db.config');

async function test() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    console.log('DB connected! Result:', rows);
  } catch (err) {
    console.error('DB connection failed:', err.message);
  }
}

test();