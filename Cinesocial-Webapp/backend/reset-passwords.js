require('dotenv').config({path: '../.env'});
const sql = require('mssql');
const bcrypt = require('bcryptjs');

async function run() {
  const pool = await sql.connect({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: 'localhost',
    database: process.env.DB_NAME,
    options: { encrypt: true, trustServerCertificate: true, instanceName: 'SQLEXPRESS' }
  });
  
  const newHash = await bcrypt.hash('password123', 10);
  
  await pool.request().query(`
    UPDATE Users SET Password_hash = '${newHash}' 
    WHERE Username IN ('arthouselena', 'horrorking_li');
  `);
  
  console.log('Passwords reset to password123 successfully.');
  process.exit(0);
}
run().catch(console.error);
