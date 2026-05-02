const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('../config/db');

const verifyToken = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ message: 'Access denied. No token provided.' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied. Invalid token format.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    // Check is_valid
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, decoded.userId)
      .query('SELECT is_valid FROM Users WHERE User_ID = @userId');
      
    if (result.recordset.length === 0 || !result.recordset[0].is_valid) {
      return res.status(403).json({ message: 'Account is banned or invalid.' });
    }
    
    next();
  } catch (ex) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

module.exports = verifyToken;
