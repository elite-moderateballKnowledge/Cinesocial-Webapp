const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('../config/db');

exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please provide all fields' });
  }

  try {
    const pool = await poolPromise;

    // Check if user exists
    const userCheck = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT User_ID FROM Users WHERE Email = @email');

    if (userCheck.recordset.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await pool.request()
      .input('username', sql.VarChar, username)
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, hashedPassword)
      .execute('sp_RegisterUser');

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Users WHERE Email = @email');

    const user = result.recordset[0];

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.is_banned) {
      return res.status(403).json({ message: 'Account is banned.' });
    }

    if (!user.is_valid) {
      return res.status(403).json({ message: 'Account is invalid.' });
    }

    const isMatch = await bcrypt.compare(password, user.Password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // UC-08 (F20) Subscription Expiry Check
    if (user.sub_ID && user.sub_exp) {
      if (new Date(user.sub_exp) < new Date()) {
        // Subscription expired
        await pool.request()
          .input('userId', sql.Int, user.User_ID)
          .query('UPDATE Users SET is_valid = 0 WHERE User_ID = @userId AND sub_exp < GETDATE() AND sub_ID IS NOT NULL');
          
        await pool.request()
          .input('userId', sql.Int, user.User_ID)
          .query("INSERT INTO Activity (User_ID, Action_Type, Details) VALUES (@userId, 'SUBSCRIPTION_EXPIRED', 'Subscription expired automatically')");
          
        return res.status(403).json({ message: 'Your subscription has expired. Account access is revoked.' });
      }
    }

    const payload = {
      userId: user.User_ID,
      role: 'user'
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Update last_login (UC-02 / Q1)
    await pool.request()
      .input('UsersID', sql.Int, user.User_ID)
      .execute('Q1');

    res.json({ token, user: { id: user.User_ID, username: user.Username, email: user.Email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
