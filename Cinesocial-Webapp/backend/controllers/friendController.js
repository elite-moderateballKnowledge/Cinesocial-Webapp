const { poolPromise, sql } = require('../config/db');

exports.getFriends = async (req, res) => {
  const userId = req.user.userId;
  
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT u.User_ID, u.Username, u.Profile_Pic_URL, u.flair_label
        FROM Friends f
        JOIN Users u ON f.F_ID = u.User_ID
        WHERE f.U_ID = @userId
      `);
      
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addFriend = async (req, res) => {
  const { friendId } = req.body;
  const userId = req.user.userId;
  
  if (friendId === userId) return res.status(400).json({ message: 'Cannot add yourself' });
  
  try {
    const pool = await poolPromise;
    
    // Check if already friends
    const check = await pool.request()
      .input('userId', sql.Int, userId)
      .input('friendId', sql.Int, friendId)
      .query('SELECT * FROM Friends WHERE U_ID = @userId AND F_ID = @friendId');
      
    if (check.recordset.length > 0) return res.status(400).json({ message: 'Already friends' });
    
    // Bidirectional insert
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('friendId', sql.Int, friendId)
      .query(`
        INSERT INTO Friends (U_ID, F_ID) VALUES (@userId, @friendId);
        INSERT INTO Friends (U_ID, F_ID) VALUES (@friendId, @userId);
      `);
      
    res.json({ message: 'Friend added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
