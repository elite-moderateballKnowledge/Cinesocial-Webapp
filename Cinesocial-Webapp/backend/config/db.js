const sql = require('mssql/msnodesqlv8');
require('dotenv').config({ path: '../.env' }); // Since it's inside config/

const config = {
  server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS',
  database: process.env.DB_NAME || 'CineSocial',
  driver: 'ODBC Driver 17 for SQL Server',
  options: {
    trustedConnection: true,
    trustServerCertificate: true,
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to SQL Server successfully.');
    return pool;
  })
  .catch(err => {
    console.log('Database Connection Failed! Bad Config: ', err);
    process.exit(1);
  });

module.exports = {
  sql,
  poolPromise
};
