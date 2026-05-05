const { poolPromise } = require('./config/db');

async function setupAdmin() {
  try {
    const pool = await poolPromise;
    await pool.request().query("INSERT INTO Admins (A_Username, A_Password) VALUES ('cinesocial_admin', '$2b$10$rpnZttznFtL30Gegf4PXmuMeT1.JcCDkTdv.wiyEveNi5S8b.d/cC')");
    console.log("Admin inserted.");
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

setupAdmin();
