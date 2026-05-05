const jwt = require('jsonwebtoken');

const verifyAdminToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(403).json({ message: 'Access denied. No token provided.' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(403).json({ message: 'Access denied. Invalid token format.' });

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    if (decoded.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required.' });
    }
    req.admin = decoded;
    next();
  } catch (ex) {
    res.status(403).json({ message: 'Invalid admin token.' });
  }
};

module.exports = verifyAdminToken;
