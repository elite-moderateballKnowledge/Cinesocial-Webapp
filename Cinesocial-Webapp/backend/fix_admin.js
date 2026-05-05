const { poolPromise } = require('./config/db');

async function fix() {
  try {
    const pool = await poolPromise;
    await pool.request().query("UPDATE Admins SET A_Password = '$2b$10$rpnZttznFtL30Gegf4PXmuMeT1.JcCDkTdv.wiyEveNi5S8b.d/cC' WHERE A_Username = 'cinesocial_admin'");
    console.log("Password fixed");
  } catch(e) { console.error(e); }
  process.exit(0);
}
fix();
