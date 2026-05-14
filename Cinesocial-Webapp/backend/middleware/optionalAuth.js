const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('../config/db');

const optionalAuth = async (req, _res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, decoded.userId)
      .query('SELECT is_valid FROM Users WHERE User_ID = @userId');

    if (result.recordset.length > 0 && result.recordset[0].is_valid) {
      req.user = decoded;
    }
  } catch {
    // Public routes stay public; invalid tokens simply do not grant owner access.
  }

  next();
};

module.exports = optionalAuth;
